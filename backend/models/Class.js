const mongoose = require('mongoose');

const classSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Class name is required'],
        trim: true,
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: [true, 'Course is required'],
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required'],
    },
    academicYear: {
        type: String,
        required: [true, 'Academic year is required (e.g., 2024-2025)'],
    },
    semesterOrYear: {
        type: String,
        required: [true, 'Semester or Year identifier is required (e.g., 1st Year, Semester 3)'],
    },
    students: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    faculties: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    studyMaterials: [{
        title: String,
        url: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    coursePlans: [{
        title: String,
        url: String,
        uploadedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        uploadDate: {
            type: Date,
            default: Date.now
        }
    }],
    coursePlan: {
        rawText: {
            type: String,
            default: ''
        },
        fileUrl: {
            type: String,
            default: ''
        },
        originalName: {
            type: String,
            default: ''
        }
    }
}, {
    timestamps: true,
});

module.exports = mongoose.model('Class', classSchema);
