<p align="center">
  <h1 align="center">🏛️ CivicSync — Smart Public Sanitation Management Platform</h1>
  <p align="center">
    <b>IoT-Powered Real-Time Monitoring • Automated Dispatch • Citizen Engagement</b>
  </p>
  <p align="center">
    <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js" />
    <img src="https://img.shields.io/badge/Express-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express" />
    <img src="https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white" alt="MongoDB" />
    <img src="https://img.shields.io/badge/React-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
    <img src="https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
    <img src="https://img.shields.io/badge/ESP32-E7352C?style=for-the-badge&logo=espressif&logoColor=white" alt="ESP32" />
    <img src="https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
    <img src="https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  </p>
</p>

---

## 📖 About

**CivicSync** (formerly SwachhAI) is a full-stack **smart sanitation management platform** built for urban municipal bodies like the Municipal Corporation of Delhi (MCD). It bridges the gap between **IoT hardware sensors**, **backend intelligence**, and **citizen-facing portals** to deliver real-time hygiene monitoring, automated task dispatch, and transparent public accountability for public washrooms.

The platform connects ESP32-based IoT sensor nodes installed in public washrooms to a centralized dashboard, enabling:

- 🔴 **Real-time status tracking** (Green / Yellow / Red) based on sensor thresholds
- 🚨 **Automated SOS alerting** via physical panic buttons and scream detection (I2S microphone)
- 📲 **Instant Telegram notifications** to cleaning workers in Hindi
- 📊 **Predictive maintenance** using linear-regression-based resource depletion forecasting
- 🗺️ **Public Washroom Finder** with Google maps for citizens
- 🏆 **Leaderboard & Notice System** for officer accountability

---

## 🏗️ System Architecture

```
┌──────────────┐       HTTP POST        ┌─────────────────────────┐
│   ESP32 MCU  │ ─────────────────────► │   Node.js / Express     │
│  (Sensors)   │                        │   REST API Backend      │
│  • MQ135     │ ◄───── GET (SOS poll)  │                         │
│  • HC-SR04   │                        │   • Sensor Ingestion    │
│  • SOS Btn   │                        │   • Status Engine       │
│  • I2S Mic   │                        │   • Task Dispatch       │
└──────────────┘                        │   • Telegram Alerts     │
                                        │   • Auth (JWT + RBAC)   │
                                        └────────┬────────────────┘
                                                 │  MongoDB Atlas
                                                 │
                                        ┌────────▼────────────────┐
                                        │   React + TypeScript    │
                                        │   Frontend (Vite)       │
                                        │                         │
                                        │  • Admin Dashboard      │
                                        │  • Nodal Officer Panel  │
                                        │  • Public Portals       │
                                        │  • QR Cleaner Portal    │
                                        └─────────────────────────┘
```

---

## ✨ Features

### 🎛️ Admin Dashboard (MCD Super Admin)
| Feature | Description |
|---------|-------------|
| **Live Status Grid** | Real-time washroom status cards with Green/Yellow/Red indicators |
| **Live Map** | Leaflet-powered map showing all washroom locations with color-coded markers |
| **Dispatch Tracker** | Kanban-style task board (Open → In Progress → Resolved) with auto-created tickets |
| **Analytics** | Historical telemetry charts with configurable lookback periods (Recharts) |
| **Predictive Maintenance** | Linear regression forecasting for water & soap depletion with hours-left estimates |
| **Leaderboard** | Washroom rankings by citizen feedback with rating distributions |
| **Notice System** | Send formal performance notices to underperforming Nodal Officers |
| **User Management** | Create/delete Nodal Officers with washroom assignment |
| **Safety Monitor** | SOS alert monitoring and emergency response tracking |

### 👤 Nodal Officer Panel
- Scoped view of **only assigned washrooms**
- Manage **amenities** (hand rails, wheelchair access, sanitary pads, etc.)
- Receive **performance notices** from Super Admin
- View telemetry and analytics for their zone

### 🌐 Public Portals (No Login Required)
| Portal | Description |
|--------|-------------|
| **Washroom Finder** | Citizens search for nearby washrooms on an interactive Leaflet map with navigation links |
| **Feedback Portal** | Star-rating + issue tagging system for citizen reviews |
| **QR Cleaner Portal** | Workers scan a QR code at the washroom, enter their name, and resolve specific issues |

### 🔧 IoT Hardware (ESP32)
- **MQ135 Gas Sensor** — Monitors ammonia/odor levels
- **HC-SR04 Ultrasonic Sensor** — Measures water tank fill level
- **Physical SOS Button** — Emergency panic alert
- **INMP441 I2S Microphone** — Scream/loud-noise detection for auto-SOS
- **Active Buzzer** — Siren effect during SOS, auto-stops when resolved via QR

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Node.js, Express 5, Mongoose 9 |
| **Database** | MongoDB Atlas |
| **Frontend** | React 19, TypeScript, Vite 7 |
| **Styling** | Tailwind CSS 3 |
| **Maps** | Leaflet + React-Leaflet |
| **Charts** | Recharts |
| **QR Codes** | qrcode.react |
| **Auth** | JWT (jsonwebtoken) + bcryptjs |
| **Notifications** | Telegram Bot API |
| **Hardware** | ESP32 (Arduino/C++), I2S Driver |
| **Icons** | Lucide React |

---

## 📁 Project Structure

```
SwachhAI-Backend/
├── SwachhAI-Backend/
│   ├── server.js                 # Main Express server (all API routes)
│   ├── package.json              # Backend dependencies
│   ├── esp32_code.ino            # ESP32 Arduino firmware
│   ├── .env                      # Environment variables (not in repo)
│   │
│   ├── models/
│   │   ├── Washroom.js           # Washroom schema (sensors, amenities, location)
│   │   ├── User.js               # User schema (RBAC, bcrypt hashing)
│   │   ├── Task.js               # Dispatch task tickets
│   │   ├── TelemetryLog.js       # Historical sensor snapshots
│   │   ├── Feedback.js           # Citizen feedback/ratings
│   │   └── Notice.js             # Admin → Officer notice system
│   │
│   ├── routes/
│   │   └── authRoutes.js         # Login, Register, User CRUD
│   │
│   ├── middleware/
│   │   └── authMiddleware.js     # JWT verification + role-based access
│   │
│   ├── utils/
│   │   └── telegramBot.js        # Telegram Bot alert utility
│   │
│   └── swachhai-frontend/        # React + Vite frontend
│       ├── src/
│       │   ├── App.tsx           # Routing & layout
│       │   ├── main.tsx          # Entry point
│       │   ├── context/
│       │   │   └── AuthContext.tsx
│       │   └── pages/
│       │       ├── Dashboard.tsx
│       │       ├── LiveMap.tsx
│       │       ├── Dispatch.tsx
│       │       ├── Analytics.tsx
│       │       ├── PredictiveMaintenance.tsx
│       │       ├── Safety.tsx
│       │       ├── Leaderboard.tsx
│       │       ├── ManageUsers.tsx
│       │       ├── Login.tsx
│       │       ├── WashroomFinder.tsx    # Public
│       │       ├── FeedbackPortal.tsx    # Public
│       │       ├── CleanerResolve.tsx    # QR Worker Portal
│       │       └── UnifiedQR.tsx        # QR Code Generator
│       ├── package.json
│       ├── vite.config.ts
│       ├── tailwind.config.js
│       └── tsconfig.json
│
├── .gitignore
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18+ and npm
- **MongoDB Atlas** account (or local MongoDB instance)
- **Telegram Bot Token** (create via [@BotFather](https://t.me/BotFather))

### 1. Clone the Repository

```bash
git clone https://github.com/jeetyaduvanshi/CivicSync.git
cd CivicSync
```

### 2. Backend Setup

```bash
cd SwachhAI-Backend
npm install
```

Create a `.env` file in the `SwachhAI-Backend/` directory:

```env
MONGO_URI=mongodb+srv://<username>:<password>@cluster.mongodb.net/civicsync
JWT_SECRET=your_jwt_secret_key
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_CHAT_ID=your_telegram_chat_id
PORT=5000
FRONTEND_URL=http://localhost:5173
```

Start the backend server:

```bash
npx nodemon server.js
```

> The server will auto-seed a default Super Admin account:  
> **Email:** `admin@CivicSync.in` **|** **Password:** `admin123`

### 3. Frontend Setup

```bash
cd swachhai-frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:5173`.

### 4. ESP32 Setup (Optional — for Hardware Integration)

1. Open `esp32_code.ino` in **Arduino IDE**
2. Update WiFi credentials (`ssid`, `password`)
3. Set `serverUrl` to your backend's IP (e.g., `http://192.168.1.x:5000/api/sensors/update`)
4. Set `sosCheckUrl` to `http://192.168.1.x:5000/api/sensors/sos-status/W-05`
5. Install required board: **ESP32 by Espressif** (via Board Manager)
6. Upload to ESP32

**Wiring:**
| Component | ESP32 Pin |
|-----------|-----------|
| MQ135 (Analog Out) | GPIO 34 |
| HC-SR04 Trig | GPIO 5 |
| HC-SR04 Echo | GPIO 14 |
| SOS Button | GPIO 4 (INPUT_PULLUP) |
| Buzzer | GPIO 18 |
| INMP441 WS | GPIO 15 |
| INMP441 SD | GPIO 32 |
| INMP441 SCK | GPIO 13 |

---

## 🔌 API Reference

### Authentication
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/auth/login` | ❌ | Login with email & password |
| GET | `/api/auth/me` | ✅ | Get current user info |
| POST | `/api/auth/register` | ✅ Admin | Create a Nodal Officer |
| GET | `/api/auth/users` | ✅ Admin | List all users |
| DELETE | `/api/auth/users/:id` | ✅ Admin | Delete a user |

### Sensor / IoT Gateway
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/sensor` | ❌ | ESP32 raw data gateway (multi-format) |
| POST | `/api/sensors/update` | ❌ | ESP32 sensor update (preferred) |
| GET | `/api/sensors/sos-status/:washroomId` | ❌ | ESP32 polls SOS state |
| POST | `/api/sensors/resolve` | ❌ | QR-based issue resolution |
| GET | `/api/sensors/status` | ✅ | Get all washroom statuses (role-filtered) |

### Tasks (Dispatch)
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/tasks` | ✅ | List tasks (filter by status) |
| POST | `/api/tasks` | ✅ | Create task manually |
| PUT | `/api/tasks/:id/assign` | ✅ | Assign worker to task |
| PUT | `/api/tasks/:id/resolve` | ❌ | Resolve a task |

### Analytics & Intelligence
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/analytics` | ✅ | Historical telemetry data |
| GET | `/api/predictive` | ✅ | Depletion forecasts |
| GET | `/api/leaderboard` | ✅ | Washroom rankings by feedback |
| POST | `/api/leaderboard/request-report` | ✅ | Request report from officer |

### Public Portals
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | `/api/public/washrooms` | ❌ | Search washrooms (citizen finder) |
| POST | `/api/feedback/submit` | ❌ | Submit citizen feedback |
| GET | `/api/feedback/stream` | ✅ | View feedback stream |

### Amenities & Notices
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| PATCH | `/api/washrooms/:id/amenities` | ✅ | Update washroom amenities |
| POST | `/api/notices` | ✅ Admin | Send performance notice |
| GET | `/api/notices` | ✅ | Get notices (role-filtered) |
| PATCH | `/api/notices/:id/read` | ✅ | Mark notice as read |

---

## 🔐 Role-Based Access Control (RBAC)

| Role | Scope |
|------|-------|
| **MCD_SUPER_ADMIN** | Full access to all washrooms, user management, notices, leaderboard |
| **NODAL_OFFICER** | Access limited to assigned washrooms only. Can manage amenities and view their notices |

---

## 📡 How the Sensor Pipeline Works

```
ESP32 Sensors → HTTP POST → /api/sensors/update
                                    │
                    ┌───────────────┤
                    ▼               ▼
            Update Washroom    Log Telemetry
            Status in DB       Snapshot
                    │
                    ▼
            Status ≠ Green?
              ┌─────┴─────┐
              ▼            ▼
        Create Task   Send Telegram
        (if none)     Alert to Workers
```

**Status Thresholds:**
- 🟢 **Green** — All sensors nominal
- 🟡 **Yellow** — Water < 20% OR Ammonia > 1000
- 🔴 **Red** — SOS Alert active

**SOS Safety Rule:** SOS can only be **activated** by the ESP32 sensor endpoint. It can only be **deactivated** via the QR scan resolution portal (`/api/sensors/resolve`). This prevents regular ESP32 polling (which sends `sos: false`) from accidentally clearing an active emergency.

---

## 📱 QR Code Workflow

1. Admin generates **QR code** for each washroom from the dashboard
2. QR is **printed and placed** at the washroom entrance
3. Cleaning worker **scans the QR** with their phone — opens the Cleaner Portal
4. Worker enters their **name** and selects the action performed:
   - Clean Ammonia / Refill Soap / Refill Water / Resolve SOS / Reset All
5. Task is **auto-resolved** and worker's name is logged
6. If ESP32 buzzer is active, it **auto-stops** on next server poll

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the ISC License.

---

## 👨‍💻 Author

**Jeet Yaduvanshi**  
GitHub: [@jeetyaduvanshi](https://github.com/jeetyaduvanshi)

---

<p align="center">
  <b>Built with ❤️ for Swachh Bharat</b>
</p>
