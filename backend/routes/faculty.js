const express = require('express');
const multer = require('multer');
const path = require('path');
const ClassModel = require('../models/Class');
const Department = require('../models/Department');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { protect, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${path.extname(file.originalname)}`);
    }
});

const upload = multer({ storage });
const VALID_PERIODS = new Set([1, 2, 3, 4]);

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

const normalizeDepartmentCode = (value = '') => String(value).trim().toLowerCase();
const normalizeText = (value = '') => String(value).trim().toLowerCase();
const normalizeCourseKey = (value = '') => normalizeText(value).replace(/[^a-z0-9]+/g, '');
const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// Middleware to ensure the class belongs to the faculty
const authorizeClassFaculty = async (req, res, next) => {
    try {
        const classInfo = await ClassModel.findById(req.params.id);
        if (!classInfo) return res.status(404).json({ message: 'Class not found.' });

        if (
            req.user.role === 'faculty' &&
            !classInfo.faculties.some(facultyId => String(facultyId) === String(req.user._id))
        ) {
            return res.status(403).json({ message: 'You are not assigned to this class.' });
        }

        req.classData = classInfo;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/faculty/classes — List all classes assigned to this faculty
const parseYearFromClassLabel = (semesterOrYear) => {
    const match = String(semesterOrYear || '').match(/\b([1-6])(?:st|nd|rd|th)?\b/i);
    return match ? match[1] : '';
};

const authorizeClassFacultyLite = async (req, res, next) => {
    try {
        const classInfo = await ClassModel.findById(req.params.id).select('faculties students').lean();
        if (!classInfo) return res.status(404).json({ message: 'Class not found.' });

        if (
            req.user.role === 'faculty' &&
            !classInfo.faculties.some(facultyId => String(facultyId) === String(req.user._id))
        ) {
            return res.status(403).json({ message: 'You are not assigned to this class.' });
        }

        req.classData = classInfo;
        next();
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
};

const parseYearNumber = (value = '') => {
    const match = String(value || '').match(/\b([1-6])(?:st|nd|rd|th)?\b/i);
    return match ? match[1] : '';
};

const getAcademicYearStart = (academicYear = '') => {
    const match = String(academicYear).match(/^(\d{4})-(\d{4})$/);
    if (!match) return Number.NEGATIVE_INFINITY;
    return Number(match[1]);
};

const buildFacultyStudentScope = async (facultyId) => {
    const assignedClasses = await ClassModel.find({ faculties: facultyId })
        .populate('course', 'name code')
        .select('course semesterOrYear');

    const scope = new Map();
    assignedClasses.forEach((cls) => {
        const year = parseYearFromClassLabel(cls.semesterOrYear);
        const courseKeys = [
            normalizeCourseKey(cls?.course?.name),
            normalizeCourseKey(cls?.course?.code)
        ].filter(Boolean);

        courseKeys.forEach((courseKey) => {
            if (!scope.has(courseKey)) {
                scope.set(courseKey, new Set());
            }
            if (year) scope.get(courseKey).add(year);
        });
    });

    return scope;
};

const isStudentAllowedForFaculty = (student, scope) => {
    const studentCourse = normalizeCourseKey(student?.course);
    if (!studentCourse || !scope.has(studentCourse)) return false;

    const allowedYears = scope.get(studentCourse);
    if (!allowedYears || allowedYears.size === 0) return true;

    const studentYear = parseYearNumber(student?.year);
    return allowedYears.has(studentYear);
};

const isStudentAllowedForHod = (student, hodDepartmentCode) => {
    const studentDept = normalizeDepartmentCode(student?.department);
    const hodDept = normalizeDepartmentCode(hodDepartmentCode);
    return Boolean(studentDept && hodDept && studentDept === hodDept);
};

const getYearLabelFromStudent = (studentYear) => {
    const yearNum = Number(parseYearNumber(studentYear));
    if (!Number.isFinite(yearNum) || yearNum < 1) return '';

    const mod100 = yearNum % 100;
    let suffix = 'th';
    if (mod100 < 11 || mod100 > 13) {
        if (yearNum % 10 === 1) suffix = 'st';
        else if (yearNum % 10 === 2) suffix = 'nd';
        else if (yearNum % 10 === 3) suffix = 'rd';
    }
    return `${yearNum}${suffix} Year`;
};

const findMatchingClassForStudent = async (student, options = {}) => {
    const { facultyId = null, departmentCode = '' } = options;
    const studentCourse = normalizeCourseKey(student?.course);
    if (!studentCourse) return null;

    const studentYear = parseYearNumber(student?.year);
    const classFilter = {};
    if (facultyId) classFilter.faculties = facultyId;

    const normalizedDepartmentCode = normalizeDepartmentCode(departmentCode);
    if (normalizedDepartmentCode) {
        const dept = await Department.findOne({ code: normalizedDepartmentCode }).select('_id').lean();
        if (dept?._id) classFilter.department = dept._id;
    }

    const candidateClasses = await ClassModel.find(classFilter)
        .populate('course', 'name code')
        .sort({ academicYear: -1, createdAt: -1 });

    const matchingClasses = candidateClasses.filter((cls) => {
        const courseName = normalizeCourseKey(cls?.course?.name);
        const courseCode = normalizeCourseKey(cls?.course?.code);
        const classYear = parseYearFromClassLabel(cls?.semesterOrYear);
        const isYearMatch = !studentYear || !classYear || classYear === studentYear;
        return (studentCourse === courseName || studentCourse === courseCode) && isYearMatch;
    });

    if (!matchingClasses.length) return null;

    matchingClasses.sort((a, b) => {
        const aHasFaculty = Array.isArray(a.faculties) && a.faculties.length > 0 ? 1 : 0;
        const bHasFaculty = Array.isArray(b.faculties) && b.faculties.length > 0 ? 1 : 0;
        if (aHasFaculty !== bHasFaculty) return bHasFaculty - aHasFaculty;

        const aStart = getAcademicYearStart(a.academicYear);
        const bStart = getAcademicYearStart(b.academicYear);
        if (aStart !== bStart) return bStart - aStart;

        const aCreated = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bCreated = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bCreated - aCreated;
    });

    return matchingClasses[0];
};

const isClassEligibleForStudent = (student, classInfo, options = {}) => {
    const { facultyId = null, departmentCode = '' } = options;

    if (!student || !classInfo) return false;

    if (facultyId) {
        const classFacultyIds = Array.isArray(classInfo.faculties)
            ? classInfo.faculties.map((facultyRef) => String(facultyRef))
            : [];
        if (!classFacultyIds.includes(String(facultyId))) return false;
    }

    const normalizedDepartmentCode = normalizeDepartmentCode(departmentCode);
    const classDepartmentCode = normalizeDepartmentCode(classInfo?.department?.code);
    if (normalizedDepartmentCode && classDepartmentCode && normalizedDepartmentCode !== classDepartmentCode) {
        return false;
    }

    const studentCourse = normalizeCourseKey(student?.course);
    if (!studentCourse) return false;

    const classCourseName = normalizeCourseKey(classInfo?.course?.name);
    const classCourseCode = normalizeCourseKey(classInfo?.course?.code);
    if (studentCourse !== classCourseName && studentCourse !== classCourseCode) {
        return false;
    }

    const studentYear = parseYearNumber(student?.year);
    const classYear = parseYearFromClassLabel(classInfo?.semesterOrYear);
    return !studentYear || !classYear || studentYear === classYear;
};

const getPreferredClassForStudent = async (student, options = {}) => {
    const preferredClassId = String(options?.preferredClassId || '').trim();
    if (!preferredClassId) return null;

    const preferredClass = await ClassModel.findById(preferredClassId)
        .populate('course', 'name code')
        .populate('department', 'code')
        .select('name course semesterOrYear academicYear faculties department');

    if (!preferredClass) return null;
    if (!isClassEligibleForStudent(student, preferredClass, options)) return null;
    return preferredClass;
};

const syncStudentClassMembership = async (student, status, options = {}) => {
    const { facultyId = null, departmentCode = '', preferredClassId = '' } = options;

    if (status === 'rejected') {
        await ClassModel.updateMany({ students: student._id }, { $pull: { students: student._id } });
        return { assignedClass: null, warning: '' };
    }

    if (status !== 'approved') {
        return { assignedClass: null, warning: '' };
    }

    const preferredClass = await getPreferredClassForStudent(student, {
        facultyId,
        departmentCode,
        preferredClassId
    });
    const matchedClass = preferredClass || await findMatchingClassForStudent(student, { facultyId, departmentCode });
    if (!matchedClass) {
        return {
            assignedClass: null,
            warning: 'Student approved, but no matching class was found for auto-assignment.'
        };
    }

    await ClassModel.updateMany({ students: student._id }, { $pull: { students: student._id } });
    await ClassModel.updateOne(
        { _id: matchedClass._id },
        { $addToSet: { students: student._id } }
    );

    const warning = (!preferredClass && preferredClassId)
        ? 'Selected class did not match this student profile. Auto-assigned to the closest matching class.'
        : '';

    return { assignedClass: matchedClass, warning };
};

const updateRegistrationStatus = async (req, res, nextStatus) => {
    try {
        const student = await User.findById(req.params.id);
        if (!student || student.role !== 'student') {
            return res.status(404).json({ message: 'Student not found.' });
        }

        if (req.user.role === 'faculty') {
            const scope = await buildFacultyStudentScope(req.user._id);
            if (scope.size === 0) {
                return res.status(403).json({ message: 'No assigned classes found for this faculty.' });
            }

            if (!isStudentAllowedForFaculty(student, scope)) {
                return res.status(403).json({ message: 'Not authorized to manage this student.' });
            }
        } else if (req.user.role === 'hod') {
            if (!isStudentAllowedForHod(student, req.user.department)) {
                return res.status(403).json({ message: 'Not authorized to manage this student.' });
            }
        }

        const syncOptions = {};
        if (req.user.role === 'faculty') {
            syncOptions.facultyId = req.user._id;
            syncOptions.departmentCode = req.user.department;
        } else if (req.user.role === 'hod') {
            syncOptions.departmentCode = req.user.department;
        } else if (req.user.role === 'admin') {
            syncOptions.departmentCode = student.department;
        }
        const preferredClassId = String(req.body?.classId || '').trim();
        if (preferredClassId) {
            syncOptions.preferredClassId = preferredClassId;
        }

        const { assignedClass, warning } = await syncStudentClassMembership(student, nextStatus, syncOptions);

        student.status = nextStatus;
        await student.save();

        const verb = nextStatus === 'approved' ? 'approved' : 'rejected';
        return res.json({
            message: warning || `${student.firstName} has been ${verb}.`,
            user: student,
            assignedClass: assignedClass ? { id: assignedClass._id, name: assignedClass.name } : null
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
};

// GET /api/faculty/registrations - List students faculty can manage
router.get('/registrations', protect, authorizeRoles('faculty', 'hod', 'admin'), async (req, res) => {
    try {
        const requestedStatus = String(req.query.status || 'all').toLowerCase();
        const statusFilter = ['pending', 'approved', 'rejected'].includes(requestedStatus)
            ? { status: requestedStatus }
            : {};

        const students = await User.find({ role: 'student', ...statusFilter })
            .select('-password')
            .sort({ createdAt: -1 });

        if (req.user.role === 'admin') {
            return res.json(students);
        }

        if (req.user.role === 'hod') {
            const allowedStudents = students.filter(student => isStudentAllowedForHod(student, req.user.department));
            return res.json(allowedStudents);
        }

        const scope = await buildFacultyStudentScope(req.user._id);
        if (scope.size === 0) return res.json([]);
        const allowedStudents = students.filter(student => isStudentAllowedForFaculty(student, scope));
        return res.json(allowedStudents);
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/faculty/registrations/:id/approve - Approve a student
router.put('/registrations/:id/approve', protect, authorizeRoles('faculty', 'hod', 'admin'), async (req, res) => {
    return updateRegistrationStatus(req, res, 'approved');
});

// PUT /api/faculty/registrations/:id/reject - Reject a student
router.put('/registrations/:id/reject', protect, authorizeRoles('faculty', 'hod', 'admin'), async (req, res) => {
    return updateRegistrationStatus(req, res, 'rejected');
});

router.get('/classes', protect, authorizeRoles('faculty'), async (req, res) => {
    try {
        const classes = await ClassModel.find({ faculties: req.user._id })
            .populate('course', 'name code programType duration')
            .populate('department', 'name code')
            .sort({ academicYear: -1, semesterOrYear: 1, createdAt: -1 });
        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/faculty/classes/:id/students — List students in a specific class
router.get('/classes/:id/students', protect, authorizeRoles('hod', 'admin', 'faculty'), authorizeClassFacultyLite, async (req, res) => {
    try {
        const students = await User.find({ _id: { $in: req.classData.students || [] }, status: 'approved' })
            .select('firstName lastName email status createdAt')
            .sort({ firstName: 1 });

        res.json(students);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/faculty/classes/:id/course-plan — Update course plan
// GET /api/faculty/classes/:id/attendance?date=YYYY-MM-DD - Attendance for a class on one day
router.get('/classes/:id/attendance', protect, authorizeRoles('faculty', 'hod', 'admin'), authorizeClassFacultyLite, async (req, res) => {
    try {
        const dateKey = normalizeDateKey(req.query.date);
        if (!dateKey) {
            return res.status(400).json({ message: 'Valid date is required (YYYY-MM-DD).' });
        }

        const periods = await Attendance.find({ class: req.classData._id, dateKey }).sort({ period: 1 });
        return res.json({ classId: req.classData._id, dateKey, periods });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/faculty/classes/:id/attendance - Save period attendance
router.put('/classes/:id/attendance', protect, authorizeRoles('faculty', 'hod', 'admin'), authorizeClassFacultyLite, async (req, res) => {
    try {
        const { date, period, entries } = req.body || {};
        const dateKey = normalizeDateKey(date);
        const periodNum = Number(period);

        if (!dateKey) {
            return res.status(400).json({ message: 'Valid date is required (YYYY-MM-DD).' });
        }
        if (!VALID_PERIODS.has(periodNum)) {
            return res.status(400).json({ message: 'Period must be between 1 and 4.' });
        }
        if (!Array.isArray(entries) || entries.length === 0) {
            return res.status(400).json({ message: 'Attendance entries are required.' });
        }

        const classStudentIds = new Set((req.classData.students || []).map(id => String(id)));
        const validStatuses = new Set(['present', 'absent', 'late']);
        const seenStudents = new Set();
        const sanitizedEntries = [];

        entries.forEach((entry) => {
            const studentId = String(entry?.studentId || entry?.student || '').trim();
            const status = String(entry?.status || '').trim().toLowerCase();
            if (!studentId || seenStudents.has(studentId)) return;
            if (!classStudentIds.has(studentId)) return;
            if (!validStatuses.has(status)) return;

            seenStudents.add(studentId);
            sanitizedEntries.push({
                student: studentId,
                status
            });
        });

        if (!sanitizedEntries.length) {
            return res.status(400).json({ message: 'No valid attendance entries found for this class.' });
        }

        const attendance = await Attendance.findOneAndUpdate(
            { class: req.classData._id, dateKey, period: periodNum },
            {
                $set: {
                    entries: sanitizedEntries,
                    markedBy: req.user._id
                }
            },
            { new: true, upsert: true, setDefaultsOnInsert: true }
        );

        return res.json({
            message: `Attendance saved for period ${periodNum}.`,
            attendance
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/faculty/classes/:id/attendance/student/:studentId?from=YYYY-MM-DD&to=YYYY-MM-DD
router.get('/classes/:id/attendance/student/:studentId', protect, authorizeRoles('faculty', 'hod', 'admin'), authorizeClassFacultyLite, async (req, res) => {
    try {
        const studentId = String(req.params.studentId || '').trim();
        const classStudentIds = new Set((req.classData.students || []).map(id => String(id)));
        if (!studentId || !classStudentIds.has(studentId)) {
            return res.status(404).json({ message: 'Student not found in this class.' });
        }

        const fromDateKey = normalizeDateKey(req.query.from);
        const toDateKey = normalizeDateKey(req.query.to);

        const filter = { class: req.classData._id };
        if (fromDateKey || toDateKey) {
            filter.dateKey = {};
            if (fromDateKey) filter.dateKey.$gte = fromDateKey;
            if (toDateKey) filter.dateKey.$lte = toDateKey;
        }

        const attendanceRows = await Attendance.find(filter).sort({ dateKey: 1, period: 1 });
        const records = [];
        const summary = { total: 0, present: 0, absent: 0, late: 0 };

        attendanceRows.forEach((row) => {
            const entry = (row.entries || []).find(item => String(item.student) === studentId);
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

        const student = await User.findById(studentId).select('firstName lastName email');
        return res.json({
            classId: req.classData._id,
            student,
            from: fromDateKey || null,
            to: toDateKey || null,
            summary,
            records
        });
    } catch (error) {
        return res.status(500).json({ message: 'Server error.' });
    }
});

router.put('/classes/:id/course-plan', protect, authorizeRoles('faculty', 'hod', 'admin'), authorizeClassFaculty, async (req, res) => {
    try {
        const { coursePlan } = req.body;
        req.classData.coursePlan = coursePlan;
        await req.classData.save();
        res.json({ message: 'Course plan updated successfully.', coursePlan });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST /api/faculty/classes/:id/course-plan — Upload course plan file
router.post('/classes/:id/course-plan', protect, authorizeRoles('faculty', 'hod', 'admin'), authorizeClassFaculty, upload.single('coursePlan'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const fileUrl = `/uploads/${req.file.filename}`;
        const newCoursePlan = {
            title: req.file.originalname,
            url: fileUrl,
            uploadedBy: req.user._id,
            uploadDate: new Date()
        };

        const updatedClass = await ClassModel.findByIdAndUpdate(
            req.classData._id,
            {
                $push: { coursePlans: newCoursePlan },
                $set: {
                    'coursePlan.fileUrl': fileUrl,
                    'coursePlan.originalName': req.file.originalname
                }
            },
            { new: true }
        );

        res.json({
            message: 'Course plan uploaded successfully.',
            class: updatedClass,
            coursePlansCount: Array.isArray(updatedClass?.coursePlans) ? updatedClass.coursePlans.length : 0
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST /api/faculty/classes/:id/study-materials — Upload study material (file or link)
router.post('/classes/:id/study-materials', protect, authorizeRoles('faculty', 'hod', 'admin'), authorizeClassFaculty, upload.single('material'), async (req, res) => {
    try {
        const { title, url } = req.body;
        const uploadedFileUrl = req.file ? `/uploads/${req.file.filename}` : '';
        const materialUrl = uploadedFileUrl || url;
        const materialTitle = title || (req.file ? req.file.originalname : '');

        if (!materialTitle || !materialUrl) {
            return res.status(400).json({ message: 'Provide a file or both title and URL.' });
        }

        req.classData.studyMaterials.push({
            title: materialTitle,
            url: materialUrl,
            uploadedBy: req.user._id,
            uploadDate: new Date(),
        });

        await req.classData.save();
        res.status(201).json({ message: 'Study material added.', class: req.classData });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// DELETE /api/faculty/classes/:id/study-materials/:materialId — Delete a study material
router.delete('/classes/:id/study-materials/:materialId', protect, authorizeRoles('faculty', 'hod', 'admin'), authorizeClassFaculty, async (req, res) => {
    try {
        req.classData.studyMaterials = req.classData.studyMaterials.filter(
            m => m._id.toString() !== req.params.materialId
        );

        await req.classData.save();
        res.json({ message: 'Study material deleted.', studyMaterials: req.classData.studyMaterials });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

module.exports = router;
