const mongoose = require('mongoose');

const attendanceEntrySchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['present', 'absent', 'late'],
        default: 'present'
    }
}, { _id: false });

const attendanceSchema = new mongoose.Schema({
    class: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: true
    },
    dateKey: {
        type: String,
        required: true
    },
    period: {
        type: Number,
        required: true,
        enum: [1, 2, 3, 4]
    },
    entries: {
        type: [attendanceEntrySchema],
        default: []
    },
    markedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

attendanceSchema.index({ class: 1, dateKey: 1, period: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
