const mongoose = require('mongoose');

const FeedbackSchema = new mongoose.Schema({
    washroomId: {
        type: String,
        required: true,
        index: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    issues: {
        type: [String],
        default: []
    },
    timestamp: {
        type: Date,
        default: Date.now,
        index: true
    }
});

module.exports = mongoose.model('Feedback', FeedbackSchema);
