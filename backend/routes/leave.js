const express = require('express');
const LeaveRequest = require('../models/LeaveRequest');
const { protect, authorizeRoles } = require('../middleware/auth');

const router = express.Router();

const NEXT_ROLE_MAP = {
    student: 'faculty',
    faculty: 'hod',
    hod: 'admin'
};

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

const getTodayDateKey = () => {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const formatLeaveRow = (row) => ({
    _id: row._id,
    requester: row.requester ? {
        _id: row.requester._id,
        firstName: row.requester.firstName,
        lastName: row.requester.lastName,
        email: row.requester.email,
        role: row.requester.role
    } : null,
    requesterRole: row.requesterRole,
    targetRole: row.targetRole,
    name: row.name,
    reason: row.reason,
    fromDate: row.fromDateKey,
    toDate: row.toDateKey,
    status: row.status,
    createdAt: row.createdAt,
    reviewedAt: row.reviewedAt
});

// POST /api/leaves - apply leave (student -> faculty, faculty -> hod, hod -> admin)
router.post('/', protect, authorizeRoles('student', 'faculty', 'hod'), async (req, res) => {
    try {
        const requesterRole = String(req.user.role || '').trim().toLowerCase();
        const targetRole = NEXT_ROLE_MAP[requesterRole];
        if (!targetRole) {
            return res.status(403).json({ message: 'Not allowed to apply leave.' });
        }

        const name = String(req.body?.name || `${req.user.firstName || ''} ${req.user.lastName || ''}`)
            .trim();
        const reason = String(req.body?.reason || '').trim();
        const fromDateKey = normalizeDateKey(req.body?.fromDate);
        const toDateKey = normalizeDateKey(req.body?.toDate);

        if (!name) return res.status(400).json({ message: 'Name is required.' });
        if (!reason) return res.status(400).json({ message: 'Reason is required.' });
        if (!fromDateKey || !toDateKey) {
            return res.status(400).json({ message: 'Valid from and to dates are required.' });
        }

        const todayDateKey = getTodayDateKey();
        if (fromDateKey < todayDateKey || toDateKey < todayDateKey) {
            return res.status(400).json({ message: 'Past dates are not allowed for leave request.' });
        }
        if (toDateKey < fromDateKey) {
            return res.status(400).json({ message: 'To date must be on or after from date.' });
        }

        const leave = await LeaveRequest.create({
            requester: req.user._id,
            requesterRole,
            targetRole,
            name,
            reason,
            fromDateKey,
            toDateKey,
            status: 'pending'
        });

        return res.status(201).json({
            message: 'Leave request submitted successfully.',
            leave: formatLeaveRow(leave)
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/leaves/my - list own leave requests
router.get('/my', protect, authorizeRoles('student', 'faculty', 'hod', 'admin'), async (req, res) => {
    try {
        const rows = await LeaveRequest.find({ requester: req.user._id }).sort({ createdAt: -1 });
        return res.json(rows.map(formatLeaveRow));
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/leaves/inbox - list leave requests addressed to current role
router.get('/inbox', protect, authorizeRoles('faculty', 'hod', 'admin'), async (req, res) => {
    try {
        const requestedStatus = String(req.query.status || 'all').toLowerCase();
        const filter = { targetRole: req.user.role };
        if (['pending', 'approved', 'rejected'].includes(requestedStatus)) {
            filter.status = requestedStatus;
        }

        const rows = await LeaveRequest.find(filter)
            .populate('requester', 'firstName lastName email role')
            .sort({ createdAt: -1 });

        return res.json(rows.map(formatLeaveRow));
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/leaves/:id/status - approve/reject leave in inbox
router.put('/:id/status', protect, authorizeRoles('faculty', 'hod', 'admin'), async (req, res) => {
    try {
        const nextStatus = String(req.body?.status || '').trim().toLowerCase();
        if (!['approved', 'rejected'].includes(nextStatus)) {
            return res.status(400).json({ message: 'Status must be approved or rejected.' });
        }

        const row = await LeaveRequest.findOne({ _id: req.params.id, targetRole: req.user.role });
        if (!row) return res.status(404).json({ message: 'Leave request not found.' });
        if (row.status !== 'pending') {
            return res.status(400).json({ message: 'Leave request is already processed.' });
        }

        row.status = nextStatus;
        row.reviewedBy = req.user._id;
        row.reviewedAt = new Date();
        await row.save();

        return res.json({
            message: `Leave request ${nextStatus}.`,
            leave: formatLeaveRow(row)
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
