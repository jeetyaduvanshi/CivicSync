const mongoose = require('mongoose');

const noticeSchema = new mongoose.Schema({
    // Who is this notice for
    targetOfficerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    targetOfficerName: { type: String, required: true },

    // Which washroom is this about
    washroomId: { type: String, required: true },
    locationName: { type: String, default: '' },

    // Notice content
    subject: { type: String, required: true },
    summary: { type: String, required: true },   // Auto-drafted performance summary
    avgRating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },
    topIssues: [{ issue: String, count: Number }],

    // Status tracking
    status: {
        type: String,
        enum: ['unread', 'read', 'acknowledged'],
        default: 'unread'
    },
    sentBy: { type: String, default: 'MCD Super Admin' },
    sentAt: { type: Date, default: Date.now },
    readAt: { type: Date },
});

module.exports = mongoose.model('Notice', noticeSchema);
