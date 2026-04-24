const mongoose = require('mongoose');

const telemetryLogSchema = new mongoose.Schema({
    washroomId: { type: String, required: true, index: true },
    locationName: { type: String },
    status: { type: String },
    sensors: {
        ammonia: { type: Number, default: 0 },
        waterLevel: { type: Number, default: 100 },
        soapLevel: { type: Number, default: 100 },
        sosAlert: { type: Boolean, default: false }
    },
    timestamp: { type: Date, default: Date.now, index: true }
});

// Compound index for efficient queries filtering by washroom + time range
telemetryLogSchema.index({ washroomId: 1, timestamp: -1 });

module.exports = mongoose.model('TelemetryLog', telemetryLogSchema);
