const mongoose = require('mongoose');

const departmentSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Department name is required'],
        unique: true,
        trim: true,
    },
    code: {
        type: String,
        required: [true, 'Department code is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    icon: {
        type: String,
        default: 'fa-building-columns',
    },
    color: {
        type: String,
        default: '#3b82f6',
    },
}, {
    timestamps: true,
});

module.exports = mongoose.model('Department', departmentSchema);
