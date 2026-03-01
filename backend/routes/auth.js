const express = require('express');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { protect } = require('../middleware/auth');
const router = express.Router();

// Generate JWT
const generateToken = (id, role) => {
    return jwt.sign({ id, role }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

const getCookieOptions = () => ({
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000,
    path: '/'
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
    try {
        const { firstName, lastName, password, programType, department, course, year } = req.body;
        const email = String(req.body?.email || '').trim().toLowerCase();

        if (!email) {
            return res.status(400).json({ message: 'Email is required.' });
        }

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        // Create user with pending status
        const user = await User.create({
            firstName,
            lastName,
            email,
            password,
            programType,
            department,
            course,
            year,
            role: 'student',
            status: 'pending',
        });

        res.status(201).json({
            message: 'Registration request sent! Your account is pending approval from HOD or respective faculty.',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                status: user.status,
            },
        });
    } catch (error) {
        if (error.name === 'ValidationError') {
            const messages = Object.values(error.errors).map(e => e.message);
            return res.status(400).json({ message: messages.join(', ') });
        }
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
    try {
        const email = String(req.body?.email || '').trim().toLowerCase();
        const password = String(req.body?.password || '');

        if (!email || !password) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Find user
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Check password
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ message: 'Invalid email or password.' });
        }

        // Check approval status
        if (user.status === 'pending') {
            return res.status(403).json({ message: 'Your account is pending approval from HOD or respective faculty. Please wait for confirmation.' });
        }
        if (user.status === 'rejected') {
            return res.status(403).json({ message: 'Your registration has been rejected. Please contact the administration.' });
        }

        // Generate token and respond
        const token = generateToken(user._id, user.role);
        res.cookie('token', token, getCookieOptions());

        res.json({
            message: 'Login successful!',
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                department: user.department,
                course: user.course,
                year: user.year,
                programType: user.programType,
            },
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// GET /api/auth/me
router.get('/me', protect, async (req, res) => {
    try {
        res.json({
            user: {
                id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email,
                role: req.user.role,
                department: req.user.department,
                course: req.user.course,
                year: req.user.year,
                programType: req.user.programType,
                assignedClass: req.user.assignedClass,
                status: req.user.status
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error. Please try again later.' });
    }
});

// POST /api/auth/logout
router.post('/logout', async (req, res) => {
    res.clearCookie('token', {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        path: '/'
    });
    res.json({ message: 'Logged out successfully.' });
});

module.exports = router;
