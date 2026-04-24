const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
app.use(express.json());
app.use(cors());

// MongoDB connection
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log("✅ CivicSync: MongoDB Connected Successfully!"))
    .catch(err => console.error("❌ DB Connection Error:", err));

// Models
const Washroom = require('./models/Washroom');
const User = require('./models/User');
const TelemetryLog = require('./models/TelemetryLog');
const Task = require('./models/Task');
const Feedback = require('./models/Feedback');
const Notice = require('./models/Notice');

// Auth
const authRoutes = require('./routes/authRoutes');
const { authMiddleware } = require('./middleware/authMiddleware');
const { sendTelegramAlert } = require('./utils/telegramBot');

app.get('/', (req, res) => {
    res.send("CivicSync Backend is Running...");
});

// ── Quick Telegram connectivity test (no auth needed) ──
app.get('/api/test-telegram', async (req, res) => {
    console.log('📨 Testing Telegram...');
    console.log('Bot Token:', process.env.TELEGRAM_BOT_TOKEN ? '✅ Set' : '❌ MISSING');
    console.log('Chat ID:', process.env.TELEGRAM_CHAT_ID ? '✅ Set' : '❌ MISSING');
    const result = await sendTelegramAlert('🔔 CivicSync Test: Telegram connection is working!');
    res.json({ success: result, botToken: !!process.env.TELEGRAM_BOT_TOKEN, chatId: process.env.TELEGRAM_CHAT_ID });
});

// ────────── Auth Routes ──────────
app.use('/api/auth', authRoutes);

// ────────── ESP32 IoT Gateway (Raw Hardware → CivicSync) ──────────
// ESP32 sends data here. This route translates raw sensor payloads
// into the format our system understands and triggers the full pipeline.
//
// Supported ESP32 payloads:
//   { sensor: "SOS_BUTTON", status: "ALERT", washroomId: "W-01" }
//   { sensor: "MQ135", ammonia: 150, washroomId: "W-01" }
//   { sensor: "WATER_LEVEL", water: 30, washroomId: "W-01" }
//   { sensor: "SOAP_LEVEL", soap: 15, washroomId: "W-01" }
//   { sensor: "ALL", ammonia: 50, water: 80, soap: 90, sos: false, washroomId: "W-01" }
//
app.post('/api/sensor', async (req, res) => {
    try {
        const sensorData = req.body;
        const washroomId = sensorData.washroomId || 'W-01';  // Default if ESP32 doesn't send ID

        console.log(`\n📡 ESP32 Data Received [${washroomId}]:`, JSON.stringify(sensorData));

        // First, get current washroom state so we only update what ESP32 sent
        let existing = await Washroom.findOne({ washroomId });
        const currentSensors = existing?.sensors || {
            ammonia: 0, waterLevel: 100, soapLevel: 100, sosAlert: false
        };

        // Build the update payload — merge ESP32 data with existing state
        let ammonia = currentSensors.ammonia;
        let water = currentSensors.waterLevel;
        let soap = currentSensors.soapLevel;
        let sos = currentSensors.sosAlert;

        // Handle different ESP32 sensor types
        if (sensorData.sensor === 'SOS_BUTTON') {
            console.log("\n🚨 🚨 🚨 EMERGENCY SOS TRIGGERED IN WASHROOM! 🚨 🚨 🚨");
            console.log(`Status: ${sensorData.status}`);
            console.log(`Message: ${sensorData.message || 'Emergency!'}\n`);
            sos = (sensorData.status === 'ALERT' || sensorData.status === true);
        }
        else if (sensorData.sensor === 'MQ135' || sensorData.sensor === 'AMMONIA') {
            ammonia = sensorData.ammonia ?? sensorData.value ?? ammonia;
        }
        else if (sensorData.sensor === 'WATER_LEVEL') {
            water = sensorData.water ?? sensorData.value ?? water;
        }
        else if (sensorData.sensor === 'SOAP_LEVEL') {
            soap = sensorData.soap ?? sensorData.value ?? soap;
        }
        else if (sensorData.sensor === 'ALL' || !sensorData.sensor) {
            // ESP32 sending all readings at once
            ammonia = sensorData.ammonia ?? ammonia;
            water = sensorData.water ?? water;
            soap = sensorData.soap ?? soap;
            sos = sensorData.sos ?? sos;
        }

        // Calculate status
        let currentStatus = 'Green';
        if (water < 20 || ammonia > 1000) currentStatus = 'Yellow';
        if (sos === true) currentStatus = 'Red';

        // Update washroom in DB
        let updateFields = {
            "sensors.ammonia": ammonia,
            "sensors.waterLevel": water,
            "sensors.soapLevel": soap,
            "sensors.sosAlert": sos,
            status: currentStatus,
            lastUpdated: Date.now()
        };
        if (sensorData.lat !== undefined) updateFields.lat = sensorData.lat;
        if (sensorData.lng !== undefined) updateFields.lng = sensorData.lng;
        if (sensorData.locationName !== undefined) updateFields.locationName = sensorData.locationName;

        const data = await Washroom.findOneAndUpdate(
            { washroomId },
            { $set: updateFields },
            { new: true, upsert: true }
        );

        // Auto-create Task ticket + Telegram alert if not Green
        if (currentStatus !== 'Green') {
            const existingTask = await Task.findOne({
                washroomId,
                status: { $in: ['open', 'in_progress'] }
            });

            const locName = data.locationName || washroomId;
            const qrLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cleaner/${washroomId}`;
            const severityEmoji = currentStatus === 'Red' ? '🔴' : '🟡';
            let issue = 'Needs Inspection';
            if (sos === true) issue = 'SOS Alert';
            else if (ammonia > 1000) issue = 'High Ammonia/Odor';
            else if (water < 20) issue = 'Low Water';

            const workerAlert = `${severityEmoji} नया काम - ${locName}\n\nसमस्या: ${issue}\n\nकृपया तुरंत जाएं और काम पूरा करके QR scan करें:\n${qrLink}`;
            sendTelegramAlert(workerAlert);

            if (!existingTask) {
                await Task.create({
                    washroomId,
                    locationName: locName,
                    issue,
                    severity: currentStatus
                });
            }
        }

        // Save telemetry snapshot
        await TelemetryLog.create({
            washroomId,
            locationName: data.locationName,
            status: currentStatus,
            sensors: { ammonia, waterLevel: water, soapLevel: soap, sosAlert: sos }
        });

        console.log(`✅ [${washroomId}] Status: ${currentStatus} | NH3: ${ammonia} | Water: ${water}% | Soap: ${soap}% | SOS: ${sos}`);

        res.status(200).json({
            success: true,
            message: "ESP32 data processed successfully!",
            washroomId,
            status: currentStatus,
            data
        });
    } catch (err) {
        console.error("❌ ESP32 Gateway Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ────────── Sensor Update (from Hardware — no auth needed) ──────────
// ESP32 payload: { washroomId: "W-05", sos: true/false, ammonia: <int>, water: <int> }
// Note: ESP32 may not send all fields (e.g. soap is not connected).
// Only fields present in the payload are updated; missing fields retain their DB value.
app.post('/api/sensors/update', async (req, res) => {
    try {
        const { washroomId, ammonia, water, soap, sos, lat, lng, locationName } = req.body;

        if (!washroomId) {
            return res.status(400).json({ success: false, error: 'washroomId is required' });
        }

        // ✅ CRITICAL FIX: SOS can only be ACTIVATED here, never deactivated.
        // Only /api/sensors/resolve (QR scan) can clear SOS.
        // This prevents ESP32 regular updates (which send sos:false) from clearing an active SOS.
        const existing = await Washroom.findOne({ washroomId }).select('sensors').lean();
        const currentSensors = existing?.sensors || {
            ammonia: 0, waterLevel: 100, soapLevel: 100, sosAlert: false
        };
        const dbSosActive = currentSensors.sosAlert || false;

        // If ESP32 sends sos:true → activate SOS. Otherwise keep whatever DB has.
        const effectiveSos = (sos === true) ? true : dbSosActive;

        // Merge: only update fields the ESP32 actually sent, keep DB values for the rest
        const effectiveAmmonia = (ammonia !== undefined) ? ammonia : currentSensors.ammonia;
        const effectiveWater = (water !== undefined) ? water : currentSensors.waterLevel;
        const effectiveSoap = (soap !== undefined) ? soap : currentSensors.soapLevel;

        let currentStatus = 'Green';
        if (effectiveWater < 20 || effectiveAmmonia > 1000) currentStatus = 'Yellow';
        if (effectiveSos === true) currentStatus = 'Red';

        let updateFields = {
            "sensors.ammonia": effectiveAmmonia,
            "sensors.waterLevel": effectiveWater,
            "sensors.soapLevel": effectiveSoap,
            "sensors.sosAlert": effectiveSos,
            status: currentStatus,
            lastUpdated: Date.now()
        };

        if (lat !== undefined) updateFields.lat = lat;
        if (lng !== undefined) updateFields.lng = lng;
        if (locationName !== undefined) updateFields.locationName = locationName;

        const data = await Washroom.findOneAndUpdate(
            { washroomId },
            { $set: updateFields },
            { new: true, upsert: true }
        );

        // Auto-create a Task ticket if washroom entered Yellow/Red and no active task exists
        if (currentStatus !== 'Green') {
            const existingTask = await Task.findOne({
                washroomId,
                status: { $in: ['open', 'in_progress'] }
            });

            // Always send Telegram alert on every Yellow/Red sensor update
            const locName = data.locationName || locationName || 'Unknown Location';
            const qrLink = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/cleaner/${washroomId}`;
            const severityEmoji = currentStatus === 'Red' ? '🔴' : '🟡';
            let issue = 'Needs Inspection';
            if (sos === true) issue = 'SOS Alert';
            else if (effectiveAmmonia > 1000) issue = 'High Ammonia/Odor';
            else if (effectiveWater < 20) issue = 'Low Water';

            const workerAlert = `${severityEmoji} नया काम - ${locName}\n\nसमस्या: ${issue}\n\nकृपया तुरंत जाएं और काम पूरा करके नीचे दिए QR लिंक से रिपोर्ट करें:\n${qrLink}`;
            sendTelegramAlert(workerAlert);

            if (!existingTask) {
                await Task.create({
                    washroomId,
                    locationName: data.locationName || locationName || 'Unknown Location',
                    issue,
                    severity: currentStatus
                });
            }
        }

        // Save historical snapshot in TelemetryLog
        await TelemetryLog.create({
            washroomId,
            locationName: data.locationName,
            status: currentStatus,
            sensors: {
                ammonia: effectiveAmmonia,
                waterLevel: effectiveWater,
                soapLevel: effectiveSoap,
                sosAlert: effectiveSos
            }
        });

        console.log(`✅ [${washroomId}] Status: ${currentStatus} | NH3: ${effectiveAmmonia} | Water: ${effectiveWater}% | Soap: ${effectiveSoap}% | SOS: ${effectiveSos}`);

        res.status(200).json({ success: true, message: "Data Updated!", data });
    } catch (err) {
        console.error("❌ Sensor Update Error:", err.message);
        res.status(500).json({ success: false, error: err.message });
    }
});

// ────────── Analytics API ──────────
app.get('/api/analytics', authMiddleware, async (req, res) => {
    try {
        const { washroomId, days } = req.query;
        const lookbackDays = parseInt(days) || 7;
        const since = new Date(Date.now() - lookbackDays * 24 * 60 * 60 * 1000);

        let query = { timestamp: { $gte: since } };

        // Optional washroom filter
        if (washroomId) {
            query.washroomId = washroomId;
        }

        // Role-based filtering: Nodal officers only see assigned washrooms
        if (req.user.role === 'NODAL_OFFICER') {
            if (req.user.assignedWashrooms.length === 0) {
                return res.status(200).json([]);
            }
            if (washroomId) {
                // Ensure the requested washroom is in their assignments
                if (!req.user.assignedWashrooms.includes(washroomId)) {
                    return res.status(403).json({ error: 'Not authorized for this washroom' });
                }
            } else {
                query.washroomId = { $in: req.user.assignedWashrooms };
            }
        }

        const logs = await TelemetryLog.find(query)
            .sort({ timestamp: 1 })
            .lean();

        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────── Predictive Maintenance API ──────────
app.get('/api/predictive', authMiddleware, async (req, res) => {
    try {
        const since = new Date(Date.now() - 24 * 60 * 60 * 1000); // last 24h

        let query = { timestamp: { $gte: since } };

        // Role-based filtering
        if (req.user.role === 'NODAL_OFFICER') {
            if (req.user.assignedWashrooms.length === 0) {
                return res.status(200).json([]);
            }
            query.washroomId = { $in: req.user.assignedWashrooms };
        }

        const logs = await TelemetryLog.find(query)
            .sort({ timestamp: 1 })
            .lean();

        // Group logs by washroom
        const grouped = {};
        logs.forEach(log => {
            if (!grouped[log.washroomId]) grouped[log.washroomId] = [];
            grouped[log.washroomId].push(log);
        });

        // Get current washroom data for location names
        let washroomQuery = {};
        if (req.user.role === 'NODAL_OFFICER') {
            washroomQuery = { washroomId: { $in: req.user.assignedWashrooms } };
        }
        const washrooms = await Washroom.find(washroomQuery).lean();
        const washroomMap = {};
        washrooms.forEach(w => { washroomMap[w.washroomId] = w; });

        // Calculate depletion rate using linear regression
        function linearRegression(points) {
            // points = [{ t: hours_since_start, v: value }]
            const n = points.length;
            if (n < 2) return { slope: 0, intercept: points[0]?.v || 0 };

            let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
            points.forEach(p => {
                sumX += p.t;
                sumY += p.v;
                sumXY += p.t * p.v;
                sumXX += p.t * p.t;
            });

            const denom = n * sumXX - sumX * sumX;
            if (denom === 0) return { slope: 0, intercept: sumY / n };

            const slope = (n * sumXY - sumX * sumY) / denom;
            const intercept = (sumY - slope * sumX) / n;
            return { slope, intercept };
        }

        const predictions = [];

        for (const [washroomId, washroomLogs] of Object.entries(grouped)) {
            if (washroomLogs.length < 2) continue; // Need at least 2 data points

            const firstTs = new Date(washroomLogs[0].timestamp).getTime();

            // Build data points (time in hours since first log)
            const waterPoints = washroomLogs.map(l => ({
                t: (new Date(l.timestamp).getTime() - firstTs) / (1000 * 60 * 60),
                v: l.sensors.waterLevel
            }));
            const soapPoints = washroomLogs.map(l => ({
                t: (new Date(l.timestamp).getTime() - firstTs) / (1000 * 60 * 60),
                v: l.sensors.soapLevel
            }));

            const waterReg = linearRegression(waterPoints);
            const soapReg = linearRegression(soapPoints);

            // Current values
            const latest = washroomLogs[washroomLogs.length - 1];
            const currentWater = latest.sensors.waterLevel;
            const currentSoap = latest.sensors.soapLevel;
            const currentT = (new Date(latest.timestamp).getTime() - firstTs) / (1000 * 60 * 60);

            // Depletion rate (negative slope = depleting)
            const waterRate = Math.max(0, -waterReg.slope); // units/hour loss rate
            const soapRate = Math.max(0, -soapReg.slope);

            // Hours until reaching 0
            let waterHoursLeft = null;
            let soapHoursLeft = null;

            if (waterRate > 0.01) {
                // Use current level / rate for remaining hours
                waterHoursLeft = Math.max(0, currentWater / waterRate);
                if (waterHoursLeft > 999) waterHoursLeft = null;  // essentially stable
            }
            if (soapRate > 0.01) {
                soapHoursLeft = Math.max(0, currentSoap / soapRate);
                if (soapHoursLeft > 999) soapHoursLeft = null;
            }

            // Build trend data for charts (hourly buckets)
            const trendBuckets = new Map();
            washroomLogs.forEach(l => {
                const d = new Date(l.timestamp);
                const key = `${d.getHours()}:00`;
                if (!trendBuckets.has(key)) {
                    trendBuckets.set(key, { water: [], soap: [] });
                }
                trendBuckets.get(key).water.push(l.sensors.waterLevel);
                trendBuckets.get(key).soap.push(l.sensors.soapLevel);
            });

            const waterTrend = [];
            const soapTrend = [];
            for (const [key, bucket] of trendBuckets) {
                const avgW = Math.round(bucket.water.reduce((a, b) => a + b, 0) / bucket.water.length);
                const avgS = Math.round(bucket.soap.reduce((a, b) => a + b, 0) / bucket.soap.length);
                waterTrend.push({ time: key, value: avgW });
                soapTrend.push({ time: key, value: avgS });
            }

            const wInfo = washroomMap[washroomId] || {};

            predictions.push({
                washroomId,
                locationName: wInfo.locationName || latest.locationName || 'Unknown',
                currentWater,
                currentSoap,
                waterDepletionRate: Math.round(waterRate * 10) / 10,
                soapDepletionRate: Math.round(soapRate * 10) / 10,
                waterHoursLeft: waterHoursLeft !== null ? Math.round(waterHoursLeft * 10) / 10 : null,
                soapHoursLeft: soapHoursLeft !== null ? Math.round(soapHoursLeft * 10) / 10 : null,
                waterTrend,
                soapTrend,
            });
        }

        // Sort by urgency (lowest hours left first)
        predictions.sort((a, b) => {
            const aMin = Math.min(a.waterHoursLeft ?? 9999, a.soapHoursLeft ?? 9999);
            const bMin = Math.min(b.waterHoursLeft ?? 9999, b.soapHoursLeft ?? 9999);
            return aMin - bMin;
        });

        res.status(200).json(predictions);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────── SOS Status Check (ESP32 polls this to know when to stop buzzer) ──────────
app.get('/api/sensors/sos-status/:washroomId', async (req, res) => {
    try {
        const washroom = await Washroom.findOne({ washroomId: req.params.washroomId }).lean();
        if (!washroom) return res.status(404).json({ sosAlert: false });
        res.status(200).json({ sosAlert: washroom.sensors?.sosAlert || false });
    } catch (err) {
        res.status(500).json({ sosAlert: false });
    }
});

// ────────── Resolve / Mark as Cleaned (from QR Code — no auth needed) ──────────
app.post('/api/sensors/resolve', async (req, res) => {
    try {
        const { washroomId, action, workerName } = req.body;
        if (!washroomId) {
            return res.status(400).json({ success: false, error: 'washroomId is required' });
        }

        let updateQuery = { lastUpdated: Date.now() };

        if (action === 'clean_ammonia') {
            updateQuery["sensors.ammonia"] = 0;
        } else if (action === 'refill_soap') {
            updateQuery["sensors.soapLevel"] = 100;
        } else if (action === 'refill_water') {
            updateQuery["sensors.waterLevel"] = 100;
        } else if (action === 'resolve_sos') {
            updateQuery["sensors.sosAlert"] = false;
        } else if (action === 'reset_all') {
            updateQuery["sensors.ammonia"] = 0;
            updateQuery["sensors.soapLevel"] = 100;
            updateQuery["sensors.waterLevel"] = 100;
            updateQuery["sensors.sosAlert"] = false;
        } else {
            // Default backward compatibility if no action provided
            updateQuery["sensors.ammonia"] = 0;
            updateQuery["sensors.soapLevel"] = 100;
            updateQuery["sensors.waterLevel"] = 100;
            updateQuery["sensors.sosAlert"] = false;
        }

        let washroom = await Washroom.findOneAndUpdate(
            { washroomId },
            { $set: updateQuery },
            { new: true }
        );

        if (!washroom) {
            return res.status(404).json({ success: false, error: 'Washroom not found' });
        }

        // Re-evaluate overall washroom status based on remaining sensor states
        let currentStatus = 'Green';
        if (washroom.sensors.waterLevel < 20 || washroom.sensors.ammonia > 1000) {
            currentStatus = 'Yellow';
        }
        if (washroom.sensors.sosAlert === true) {
            currentStatus = 'Red';
        }

        if (washroom.status !== currentStatus) {
            washroom.status = currentStatus;
            await washroom.save();
        }

        // Always resolve open/in_progress tasks when a worker performs any QR action.
        // If issues remain (washroom still Yellow/Red), the next sensor update will
        // create a fresh task automatically — so the worker's action is always logged.
        const taskUpdateFields = {
            status: 'resolved',
            resolvedAt: new Date()
        };
        if (workerName && workerName.trim()) {
            taskUpdateFields.assignedTo = workerName.trim();
            taskUpdateFields.assignedAt = new Date();
        }
        await Task.updateMany(
            { washroomId, status: { $in: ['open', 'in_progress'] } },
            { $set: taskUpdateFields }
        );

        res.status(200).json({ success: true, message: 'Action successfully logged!', data: washroom });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ────────── Task API (Kanban Ticketing) ──────────

// List tasks — filter by ?status=open,in_progress,resolved
app.get('/api/tasks', authMiddleware, async (req, res) => {
    try {
        let query = {};

        // Status filter
        if (req.query.status) {
            const statuses = req.query.status.split(',');
            query.status = { $in: statuses };
        }

        // Role-based filtering
        if (req.user.role === 'NODAL_OFFICER') {
            if (req.user.assignedWashrooms.length === 0) {
                return res.status(200).json([]);
            }
            query.washroomId = { $in: req.user.assignedWashrooms };
        }

        const tasks = await Task.find(query).sort({ createdAt: -1 }).lean();
        res.status(200).json(tasks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Create a task manually
app.post('/api/tasks', authMiddleware, async (req, res) => {
    try {
        const { washroomId, issue, severity } = req.body;
        if (!washroomId || !issue) {
            return res.status(400).json({ error: 'washroomId and issue are required' });
        }

        // De-duplicate: check if active task exists
        const existing = await Task.findOne({
            washroomId,
            status: { $in: ['open', 'in_progress'] }
        });
        if (existing) {
            return res.status(409).json({ error: 'An active task already exists for this washroom', task: existing });
        }

        // Grab location name from washroom record
        const washroom = await Washroom.findOne({ washroomId });
        const task = await Task.create({
            washroomId,
            locationName: washroom?.locationName || 'Unknown Location',
            issue,
            severity: severity || 'Yellow'
        });

        res.status(201).json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Assign a worker to a task
app.put('/api/tasks/:taskId/assign', authMiddleware, async (req, res) => {
    try {
        const { assignedTo } = req.body;
        if (!assignedTo || !assignedTo.trim()) {
            return res.status(400).json({ error: 'assignedTo (worker name) is required' });
        }

        const task = await Task.findByIdAndUpdate(
            req.params.taskId,
            {
                $set: {
                    status: 'in_progress',
                    assignedTo: assignedTo.trim(),
                    assignedAt: new Date()
                }
            },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Resolve a task (can be called from QR flow or manually)
app.put('/api/tasks/:taskId/resolve', async (req, res) => {
    try {
        const task = await Task.findByIdAndUpdate(
            req.params.taskId,
            {
                $set: {
                    status: 'resolved',
                    resolvedAt: new Date()
                }
            },
            { new: true }
        );

        if (!task) {
            return res.status(404).json({ error: 'Task not found' });
        }

        res.status(200).json(task);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────── Sensor Status (Protected + Role-filtered) ──────────
app.get('/api/sensors/status', authMiddleware, async (req, res) => {
    try {
        let query = {};

        // Nodal Officers only see their assigned washrooms
        if (req.user.role === 'NODAL_OFFICER') {
            if (req.user.assignedWashrooms.length === 0) {
                return res.status(200).json([]);
            }
            query = { washroomId: { $in: req.user.assignedWashrooms } };
        }

        const washrooms = await Washroom.find(query).lean();

        // Recalculate status on-the-fly with current thresholds
        const result = washrooms.map(w => {
            let freshStatus = 'Green';
            if (w.sensors.waterLevel < 20 || w.sensors.ammonia > 1000) freshStatus = 'Yellow';
            if (w.sensors.sosAlert === true) freshStatus = 'Red';
            return { ...w, status: freshStatus };
        });

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────── Public Washroom Finder (No auth — for citizens) ──────────
app.get('/api/public/washrooms', async (req, res) => {
    try {
        const { search } = req.query;
        let query = {};
        if (search && search.trim()) {
            query = {
                $or: [
                    { locationName: { $regex: search.trim(), $options: 'i' } },
                    { washroomId: { $regex: search.trim(), $options: 'i' } }
                ]
            };
        }

        const washrooms = await Washroom.find(query).lean();

        // Recalculate status on the fly
        const result = washrooms.map(w => {
            let freshStatus = 'Green';
            if (w.sensors.waterLevel < 20 || w.sensors.ammonia > 1000) freshStatus = 'Yellow';
            if (w.sensors.sosAlert === true) freshStatus = 'Red';
            return {
                washroomId: w.washroomId,
                locationName: w.locationName,
                lat: w.lat,
                lng: w.lng,
                status: freshStatus,
                amenities: w.amenities || {},
                lastUpdated: w.lastUpdated
            };
        });

        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────── Update Amenities (Nodal Officer only) ──────────
app.patch('/api/washrooms/:washroomId/amenities', authMiddleware, async (req, res) => {
    try {
        const { washroomId } = req.params;
        const amenities = req.body;

        // Verify officer is assigned to this washroom (or is admin)
        if (req.user.role === 'NODAL_OFFICER') {
            if (!req.user.assignedWashrooms.includes(washroomId)) {
                return res.status(403).json({ error: 'You are not assigned to this washroom' });
            }
        }

        const updateFields = {};
        const validKeys = ['handRails', 'sanitaryPads', 'wheelchairAccess', 'babyChanging', 'drinkingWater', 'mirror', 'westernToilet', 'indianToilet'];
        for (const key of validKeys) {
            if (amenities[key] !== undefined) {
                updateFields[`amenities.${key}`] = Boolean(amenities[key]);
            }
        }

        const washroom = await Washroom.findOneAndUpdate(
            { washroomId },
            { $set: updateFields },
            { new: true }
        );

        if (!washroom) {
            return res.status(404).json({ error: 'Washroom not found' });
        }

        res.status(200).json({ success: true, amenities: washroom.amenities });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────── Public Feedback Submit ──────────
app.post('/api/feedback/submit', async (req, res) => {
    try {
        const { washroomId, rating, issues } = req.body;
        if (!washroomId || !rating) {
            return res.status(400).json({ success: false, error: 'washroomId and rating are required' });
        }
        const feedback = await Feedback.create({ washroomId, rating, issues });
        res.status(200).json({ success: true, data: feedback });
    } catch (err) {
        res.status(500).json({ success: false, error: err.message });
    }
});

// ────────── Feedback Stream (Protected + Role-filtered) ──────────
app.get('/api/feedback/stream', authMiddleware, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'NODAL_OFFICER') {
            if (req.user.assignedWashrooms.length === 0) {
                return res.status(200).json([]);
            }
            query = { washroomId: { $in: req.user.assignedWashrooms } };
        }
        const feedbacks = await Feedback.find(query).sort({ timestamp: -1 }).limit(50);
        res.status(200).json(feedbacks);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────── Leaderboard API (Admin only) ──────────
app.get('/api/leaderboard', authMiddleware, async (req, res) => {
    try {
        // Aggregate feedback ratings grouped by washroomId
        const pipeline = [
            {
                $group: {
                    _id: '$washroomId',
                    avgRating: { $avg: '$rating' },
                    totalReviews: { $sum: 1 },
                    oneStarCount: { $sum: { $cond: [{ $eq: ['$rating', 1] }, 1, 0] } },
                    twoStarCount: { $sum: { $cond: [{ $eq: ['$rating', 2] }, 1, 0] } },
                    threeStarCount: { $sum: { $cond: [{ $eq: ['$rating', 3] }, 1, 0] } },
                    fourStarCount: { $sum: { $cond: [{ $eq: ['$rating', 4] }, 1, 0] } },
                    fiveStarCount: { $sum: { $cond: [{ $eq: ['$rating', 5] }, 1, 0] } },
                    topIssues: { $push: '$issues' },
                    lastFeedback: { $max: '$timestamp' }
                }
            },
            { $sort: { avgRating: -1 } }
        ];

        const aggregated = await Feedback.aggregate(pipeline);

        // Get all washrooms for location names
        const washrooms = await Washroom.find({}).lean();
        const washroomMap = {};
        washrooms.forEach(w => { washroomMap[w.washroomId] = w; });

        // Get all nodal officers to find who is assigned to each washroom
        const nodalOfficers = await User.find({ role: 'NODAL_OFFICER' }).lean();

        const leaderboard = aggregated.map((entry, index) => {
            const wInfo = washroomMap[entry._id] || {};

            // Find which nodal officer is assigned to this washroom
            const assignedOfficer = nodalOfficers.find(
                officer => officer.assignedWashrooms && officer.assignedWashrooms.includes(entry._id)
            );

            // Flatten and count top issues
            const allIssues = entry.topIssues.flat();
            const issueCounts = {};
            allIssues.forEach(issue => {
                if (issue) issueCounts[issue] = (issueCounts[issue] || 0) + 1;
            });
            const sortedIssues = Object.entries(issueCounts)
                .sort((a, b) => b[1] - a[1])
                .slice(0, 3)
                .map(([issue, count]) => ({ issue, count }));

            return {
                rank: index + 1,
                washroomId: entry._id,
                locationName: wInfo.locationName || entry._id,
                avgRating: Math.round(entry.avgRating * 10) / 10,
                totalReviews: entry.totalReviews,
                distribution: {
                    1: entry.oneStarCount,
                    2: entry.twoStarCount,
                    3: entry.threeStarCount,
                    4: entry.fourStarCount,
                    5: entry.fiveStarCount
                },
                topIssues: sortedIssues,
                lastFeedback: entry.lastFeedback,
                nodalOfficer: assignedOfficer
                    ? { id: assignedOfficer._id, name: assignedOfficer.name, email: assignedOfficer.email }
                    : null,
                status: wInfo.status || 'Green'
            };
        });

        res.status(200).json(leaderboard);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Request report from a Nodal Officer about poor washroom performance
app.post('/api/leaderboard/request-report', authMiddleware, async (req, res) => {
    try {
        const { washroomId, locationName, officerName, avgRating } = req.body;

        if (!washroomId) {
            return res.status(400).json({ error: 'washroomId is required' });
        }

        const message = `📋 *REPORT REQUEST — MCD Super Admin*\n\n` +
            `Nodal Officer: ${officerName || 'Unassigned'}\n` +
            `Washroom: ${locationName || washroomId}\n` +
            `Average Rating: ⭐ ${avgRating || 'N/A'}/5\n\n` +
            `⚠️ इस washroom se kharab public feedback aa rahi hai.\n` +
            `Kripya 24 ghante mein ek detailed report/explanation submit karein.\n\n` +
            `— CivicSync MCD HQ`;

        const sent = await sendTelegramAlert(message);

        res.status(200).json({
            success: true,
            telegramSent: sent,
            message: 'Report request sent successfully'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────── Notice System (MCD → Nodal Officer) ──────────

// Admin sends a performance notice to a nodal officer
app.post('/api/notices', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'MCD_SUPER_ADMIN') {
            return res.status(403).json({ error: 'Only MCD Super Admin can send notices' });
        }

        const { targetOfficerId, targetOfficerName, washroomId, locationName,
                avgRating, totalReviews, topIssues } = req.body;

        if (!targetOfficerId || !washroomId) {
            return res.status(400).json({ error: 'targetOfficerId and washroomId are required' });
        }

        // Auto-draft the summary
        const issueList = (topIssues || []).map(i => `${i.issue} (${i.count} complaints)`).join(', ');
        const subject = `⚠️ Performance Notice — ${locationName || washroomId}`;
        const summary = `MCD HQ has reviewed the public feedback for ${locationName || washroomId} ` +
            `and found the average citizen rating to be ${avgRating || 'N/A'}/5.0 across ${totalReviews || 0} reviews.\n\n` +
            (issueList ? `Top reported issues: ${issueList}.\n\n` : '') +
            `This notice requires your immediate attention. Please report to MCD office within 48 hours ` +
            `with a written explanation and corrective action plan for the above washroom under your supervision.\n\n` +
            `— Municipal Corporation of Delhi (MCD), CivicSync Operations`;

        const notice = await Notice.create({
            targetOfficerId,
            targetOfficerName: targetOfficerName || 'Officer',
            washroomId,
            locationName: locationName || washroomId,
            subject,
            summary,
            avgRating: avgRating || 0,
            totalReviews: totalReviews || 0,
            topIssues: topIssues || [],
            sentBy: req.user.name || 'MCD Super Admin'
        });

        // Also send Telegram alert
        const telegramMsg = `📋 PERFORMANCE NOTICE\n\n` +
            `To: ${targetOfficerName || 'Nodal Officer'}\n` +
            `Washroom: ${locationName || washroomId}\n` +
            `Rating: ⭐ ${avgRating || 'N/A'}/5\n\n` +
            `A formal notice has been issued. Check your CivicSync dashboard for details.\n` +
            `Report to MCD office within 48 hrs.\n\n` +
            `— CivicSync MCD HQ`;
        await sendTelegramAlert(telegramMsg);

        res.status(201).json({ success: true, notice });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Nodal Officer fetches their notices
app.get('/api/notices', authMiddleware, async (req, res) => {
    try {
        let query = {};
        if (req.user.role === 'NODAL_OFFICER') {
            query = { targetOfficerId: req.user._id };
        }
        // Admin sees all notices
        const notices = await Notice.find(query).sort({ sentAt: -1 }).limit(50);
        res.status(200).json(notices);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Mark notice as read
app.patch('/api/notices/:id/read', authMiddleware, async (req, res) => {
    try {
        const notice = await Notice.findByIdAndUpdate(
            req.params.id,
            { $set: { status: 'read', readAt: new Date() } },
            { new: true }
        );
        if (!notice) return res.status(404).json({ error: 'Notice not found' });
        res.status(200).json({ success: true, notice });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ────────── Seed Default Super Admin ──────────
async function seedAdmin() {
    try {
        const existing = await User.findOne({ email: 'admin@CivicSync.in' });
        if (existing) {
            // Check if password is hashed (bcrypt hashes start with $2)
            if (!existing.password.startsWith('$2')) {
                await User.deleteOne({ email: 'admin@CivicSync.in' });
                console.log("🔄 Removed admin with unhashed password, re-creating...");
            } else {
                return; // Admin exists and is properly hashed
            }
        }
        const admin = new User({
            name: 'MCD Admin',
            email: 'admin@CivicSync.in',
            password: 'admin123',
            role: 'MCD_SUPER_ADMIN',
            assignedWashrooms: []
        });
        await admin.save();
        console.log("🔐 Default Super Admin created: admin@CivicSync.in / admin123");
    } catch (err) {
        console.error("Admin seed error:", err.message);
    }
}

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`🚀 Server started on http://localhost:${PORT}`);
    seedAdmin();
});