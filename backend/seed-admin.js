// Run this once to create the first admin account
// Usage: node seed-admin.js

const mongoose = require('mongoose');
const dotenv = require('dotenv');
dotenv.config();

const User = require('./models/User');

const seedAdmin = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Delete old admin if exists and re-create
        await User.deleteMany({ role: 'admin' });

        const admin = new User({
            firstName: 'Admin',
            lastName: 'Parker',
            email: 'admin@gmail.com',
            password: 'admin@2026',
            role: 'admin',
            status: 'approved',
        });
        await admin.save();

        console.log('Admin account created successfully!');
        console.log('Email: admin@gmail.com');
        console.log('Password: admin@2026');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error.message);
        process.exit(1);
    }
};

seedAdmin();
