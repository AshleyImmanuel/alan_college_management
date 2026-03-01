const express = require('express');
const User = require('../models/User');
const Department = require('../models/Department');
const Course = require('../models/Course');
const ClassModel = require('../models/Class');
const { protect, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// POST /api/admin/create-user — Admin creates HOD or Faculty
router.post('/create-user', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const { firstName, lastName, email, password, role, department, classId } = req.body;

        if (!['hod', 'faculty'].includes(role)) {
            return res.status(400).json({ message: 'Can only create HOD or Faculty accounts.' });
        }

        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'An account with this email already exists.' });
        }

        const user = new User({
            firstName,
            lastName,
            email,
            password,
            role,
            department: department || 'cs',
            assignedClass: role === 'faculty' ? classId : undefined,
            status: 'approved',
        });
        await user.save();

        if (role === 'faculty' && classId) {
            await ClassModel.findByIdAndUpdate(classId, { $push: { faculties: user._id } });
        }

        res.status(201).json({
            message: `${role.toUpperCase()} account created successfully.`,
            user: {
                id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                email: user.email,
                role: user.role,
                department: user.department,
            },
        });
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: error.message, stack: error.stack });
    }
});
// GET /api/admin/users — List all users
router.get('/users', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/admin/stats — Dashboard statistics
router.get('/stats', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const pendingUsers = await User.countDocuments({ status: 'pending' });
        const approvedUsers = await User.countDocuments({ status: 'approved' });
        const rejectedUsers = await User.countDocuments({ status: 'rejected' });
        const students = await User.countDocuments({ role: 'student' });
        const hods = await User.countDocuments({ role: 'hod' });
        const faculties = await User.countDocuments({ role: 'faculty' });
        const departments = await Department.countDocuments();

        res.json({ totalUsers, pendingUsers, approvedUsers, rejectedUsers, students, hods, faculties, departments });
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE /api/admin/users/:id — Delete a user
router.delete('/users/:id', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }
        if (user.role === 'admin') {
            return res.status(400).json({ message: 'Cannot delete admin account.' });
        }
        await User.findByIdAndDelete(req.params.id);
        res.json({ message: `${user.firstName} ${user.lastName} has been deleted.` });
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ========== DEPARTMENT CRUD ==========

// POST /api/admin/departments — Create department
router.post('/departments', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const { name, code, icon, color } = req.body;
        if (!name || !code) {
            return res.status(400).json({ message: 'Name and code are required.' });
        }
        const existing = await Department.findOne({ $or: [{ code }, { name }] });
        if (existing) {
            return res.status(400).json({ message: 'Department with this name or code already exists.' });
        }
        const dept = new Department({ name, code, icon, color });
        await dept.save();
        res.status(201).json({ message: 'Department created successfully.', department: dept });
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/admin/departments — List all departments with course counts
router.get('/departments', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        const result = [];
        for (const dept of departments) {
            const courseCount = await Course.countDocuments({ department: dept._id });
            const studentCount = await User.countDocuments({ department: dept.code, role: 'student' });
            result.push({ ...dept.toObject(), courseCount, studentCount });
        }
        res.json(result);
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE /api/admin/departments/:id — Delete department and its courses
router.delete('/departments/:id', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const dept = await Department.findById(req.params.id);
        if (!dept) return res.status(404).json({ message: 'Department not found.' });
        await Course.deleteMany({ department: dept._id });
        await Department.findByIdAndDelete(req.params.id);
        res.json({ message: `Department "${dept.name}" and its courses have been deleted.` });
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ========== COURSE CRUD ==========

// POST /api/admin/courses — Create course
router.post('/courses', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        let { name, code, department, programType, duration } = req.body;
        if (!name || !department || !programType) {
            return res.status(400).json({ message: 'Name, department, and program type are required.' });
        }
        if (!code) {
            code = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
        }
        const existing = await Course.findOne({ code });
        if (existing) {
            return res.status(400).json({ message: 'A course with this code already exists.' });
        }
        const course = new Course({ name, code, department, programType, duration: duration || (programType === 'pg' ? 2 : 3) });
        await course.save();
        const populated = await Course.findById(course._id).populate('department');
        res.status(201).json({ message: 'Course created successfully.', course: populated });
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/admin/courses — List courses, optionally by department
router.get('/courses', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const filter = {};
        if (req.query.department) filter.department = req.query.department;
        const courses = await Course.find(filter).populate('department').sort({ programType: 1, name: 1 });
        res.json(courses);
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE /api/admin/courses/:id — Delete course
router.delete('/courses/:id', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        if (!course) return res.status(404).json({ message: 'Course not found.' });
        await Course.findByIdAndDelete(req.params.id);
        res.json({ message: `Course "${course.name}" has been deleted.` });
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// ========== PUBLIC ROUTES (for registration form) ==========

// GET /api/admin/public/departments — No auth needed
router.get('/public/departments', async (req, res) => {
    try {
        const departments = await Department.find().sort({ name: 1 });
        res.json(departments);
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/admin/public/courses — No auth needed
router.get('/public/courses', async (req, res) => {
    try {
        const filter = {};
        if (req.query.department) {
            const departmentCode = String(req.query.department).trim().toLowerCase();
            const dept = departmentCode ? await Department.findOne({ code: departmentCode }) : null;
            if (!dept) return res.json([]);
            filter.department = dept._id;
        }
        if (req.query.programType) filter.programType = req.query.programType;
        const courses = await Course.find(filter).sort({ name: 1 });
        res.json(courses);
    } catch (error) {
        console.error('Admin route error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
