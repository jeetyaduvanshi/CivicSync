const mongoose = require('mongoose');

const washroomSchema = new mongoose.Schema({
    washroomId: { type: String, required: true, unique: true },
    locationName: { type: String, default: 'Delhi Zone' },
    lat: { type: Number },
    lng: { type: Number },
    status: { type: String, default: 'Green' },
    sensors: {
        ammonia: { type: Number, default: 0 },
        waterLevel: { type: Number, default: 100 },
        soapLevel: { type: Number, default: 100 },
        sosAlert: { type: Boolean, default: false }
    },
    amenities: {
        handRails: { type: Boolean, default: false },
        sanitaryPads: { type: Boolean, default: false },
        wheelchairAccess: { type: Boolean, default: false },
        babyChanging: { type: Boolean, default: false },
        drinkingWater: { type: Boolean, default: false },
        mirror: { type: Boolean, default: false },
        westernToilet: { type: Boolean, default: false },
        indianToilet: { type: Boolean, default: true }
    },
    lastUpdated: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Washroom', washroomSchema);