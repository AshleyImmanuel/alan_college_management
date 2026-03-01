const express = require('express');
const ClassModel = require('../models/Class');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const isValidUtcDateParts = (year, month, day) => {
    const candidate = new Date(Date.UTC(year, month - 1, day));
    return (
        candidate.getUTCFullYear() === year &&
        candidate.getUTCMonth() === month - 1 &&
        candidate.getUTCDate() === day
    );
};

const normalizeDateKey = (inputDate) => {
    if (!inputDate) return '';

    const raw = String(inputDate).trim();
    const directMatch = raw.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (directMatch) {
        const year = Number(directMatch[1]);
        const month = Number(directMatch[2]);
        const day = Number(directMatch[3]);
        if (!isValidUtcDateParts(year, month, day)) return '';
        return `${directMatch[1]}-${directMatch[2]}-${directMatch[3]}`;
    }

    const parsed = new Date(raw);
    if (Number.isNaN(parsed.getTime())) return '';
    const year = parsed.getUTCFullYear();
    const month = String(parsed.getUTCMonth() + 1).padStart(2, '0');
    const day = String(parsed.getUTCDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const authorizeClassStudent = async (req, res, next) => {
    try {
        const classInfo = await ClassModel.findById(req.params.id);
        if (!classInfo) return res.status(404).json({ message: 'Class not found.' });

        if (
            req.user.role === 'student' &&
            !classInfo.students.some(studentId => String(studentId) === String(req.user._id))
        ) {
            return res.status(403).json({ message: 'You are not enrolled in this class.' });
        }

        req.classData = classInfo;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/student/classes - list classes for current student
router.get('/classes', protect, authorizeRoles('student'), async (req, res) => {
    try {
        const classes = await ClassModel.find({ students: req.user._id })
            .populate('course', 'name code programType duration')
            .populate('department', 'name code')
            .populate('faculties', 'firstName lastName email')
            .sort({ academicYear: -1, semesterOrYear: 1, createdAt: -1 });

        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/student/classes/:id/students - list peers in class
router.get('/classes/:id/students', protect, authorizeRoles('student'), authorizeClassStudent, async (req, res) => {
    try {
        const students = await User.find({ _id: { $in: req.classData.students } })
            .select('firstName lastName email status createdAt')
            .sort({ firstName: 1 });

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/student/classes/:id/attendance?from=YYYY-MM-DD&to=YYYY-MM-DD&day=YYYY-MM-DD
router.get('/classes/:id/attendance', protect, authorizeRoles('student'), authorizeClassStudent, async (req, res) => {
    try {
        const dayDateKey = normalizeDateKey(req.query.day);
        const fromDateKey = normalizeDateKey(req.query.from);
        const toDateKey = normalizeDateKey(req.query.to);

        const filter = { class: req.classData._id };
        if (dayDateKey) {
            filter.dateKey = dayDateKey;
        } else if (fromDateKey || toDateKey) {
            filter.dateKey = {};
            if (fromDateKey) filter.dateKey.$gte = fromDateKey;
            if (toDateKey) filter.dateKey.$lte = toDateKey;
        }

        const attendanceRows = await Attendance.find(filter).sort({ dateKey: 1, period: 1 });
        const records = [];
        const summary = { total: 0, present: 0, absent: 0, late: 0 };

        attendanceRows.forEach((row) => {
            const entry = (row.entries || []).find(item => String(item.student) === String(req.user._id));
            if (!entry) return;

            const status = String(entry.status || 'present').toLowerCase();
            records.push({
                dateKey: row.dateKey,
                period: row.period,
                status,
                updatedAt: row.updatedAt
            });

            summary.total += 1;
            if (status === 'absent') summary.absent += 1;
            else if (status === 'late') summary.late += 1;
            else summary.present += 1;
        });

        return res.json({
            classId: req.classData._id,
            student: {
                _id: req.user._id,
                firstName: req.user.firstName,
                lastName: req.user.lastName,
                email: req.user.email
            },
            day: dayDateKey || null,
            from: dayDateKey || fromDateKey || null,
            to: dayDateKey || toDateKey || null,
            summary,
            records
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

// Students have read-only access to class materials
router.post('/class/:id/course-plan', protect, authorizeRoles('student'), authorizeClassStudent, async (req, res) => {
    return res.status(403).json({ message: 'Students are not allowed to upload course plans.' });
});

router.post('/class/:id/study-materials', protect, authorizeRoles('student'), authorizeClassStudent, async (req, res) => {
    return res.status(403).json({ message: 'Students are not allowed to upload study materials.' });
});

router.delete('/class/:id/study-materials/:materialId', protect, authorizeRoles('student'), authorizeClassStudent, async (req, res) => {
    return res.status(403).json({ message: 'Students are not allowed to delete study materials.' });
});

module.exports = router;
