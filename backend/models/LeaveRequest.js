const mongoose = require('mongoose');

const leaveRequestSchema = new mongoose.Schema({
    requester: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    requesterRole: {
        type: String,
        enum: ['student', 'faculty', 'hod'],
        required: true
    },
    targetRole: {
        type: String,
        enum: ['faculty', 'hod', 'admin'],
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    reason: {
        type: String,
        required: true,
        trim: true
    },
    fromDateKey: {
        type: String,
        required: true
    },
    toDateKey: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
    },
    reviewedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    reviewedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: true
});

leaveRequestSchema.index({ targetRole: 1, status: 1, createdAt: -1 });
leaveRequestSchema.index({ requester: 1, createdAt: -1 });

module.exports = mongoose.model('LeaveRequest', leaveRequestSchema);
