const mongoose = require('mongoose');

const courseSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Course name is required'],
        trim: true,
    },
    code: {
        type: String,
        required: [true, 'Course code is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    department: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Department',
        required: [true, 'Department is required'],
    },
    programType: {
        type: String,
        enum: ['ug', 'pg'],
        required: [true, 'Program type is required'],
    },
    duration: {
        type: Number,
        required: true,
        default: 3,
        min: 1,
        max: 6,
    },
}, {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
});

courseSchema.virtual('programTypeLabel').get(function programTypeLabelGetter() {
    const labels = {
        ug: 'Undergraduate',
        pg: 'Postgraduate',
    };
    return labels[this.programType] || this.programType;
});

module.exports = mongoose.model('Course', courseSchema);
