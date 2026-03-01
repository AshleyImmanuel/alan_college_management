const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        required: [true, 'First name is required'],
        trim: true,
    },
    lastName: {
        type: String,
        required: [true, 'Last name is required'],
        trim: true,
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
    },
    programType: {
        type: String,
        enum: ['ug', 'pg'],
        required: function () { return this.role === 'student'; },
    },
    department: {
        type: String,
        required: function () { return this.role === 'student' || this.role === 'hod'; },
    },
    course: {
        type: String,
        required: function () { return this.role === 'student'; },
    },
    year: {
        type: String,
        enum: ['1', '2', '3', '4'],
        required: function () { return this.role === 'student'; },
    },
    assignedClass: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Class',
        required: function () { return this.role === 'faculty'; }
    },
    role: {
        type: String,
        enum: ['student', 'hod', 'admin', 'faculty'],
        default: 'student',
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending',
    },
}, {
    timestamps: true,
});

// Hash password before saving
userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Compare password method
userSchema.methods.comparePassword = async function (candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
