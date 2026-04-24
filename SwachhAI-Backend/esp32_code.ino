#include <WiFi.h>
#include <HTTPClient.h>
#include <driver/i2s_std.h>

const char* ssid = "Airtel_Matrix 3.0 L3A";
const char* password = "Matrix@26L3A";
const char* serverUrl = "http://192.168.1.6:5000/api/sensors/update";
const char* sosCheckUrl = "http://192.168.1.6:5000/api/sensors/sos-status/W-05";
// --- HARDWARE PINS ---
const int SOS_PIN = 4;
const int BUZZER_PIN = 18; 
const int GAS_PIN = 34; 
const int TRIG_PIN = 5; 
const int ECHO_PIN = 14;

// --- 🎤 I2S MIC PINS ---
#define I2S_WS 15
#define I2S_SD 32
#define I2S_SCK 13

// --- CONFIGURATION ---
const int tankHeight = 10; 
const int SCREAM_THRESHOLD = 60000; 

// --- VARIABLES ---
bool isSirenActive = false;
unsigned long lastBuzzerToggle = 0;
bool buzzerState = LOW;
unsigned long lastUpdateInterval = 0; 
const unsigned long updateInterval = 3000; 

// 🆕 SOS polling timer
unsigned long lastSosCheck = 0;
const unsigned long sosCheckInterval = 3000;  // Server ko har 3 second me check karo

i2s_chan_handle_t rx_chan; 
unsigned long lastMicCheck = 0; 

// --- 🎤 Mic Setup ---
void setupMic() {
  i2s_chan_config_t rx_chan_cfg = I2S_CHANNEL_DEFAULT_CONFIG(I2S_NUM_0, I2S_ROLE_MASTER);
  i2s_new_channel(&rx_chan_cfg, NULL, &rx_chan);

  i2s_std_config_t rx_std_cfg = {
      .clk_cfg  = I2S_STD_CLK_DEFAULT_CONFIG(16000),
      .slot_cfg = I2S_STD_PHILIPS_SLOT_DEFAULT_CONFIG(I2S_DATA_BIT_WIDTH_32BIT, I2S_SLOT_MODE_MONO),
      .gpio_cfg = {
          .mclk = I2S_GPIO_UNUSED,
          .bclk = (gpio_num_t)I2S_SCK,
          .ws   = (gpio_num_t)I2S_WS,
          .dout = I2S_GPIO_UNUSED,
          .din  = (gpio_num_t)I2S_SD,
          .invert_flags = {
              .mclk_inv = false,
              .bclk_inv = false,
              .ws_inv   = false,
          },
      },
  };
  
  i2s_channel_init_std_mode(rx_chan, &rx_std_cfg);
  i2s_channel_enable(rx_chan);
}

void setup() {
  Serial.begin(115200);
  pinMode(SOS_PIN, INPUT_PULLUP);
  pinMode(BUZZER_PIN, OUTPUT);
  pinMode(TRIG_PIN, OUTPUT);
  pinMode(ECHO_PIN, INPUT);
  
  setupMic(); 
  
  WiFi.setSleep(false); 
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) { delay(500); Serial.print("."); }
  Serial.println("\n✅ WiFi Connected!");
}

int getDistance() {
  digitalWrite(TRIG_PIN, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG_PIN, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG_PIN, LOW);

  long duration = pulseIn(ECHO_PIN, HIGH, 30000); 
  if (duration == 0) return 0; 

  int distance = duration * 0.034 / 2;
  float level = (float)(tankHeight - distance) / tankHeight * 100;

  if (level < 0) level = 0;
  if (level > 100) level = 100;
  
  return (int)level; 
}

int getScreamLevel() {
  int32_t samples[64]; 
  size_t bytes_read = 0;
  int max_volume = 0;

  esp_err_t result = i2s_channel_read(rx_chan, samples, sizeof(samples), &bytes_read, 10);

  if (result == ESP_OK && bytes_read > 0) {
    int num_samples = bytes_read / 4;
    for (int i = 0; i < num_samples; i++) {
      int32_t val = abs(samples[i] >> 14); 
      if (val > max_volume) max_volume = val;
    }
  }
  return max_volume;
}

// 🆕 Server se check karo ki SOS abhi bhi active hai ya QR se resolve ho gaya
bool checkSosResolvedFromServer() {
  if (WiFi.status() != WL_CONNECTED) return false;
  
  HTTPClient http;
  http.setTimeout(2000);
  http.begin(sosCheckUrl);
  
  int responseCode = http.GET();
  
  if (responseCode == 200) {
    String response = http.getString();
    http.end();
    
    // Agar server bole "sosAlert": false → matlab QR se resolve ho gaya
    if (response.indexOf("false") > -1) {
      Serial.println("✅ Server: SOS resolved via QR! Buzzer OFF.");
      return true;  // Resolved!
    }
  } else {
    http.end();
  }
  
  return false;  // Still active
}

void loop() {
  // --- Mic check (only when buzzer off) ---
  int soundLevel = 0;
  if (!isSirenActive && (millis() - lastMicCheck > 50)) {
    soundLevel = getScreamLevel();
    lastMicCheck = millis();
  }

  // --- SOS Trigger (Button ya Scream) ---
  if ((digitalRead(SOS_PIN) == LOW || soundLevel > SCREAM_THRESHOLD) && !isSirenActive) {
    if (soundLevel > SCREAM_THRESHOLD) Serial.println("\n🗣️ MIC: LOUD SCREAM DETECTED!");
    else Serial.println("\n🚨 BUTTON: SOS PRESSED!");

    isSirenActive = true;
    digitalWrite(BUZZER_PIN, HIGH);
    buzzerState = HIGH;
    sendAlertToWeb(true, 0, 0);  // Server ko SOS alert bhejo
  }

  // --- 🆕 SOS Active: Buzzer chalao + Server poll karo ---
  if (isSirenActive) {
    // Buzzer toggle (siren effect)
    if (millis() - lastBuzzerToggle > 150) {
      buzzerState = !buzzerState;
      digitalWrite(BUZZER_PIN, buzzerState);
      lastBuzzerToggle = millis();
    }

    // 🆕 Har 3 second me server check karo — kya kisi ne QR se resolve kiya?
    if (millis() - lastSosCheck > sosCheckInterval) {
      if (checkSosResolvedFromServer()) {
        // QR se resolve ho gaya! Buzzer band karo
        isSirenActive = false;
        digitalWrite(BUZZER_PIN, LOW);
        Serial.println("🔕 Buzzer OFF — SOS resolved from QR scan!");
      }
      lastSosCheck = millis();
    }
  }

  // --- Regular Sensor Updates (jab SOS active nahi) ---
  if (!isSirenActive && (millis() - lastUpdateInterval > updateInterval)) {
    int gasLevel = analogRead(GAS_PIN);
    int waterPercentage = getDistance(); 
    
    Serial.print("\n📊 Dashboard -> Ammonia: ");
    Serial.print(gasLevel);
    Serial.print(" | Water: ");
    Serial.print(waterPercentage);
    Serial.println("%");

    sendAlertToWeb(false, gasLevel, waterPercentage); 
    lastUpdateInterval = millis();
  }
}

void sendAlertToWeb(bool isSos, int gasLevel, int waterLevel) {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.setTimeout(2000); 
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");
    
    String payload = "{\"washroomId\": \"W-05\"";
    
    if (isSos) {
      payload += ", \"sos\": true}"; 
    } else {
      payload += ", \"sos\": false, \"ammonia\": " + String(gasLevel);
      payload += ", \"water\": " + String(waterLevel) + "}";
    }
    
    int responseCode = http.POST(payload);
    Serial.println("🌐 Web Update Status: " + String(responseCode));
    http.end();
  }
}
