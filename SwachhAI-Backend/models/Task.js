const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
    washroomId: { type: String, required: true },
    locationName: { type: String, default: 'Unknown Location' },
    issue: { type: String, required: true },
    severity: { type: String, enum: ['Red', 'Yellow'], required: true },
    status: {
        type: String,
        enum: ['open', 'in_progress', 'resolved'],
        default: 'open'
    },
    assignedTo: { type: String, default: null },
    assignedAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    createdAt: { type: Date, default: Date.now }
}, { timestamps: { createdAt: false, updatedAt: true } });

// Compound index for fast lookups and de-duplication checks
taskSchema.index({ washroomId: 1, status: 1 });
taskSchema.index({ status: 1, createdAt: -1 });

module.exports = mongoose.model('Task', taskSchema);
