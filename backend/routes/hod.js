const express = require('express');
const multer = require('multer');
const path = require('path');
const User = require('../models/User');
const Course = require('../models/Course');
const Department = require('../models/Department');
const ClassModel = require('../models/Class');
const { protect, authorizeRoles } = require('../middleware/auth');
const router = express.Router();

// Multer storage configuration
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Files will be stored in the 'uploads/' directory
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// Middleware to ensure the HOD only accesses their own department's data
// Admin can access everything
const normalizeDepartmentCode = (value = '') => String(value).trim().toLowerCase();
const escapeRegExp = (value = '') => String(value).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const getDeptFilter = (req) => {
    if (req.user.role === 'admin') return {};

    const departmentCode = normalizeDepartmentCode(req.user.department);
    if (!departmentCode) {
        return { department: '__missing_department__' };
    }

    return { department: new RegExp(`^${escapeRegExp(departmentCode)}$`, 'i') };
};

const isUserDepartmentMatch = (departmentDoc, userDepartmentCode) => {
    const classDepartmentCode = normalizeDepartmentCode(departmentDoc && departmentDoc.code);
    const normalizedUserDepartment = normalizeDepartmentCode(userDepartmentCode);
    if (!classDepartmentCode || !normalizedUserDepartment) return false;
    return classDepartmentCode === normalizedUserDepartment;
};

const getCurrentAcademicYear = () => {
    const now = new Date();
    const year = now.getFullYear();
    const academicStartYear = now.getMonth() >= 5 ? year : year - 1; // June onward
    return `${academicStartYear}-${academicStartYear + 1}`;
};

const getAcademicYearStart = (academicYear = '') => {
    const match = String(academicYear).match(/^(\d{4})-(\d{4})$/);
    if (!match) return Number.NEGATIVE_INFINITY;
    return Number(match[1]);
};

const getOrdinalSuffix = (num) => {
    if (num % 100 >= 11 && num % 100 <= 13) return 'th';
    if (num % 10 === 1) return 'st';
    if (num % 10 === 2) return 'nd';
    if (num % 10 === 3) return 'rd';
    return 'th';
};

const getYearLabel = (yearNumber) => `${yearNumber}${getOrdinalSuffix(yearNumber)} Year`;
const normalizeText = (value = '') => String(value).trim().toLowerCase();
const normalizeCourseKey = (value = '') => normalizeText(value).replace(/[^a-z0-9]+/g, '');
const parseYearNumber = (value = '') => {
    const match = String(value || '').match(/\b([1-6])(?:st|nd|rd|th)?\b/i);
    return match ? match[1] : '';
};

const pickAcademicYearForCourse = (courseClasses = []) => {
    if (!courseClasses.length) return getCurrentAcademicYear();

    const sortedByStartYear = [...courseClasses].sort((a, b) =>
        getAcademicYearStart(b.academicYear) - getAcademicYearStart(a.academicYear)
    );

    const best = sortedByStartYear.find(cls => Number.isFinite(getAcademicYearStart(cls.academicYear)));
    if (best && best.academicYear) return best.academicYear;

    const fallback = courseClasses.find(cls => cls.academicYear);
    return fallback ? fallback.academicYear : getCurrentAcademicYear();
};

const ensureDynamicClassesForCourses = async (courseFilter = {}) => {
    const courses = await Course.find(courseFilter)
        .select('_id code name duration department')
        .lean();

    if (!courses.length) return;

    const courseIds = courses.map(course => course._id);
    const existingClasses = await ClassModel.find({ course: { $in: courseIds } })
        .select('course academicYear semesterOrYear')
        .lean();

    const classesByCourse = new Map();
    existingClasses.forEach((cls) => {
        const courseId = String(cls.course);
        if (!classesByCourse.has(courseId)) classesByCourse.set(courseId, []);
        classesByCourse.get(courseId).push(cls);
    });

    const operations = [];

    courses.forEach((course) => {
        const courseId = String(course._id);
        const courseClasses = classesByCourse.get(courseId) || [];
        const targetAcademicYear = pickAcademicYearForCourse(courseClasses);
        const existingKeys = new Set(
            courseClasses.map(cls => `${String(cls.academicYear)}|${String(cls.semesterOrYear).trim().toLowerCase()}`)
        );

        const duration = Number(course.duration) || 0;
        const classCodeBase = String(course.code || course.name || 'COURSE').trim().toUpperCase();

        for (let year = 1; year <= duration; year += 1) {
            const semesterOrYear = getYearLabel(year);
            const key = `${targetAcademicYear}|${semesterOrYear.toLowerCase()}`;

            if (existingKeys.has(key)) continue;

            operations.push({
                updateOne: {
                    filter: {
                        course: course._id,
                        academicYear: targetAcademicYear,
                        semesterOrYear
                    },
                    update: {
                        $setOnInsert: {
                            name: `${classCodeBase} ${semesterOrYear} Batch`,
                            course: course._id,
                            department: course.department,
                            academicYear: targetAcademicYear,
                            semesterOrYear
                        }
                    },
                    upsert: true
                }
            });

            existingKeys.add(key);
        }
    });

    if (operations.length > 0) {
        await ClassModel.bulkWrite(operations, { ordered: false });
    }
};

const findMatchingClassForStudent = async (student, departmentCode = '') => {
    const studentCourse = normalizeCourseKey(student?.course);
    if (!studentCourse) return null;

    const studentYear = parseYearNumber(student?.year);

    const classFilter = {};

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
        const classYear = parseYearNumber(cls?.semesterOrYear);
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

const syncStudentClassMembership = async (student, status, departmentCode = '') => {
    if (status === 'rejected') {
        await ClassModel.updateMany({ students: student._id }, { $pull: { students: student._id } });
        return { assignedClass: null, warning: '' };
    }

    if (status !== 'approved') {
        return { assignedClass: null, warning: '' };
    }

    const matchedClass = await findMatchingClassForStudent(student, departmentCode);
    if (!matchedClass) {
        return {
            assignedClass: null,
            warning: 'Student approved, but no matching class was found for auto-assignment.'
        };
    }

    await ClassModel.updateMany({ students: student._id }, { $pull: { students: student._id } });
    await ClassModel.updateOne({ _id: matchedClass._id }, { $addToSet: { students: student._id } });
    return { assignedClass: matchedClass, warning: '' };
};

// GET /api/hod/stats — HOD specific stats
router.get('/stats', protect, authorizeRoles('hod', 'admin'), async (req, res) => {
    try {
        const filter = getDeptFilter(req);

        const totalStudents = await User.countDocuments({ role: 'student', ...filter });
        const pendingStudents = await User.countDocuments({ role: 'student', status: 'pending', ...filter });
        const approvedStudents = await User.countDocuments({ role: 'student', status: 'approved', ...filter });
        const totalFaculty = await User.countDocuments({ role: 'faculty', ...filter });

        // Find department ID for Course/Class queries
        let deptIdFilter = {};
        if (req.user.role !== 'admin') {
            const departmentCode = normalizeDepartmentCode(req.user.department);
            const dept = departmentCode ? await Department.findOne({ code: departmentCode }) : null;
            deptIdFilter = dept ? { department: dept._id } : { _id: null };
        }

        const totalCourses = await Course.countDocuments(deptIdFilter);
        const totalClasses = await ClassModel.countDocuments(deptIdFilter);

        res.json({ totalStudents, pendingStudents, approvedStudents, totalFaculty, totalCourses, totalClasses });
    } catch (error) {
        console.error('HOD stats error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/hod/pending — List pending students in HOD's department
router.get('/pending', protect, authorizeRoles('hod', 'admin'), async (req, res) => {
    try {
        const pendingUsers = await User.find({ status: 'pending', role: 'student', ...getDeptFilter(req) })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(pendingUsers);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/hod/approve/:id — Approve a student (must be in their dept)
router.put('/approve/:id', protect, authorizeRoles('hod', 'admin'), async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, ...getDeptFilter(req) });
        if (!user) return res.status(404).json({ message: 'User not found or not in your department.' });

        const { assignedClass, warning } = await syncStudentClassMembership(
            user,
            'approved',
            req.user.role === 'admin' ? user.department : req.user.department
        );

        user.status = 'approved';
        await user.save();
        res.json({
            message: warning || `${user.firstName} has been approved.`,
            user,
            assignedClass: assignedClass ? { id: assignedClass._id, name: assignedClass.name } : null
        });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/hod/reject/:id — Reject a student
router.put('/reject/:id', protect, authorizeRoles('hod', 'admin'), async (req, res) => {
    try {
        const user = await User.findOne({ _id: req.params.id, ...getDeptFilter(req) });
        if (!user) return res.status(404).json({ message: 'User not found or not in your department.' });

        await syncStudentClassMembership(user, 'rejected');
        user.status = 'rejected';
        await user.save();
        res.json({ message: `${user.firstName} has been rejected.`, user });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/hod/students — List all approved students in dept
router.get('/students', protect, authorizeRoles('hod', 'admin'), async (req, res) => {
    try {
        const users = await User.find({ role: 'student', status: 'approved', ...getDeptFilter(req) })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/hod/faculty — List all faculty in dept
router.get('/faculty', protect, authorizeRoles('hod', 'admin'), async (req, res) => {
    try {
        const users = await User.find({ role: 'faculty', ...getDeptFilter(req) })
            .select('-password')
            .sort({ createdAt: -1 });
        res.json(users);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// POST /api/hod/faculty — Create a new faculty account in dept
router.post('/faculty', protect, authorizeRoles('hod', 'admin'), async (req, res) => {
    try {
        const { firstName, lastName, email, password, classId } = req.body;

        // HOD can only create faculty for their own department
        let departmentCode = req.user.department;
        if (req.user.role === 'admin' && req.body.department) {
            departmentCode = req.body.department;
        }

        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const faculty = await User.create({
            firstName,
            lastName,
            email,
            password,
            department: departmentCode,
            role: 'faculty',
            assignedClass: classId,
            status: 'approved' // Auto-approve created faculty
        });

        if (classId) {
            await ClassModel.findByIdAndUpdate(classId, { $push: { faculties: faculty._id } });
        }

        if (faculty) {
            res.status(201).json({
                _id: faculty._id,
                name: `${faculty.firstName} ${faculty.lastName}`,
                email: faculty.email,
                role: faculty.role,
                department: faculty.department
            });
        } else {
            res.status(400).json({ message: 'Invalid user data' });
        }
    } catch (error) {
        console.error('Faculty creation error:', error);
        res.status(500).json({ message: 'Server error' });
    }
});

// ========== CLASS MANAGEMENT ==========

// POST /api/hod/classes — Create a new class/batch
router.post('/classes', protect, authorizeRoles('admin'), async (req, res) => {
    try {
        const { name, courseId, academicYear, semesterOrYear } = req.body;

        const course = await Course.findById(courseId).populate('department');
        if (!course) return res.status(404).json({ message: 'Course not found.' });

        const newClass = new ClassModel({
            name,
            course: courseId,
            department: course.department._id,
            academicYear,
            semesterOrYear
        });

        await newClass.save();
        res.status(201).json({ message: 'Class created successfully', class: newClass });
    } catch (error) {
        console.error('Class creation error:', error);
        res.status(500).json({ message: 'Server error.' });
    }
});

// GET /api/hod/classes — Get all classes in dept
router.get('/classes', protect, authorizeRoles('hod', 'admin', 'faculty'), async (req, res) => {
    try {
        let deptIdFilter = {};
        let courseFilter = {};
        if (req.user.role !== 'admin') {
            const departmentCode = normalizeDepartmentCode(req.user.department);
            const dept = departmentCode ? await Department.findOne({ code: departmentCode }) : null;
            if (!dept) return res.json([]);
            deptIdFilter = { department: dept._id };
            courseFilter = { department: dept._id };
        }

        if (req.user.role !== 'faculty') {
            await ensureDynamicClassesForCourses(courseFilter);
        }

        // If faculty, only return classes they are assigned to
        const facultyFilter = req.user.role === 'faculty' ? { faculties: req.user._id } : {};

        const classes = await ClassModel.find({ ...deptIdFilter, ...facultyFilter })
            .populate('course', 'name code programType')
            .populate('faculties', 'firstName lastName email')
            .sort({ academicYear: -1, semesterOrYear: 1, createdAt: -1 });

        res.json(classes);
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// PUT /api/hod/classes/:id/assign — Assign faculty or students to a class
router.put('/classes/:id/assign', protect, authorizeRoles('hod', 'admin'), async (req, res) => {
    try {
        const { facultyIds, studentIds } = req.body;
        const cls = await ClassModel.findById(req.params.id).populate('department');
        if (!cls) return res.status(404).json({ message: 'Class not found.' });

        if (req.user.role !== 'admin' && !isUserDepartmentMatch(cls.department, req.user.department)) {
            return res.status(403).json({ message: 'Not authorized for this department.' });
        }

        if (facultyIds) cls.faculties = facultyIds;
        if (studentIds) cls.students = studentIds;

        await cls.save();
        res.json({ message: 'Class assignments updated.', class: cls });
    } catch (error) {
        res.status(500).json({ message: 'Server error.' });
    }
});

// Upload Course Plan
router.post('/class/:id/course-plan', protect, authorizeRoles('hod'), upload.single('coursePlan'), async (req, res) => {
    try {
        const classObj = await ClassModel.findById(req.params.id).populate('department');
        if (!classObj) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Verify HOD department ownership
        if (!isUserDepartmentMatch(classObj.department, req.user.department)) {
            return res.status(403).json({ message: 'Not authorized for this department\'s classes' });
        }

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
            classObj._id,
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
            message: 'Course plan uploaded successfully',
            class: updatedClass,
            coursePlansCount: Array.isArray(updatedClass?.coursePlans) ? updatedClass.coursePlans.length : 0
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Upload Study Materials
router.post('/class/:id/study-materials', protect, authorizeRoles('hod'), upload.single('material'), async (req, res) => {
    try {
        const classObj = await ClassModel.findById(req.params.id).populate('department');
        if (!classObj) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Verify HOD department ownership
        if (!isUserDepartmentMatch(classObj.department, req.user.department)) {
            return res.status(403).json({ message: 'Not authorized for this department\'s classes' });
        }

        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const newMaterial = {
            title: req.body.title || req.file.originalname,
            url: `/uploads/${req.file.filename}`,
            uploadedBy: req.user._id,
            uploadDate: new Date()
        };

        classObj.studyMaterials.push(newMaterial);
        await classObj.save();

        res.json({ message: 'Study material uploaded successfully', class: classObj });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

// Delete Study Material
router.delete('/class/:classId/study-materials/:materialId', protect, authorizeRoles('hod'), async (req, res) => {
    try {
        const classObj = await ClassModel.findById(req.params.classId).populate('department');
        if (!classObj) {
            return res.status(404).json({ message: 'Class not found' });
        }

        // Verify HOD department ownership
        if (!isUserDepartmentMatch(classObj.department, req.user.department)) {
            return res.status(403).json({ message: 'Not authorized for this department\'s classes' });
        }

        classObj.studyMaterials = classObj.studyMaterials.filter(
            mat => mat._id.toString() !== req.params.materialId
        );

        await classObj.save();

        res.json({ message: 'Study material deleted successfully', class: classObj });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Server error' });
    }
});

module.exports = router;
