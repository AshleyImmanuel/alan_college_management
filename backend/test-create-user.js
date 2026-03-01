const mongoose = require('mongoose');
const User = require('./models/User');

async function testCreateUser() {
    try {
        await mongoose.connect('mongodb://127.0.0.1:27017/parker_university');

        const user = new User({
            firstName: "Test",
            lastName: "Faculty",
            email: "test_faculty_500@example.com",
            password: "password123",
            role: "faculty",
            department: "cs",
            status: "approved"
        });

        await user.save();
        console.log("Success! User created:", user._id);
    } catch (error) {
        console.error("Failed to save user:");
        console.error(error);
    } finally {
        mongoose.connection.close();
    }
}

testCreateUser();
