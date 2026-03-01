import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import './HodDashboard.css';
import './FacultyDashboard.css';
import { authFetch, getCurrentUser, logoutUser, notifyAuthChanged } from '../components/authClient';
import LeavePanel from '../components/LeavePanel';

const ATTENDANCE_PERIODS = [
    { number: 1, label: 'Period 1', time: '9:00 AM - 10:00 AM' },
    { number: 2, label: 'Period 2', time: '10:00 AM - 11:00 AM' },
    { number: 3, label: 'After Lunch - Period 1', time: '2:00 PM - 3:00 PM' },
    { number: 4, label: 'After Lunch - Period 2', time: '3:00 PM - 4:00 PM' }
];
const STUDENT_REFRESH_INTERVAL_MS = 15000;
const ATTENDANCE_DAY_ROLLOVER_CHECK_MS = 60000;

const formatDateKey = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getTodayDateKey = () => formatDateKey(new Date());

const getMonthRange = (anchorDate = getTodayDateKey()) => {
    const date = new Date(anchorDate);
    if (Number.isNaN(date.getTime())) {
        const today = getTodayDateKey();
        return { from: today, to: today };
    }

    const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
    const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    const today = getTodayDateKey();
    const from = formatDateKey(monthStart);
    const endOfMonthKey = formatDateKey(monthEnd);
    const to = endOfMonthKey > today ? today : endOfMonthKey;
    return { from, to };
};

const getSemesterRange = (selectedClass) => {
    const academicYear = String(selectedClass?.academicYear || '');
    const match = academicYear.match(/^(\d{4})-(\d{4})$/);
    if (!match) return getMonthRange();

    const startYear = match[1];
    const from = `${startYear}-06-01`;
    const today = getTodayDateKey();
    if (from > today) {
        return { from: today, to: today };
    }
    return { from, to: today };
};

const buildAttendanceDaySummary = (records = []) => {
    const periodMetaMap = new Map(
        ATTENDANCE_PERIODS.map((period) => [period.number, period])
    );

    const byDate = new Map();
    records.forEach((record) => {
        const dateKey = String(record?.dateKey || '').trim();
        if (!dateKey) return;

        if (!byDate.has(dateKey)) {
            byDate.set(dateKey, {
                dateKey,
                presentPeriods: [],
                absentPeriods: [],
                latePeriods: [],
                periodTimeline: ATTENDANCE_PERIODS.map((period) => ({
                    period: period.number,
                    label: period.label,
                    time: period.time,
                    status: 'not_marked'
                }))
            });
        }

        const dayRow = byDate.get(dateKey);
        const periodNumber = Number(record?.period);
        const meta = periodMetaMap.get(periodNumber);
        const periodEntry = {
            period: Number.isFinite(periodNumber) ? periodNumber : 0,
            label: meta ? `${meta.label} (${meta.time})` : `Period ${record?.period}`
        };

        const status = String(record?.status || 'present').toLowerCase();
        const timelineSlot = dayRow.periodTimeline.find((slot) => slot.period === periodNumber);
        if (timelineSlot) {
            timelineSlot.status = status === 'absent' || status === 'late' ? status : 'present';
        }

        if (status === 'absent') {
            dayRow.absentPeriods.push(periodEntry);
        } else if (status === 'late') {
            dayRow.latePeriods.push(periodEntry);
        } else {
            dayRow.presentPeriods.push(periodEntry);
        }
    });

    const sortPeriods = (items = []) => items.sort((a, b) => a.period - b.period);
    const rows = Array.from(byDate.values()).map((row) => ({
        ...row,
        presentPeriods: sortPeriods(row.presentPeriods),
        absentPeriods: sortPeriods(row.absentPeriods),
        latePeriods: sortPeriods(row.latePeriods),
        periodTimeline: [...row.periodTimeline].sort((a, b) => a.period - b.period)
    }));

    return rows.sort((a, b) => a.dateKey.localeCompare(b.dateKey));
};

const FacultyDashboard = () => {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [assignedClasses, setAssignedClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadingPlan, setUploadingPlan] = useState(false);
    const [uploadingMaterial, setUploadingMaterial] = useState(false);
    const [registrationStudents, setRegistrationStudents] = useState([]);
    const [loadingRegistrations, setLoadingRegistrations] = useState(false);
    const [registrationSearchTerm, setRegistrationSearchTerm] = useState('');
    const [registrationStatusFilter, setRegistrationStatusFilter] = useState('pending');
    const [registrationActionKey, setRegistrationActionKey] = useState('');
    const [attendanceDate, setAttendanceDate] = useState(getTodayDateKey());
    const [selectedAttendancePeriod, setSelectedAttendancePeriod] = useState(1);
    const [attendanceSelections, setAttendanceSelections] = useState({});
    const [loadingAttendance, setLoadingAttendance] = useState(false);
    const [savingAttendance, setSavingAttendance] = useState(false);
    const [attendanceMode, setAttendanceMode] = useState('mark');
    const [attendanceSheetStudentId, setAttendanceSheetStudentId] = useState('');
    const [attendanceSheetRangeType, setAttendanceSheetRangeType] = useState('monthly');
    const [attendanceSheetDay, setAttendanceSheetDay] = useState(getTodayDateKey());
    const [attendanceSheetFromDate, setAttendanceSheetFromDate] = useState(() => getMonthRange().from);
    const [attendanceSheetToDate, setAttendanceSheetToDate] = useState(() => getMonthRange().to);
    const [attendanceSheet, setAttendanceSheet] = useState(null);
    const [loadingAttendanceSheet, setLoadingAttendanceSheet] = useState(false);
    const [isSheetStudentDropdownOpen, setIsSheetStudentDropdownOpen] = useState(false);
    const sheetStudentDropdownRef = useRef(null);
    const attendanceDateRolloverRef = useRef(getTodayDateKey());
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const formatProgramType = (selectedClass) => {
        if (selectedClass?.course?.programTypeLabel) return selectedClass.course.programTypeLabel;
        const raw = String(selectedClass?.course?.programType || '').trim().toLowerCase();
        if (!raw) return 'N/A';
        if (raw === 'ug') return 'Undergraduate';
        if (raw === 'pg') return 'Postgraduate';
        return raw.toUpperCase();
    };

    const getCoursePlanFiles = (selectedClass) => {
        const plans = Array.isArray(selectedClass?.coursePlans) ? [...selectedClass.coursePlans] : [];
        const legacyUrl = selectedClass?.coursePlan?.fileUrl;
        const legacyName = selectedClass?.coursePlan?.originalName;

        if (legacyUrl && !plans.some(plan => plan.url === legacyUrl)) {
            plans.push({
                _id: `legacy-${legacyUrl}`,
                title: legacyName || 'Course Plan',
                url: legacyUrl,
                uploadDate: null
            });
        }

        return plans.sort((a, b) => {
            const aTime = a?.uploadDate ? new Date(a.uploadDate).getTime() : 0;
            const bTime = b?.uploadDate ? new Date(b.uploadDate).getTime() : 0;
            return bTime - aTime;
        });
    };

    const buildAttendanceSelections = (studentsList = [], periods = []) => {
        const base = {};
        ATTENDANCE_PERIODS.forEach((slot) => {
            base[slot.number] = {};
            studentsList.forEach((student) => {
                base[slot.number][student._id] = 'present';
            });
        });

        periods.forEach((periodData) => {
            const periodNumber = Number(periodData?.period);
            if (!base[periodNumber]) return;
            const entries = Array.isArray(periodData?.entries) ? periodData.entries : [];
            entries.forEach((entry) => {
                const studentId = String(entry?.student?._id || entry?.student || '').trim();
                if (!studentId) return;
                base[periodNumber][studentId] = entry?.status || 'present';
            });
        });

        return base;
    };

    const fetchAssignedClasses = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage('');

            const classesRes = await authFetch('/api/faculty/classes');
            if (!classesRes.ok) throw new Error('Failed to fetch classes');

            const classesData = await classesRes.json();
            if (!Array.isArray(classesData) || classesData.length === 0) {
                setAssignedClasses([]);
                setSelectedClassId('');
                setClassData(null);
                setStudents([]);
                return;
            }

            setAssignedClasses(classesData);
            setSelectedClassId((prevSelectedClassId) => {
                if (prevSelectedClassId && classesData.some(cls => String(cls._id) === String(prevSelectedClassId))) {
                    return prevSelectedClassId;
                }
                if (user?.assignedClass && classesData.some(cls => String(cls._id) === String(user.assignedClass))) {
                    return String(user.assignedClass);
                }
                return String(classesData[0]._id);
            });
        } catch (error) {
            console.error('Failed to fetch classes:', error);
            setErrorMessage('Failed to load faculty data. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, [user?.assignedClass]);

    const fetchStudentsForClass = useCallback(async (classId, options = {}) => {
        const { silent = false } = options;
        if (!classId) {
            setStudents([]);
            return;
        }

        try {
            if (!silent) {
                setLoadingStudents(true);
            }

            const studentsRes = await authFetch(`/api/faculty/classes/${classId}/students`);
            if (!studentsRes.ok) throw new Error('Failed to fetch students');

            const studentsData = await studentsRes.json();
            setStudents(Array.isArray(studentsData) ? studentsData : []);
        } catch (error) {
            console.error('Failed to fetch students:', error);
            if (!silent) {
                setStudents([]);
                setErrorMessage('Unable to load students for the selected class.');
            }
        } finally {
            if (!silent) {
                setLoadingStudents(false);
            }
        }
    }, []);

    const fetchRegistrationStudents = useCallback(async () => {
        try {
            setLoadingRegistrations(true);
            const res = await authFetch('/api/faculty/registrations');

            if (!res.ok) {
                throw new Error('Failed to fetch registration requests');
            }

            const data = await res.json();
            setRegistrationStudents(Array.isArray(data) ? data : []);
        } catch (error) {
            console.error('Failed to fetch registration requests:', error);
            setRegistrationStudents([]);
            setErrorMessage('Unable to load registration requests.');
        } finally {
            setLoadingRegistrations(false);
        }
    }, []);

    const fetchAttendanceForDay = useCallback(async (classId, dateKey) => {
        if (!classId || !dateKey) return;

        try {
            setLoadingAttendance(true);
            const res = await authFetch(`/api/faculty/classes/${classId}/attendance?date=${dateKey}`);

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to load attendance data');
            }

            const data = await res.json();
            const periods = Array.isArray(data?.periods) ? data.periods : [];
            setAttendanceSelections(buildAttendanceSelections(students, periods));
        } catch (error) {
            console.error('Failed to fetch attendance:', error);
            setErrorMessage(error.message || 'Unable to load attendance data.');
            setAttendanceSelections(buildAttendanceSelections(students, []));
        } finally {
            setLoadingAttendance(false);
        }
    }, [students]);

    const fetchAttendanceSheet = useCallback(async (classId, studentId, fromDate, toDate) => {
        if (!classId || !studentId) return;

        try {
            setLoadingAttendanceSheet(true);
            const params = new URLSearchParams();
            if (fromDate) params.set('from', fromDate);
            if (toDate) params.set('to', toDate);

            const res = await authFetch(`/api/faculty/classes/${classId}/attendance/student/${studentId}?${params.toString()}`);

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch attendance sheet');
            }

            const data = await res.json();
            setAttendanceSheet(data);
        } catch (error) {
            console.error('Failed to fetch attendance sheet:', error);
            setAttendanceSheet(null);
            setErrorMessage(error.message || 'Unable to fetch attendance sheet.');
        } finally {
            setLoadingAttendanceSheet(false);
        }
    }, []);

    const applyAttendanceSheetRange = useCallback((rangeType, options = {}) => {
        if (rangeType === 'day') {
            const day = options.day || attendanceSheetDay || getTodayDateKey();
            setAttendanceSheetDay(day);
            setAttendanceSheetFromDate(day);
            setAttendanceSheetToDate(day);
            return;
        }

        if (rangeType === 'semester') {
            const { from, to } = getSemesterRange(classData);
            setAttendanceSheetFromDate(from);
            setAttendanceSheetToDate(to);
            return;
        }

        const { from, to } = getMonthRange(options.anchorDate || getTodayDateKey());
        setAttendanceSheetFromDate(from);
        setAttendanceSheetToDate(to);
    }, [attendanceSheetDay, classData]);

    const handleAttendanceSheetRangeTypeChange = (nextType) => {
        setAttendanceSheetRangeType(nextType);
        applyAttendanceSheetRange(nextType);
    };

    const handleAttendanceSheetDayChange = (nextDay) => {
        setAttendanceSheetDay(nextDay);
        if (attendanceSheetRangeType === 'day') {
            applyAttendanceSheetRange('day', { day: nextDay });
        }
    };

    useEffect(() => {
        let mounted = true;
        const hydrateAuth = async () => {
            const currentUser = await getCurrentUser();
            if (!mounted) return;

            if (!currentUser || currentUser.role !== 'faculty') {
                setAuthLoading(false);
                navigate('/login');
                return;
            }

            setUser(currentUser);
            setAuthLoading(false);
        };

        hydrateAuth();
        return () => {
            mounted = false;
        };
    }, [navigate]);

    useEffect(() => {
        if (authLoading) return;
        if (user?.role !== 'faculty') return;
        fetchAssignedClasses();
    }, [authLoading, user?.role, fetchAssignedClasses]);

    useEffect(() => {
        if (authLoading) return;
        if (user?.role !== 'faculty') return;
        fetchRegistrationStudents();
    }, [authLoading, user?.role, fetchRegistrationStudents]);

    useEffect(() => {
        if (!selectedClassId) {
            setClassData(null);
            setStudents([]);
            return;
        }

        const selectedClass = assignedClasses.find(cls => String(cls._id) === String(selectedClassId)) || null;
        setClassData(selectedClass);
        setSearchTerm('');
        fetchStudentsForClass(selectedClassId);
    }, [selectedClassId, assignedClasses, fetchStudentsForClass]);

    useEffect(() => {
        const syncAttendanceDateAtDayChange = () => {
            const todayDateKey = getTodayDateKey();
            if (attendanceDateRolloverRef.current === todayDateKey) return;

            attendanceDateRolloverRef.current = todayDateKey;
            setAttendanceDate(todayDateKey);
        };

        const intervalId = setInterval(syncAttendanceDateAtDayChange, ATTENDANCE_DAY_ROLLOVER_CHECK_MS);
        return () => {
            clearInterval(intervalId);
        };
    }, []);

    useEffect(() => {
        if (authLoading) return;
        if (user?.role !== 'faculty') return;
        if (!selectedClassId) return;

        const refreshStudents = () => {
            fetchStudentsForClass(selectedClassId, { silent: true });
        };

        refreshStudents();
        const intervalId = setInterval(refreshStudents, STUDENT_REFRESH_INTERVAL_MS);

        return () => {
            clearInterval(intervalId);
        };
    }, [authLoading, user?.role, selectedClassId, fetchStudentsForClass]);

    useEffect(() => {
        if (activeSection !== 'attendance' || attendanceMode !== 'sheet') return;
        applyAttendanceSheetRange(attendanceSheetRangeType);
    }, [
        activeSection,
        attendanceMode,
        attendanceSheetRangeType,
        selectedClassId,
        classData?.academicYear,
        applyAttendanceSheetRange
    ]);

    useEffect(() => {
        if (activeSection !== 'attendance' || attendanceMode !== 'mark') return;
        if (!selectedClassId || !attendanceDate) return;
        fetchAttendanceForDay(selectedClassId, attendanceDate);
    }, [activeSection, attendanceMode, selectedClassId, attendanceDate, fetchAttendanceForDay]);

    useEffect(() => {
        if (!students.length) {
            setAttendanceSheetStudentId('');
            setAttendanceSheet(null);
            return;
        }

        setAttendanceSheetStudentId((prev) => {
            if (prev && students.some(student => String(student._id) === String(prev))) {
                return prev;
            }
            return String(students[0]._id);
        });
    }, [students]);

    useEffect(() => {
        if (activeSection !== 'attendance' || attendanceMode !== 'sheet') return;
        if (!selectedClassId || !attendanceSheetStudentId) return;
        fetchAttendanceSheet(selectedClassId, attendanceSheetStudentId, attendanceSheetFromDate, attendanceSheetToDate);
    }, [
        activeSection,
        attendanceMode,
        selectedClassId,
        attendanceSheetStudentId,
        attendanceSheetFromDate,
        attendanceSheetToDate,
        fetchAttendanceSheet
    ]);

    useEffect(() => {
        if (!isSheetStudentDropdownOpen) return;

        const handleOutsideClick = (event) => {
            if (!sheetStudentDropdownRef.current?.contains(event.target)) {
                setIsSheetStudentDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleOutsideClick);
        return () => {
            document.removeEventListener('mousedown', handleOutsideClick);
        };
    }, [isSheetStudentDropdownOpen]);

    const handleLogout = async () => {
        await logoutUser();
        notifyAuthChanged();
        navigate('/login');
    };

    const refreshSelectedClass = async (classId) => {
        await fetchAssignedClasses();
        if (classId) {
            setSelectedClassId(String(classId));
            fetchStudentsForClass(String(classId));
        }
    };

    const handleCoursePlanUpload = async (event) => {
        const files = Array.from(event.target.files || []);
        event.target.value = '';
        if (!files.length || !classData?._id) return;

        try {
            setUploadingPlan(true);
            setErrorMessage('');

            const failures = [];
            for (const file of files) {
                const formData = new FormData();
                formData.append('coursePlan', file);

                const res = await authFetch(`/api/faculty/classes/${classData._id}/course-plan`, {
                    method: 'POST',
                    body: formData
                });

                if (!res.ok) {
                    const data = await res.json();
                    failures.push(data.message || `Failed to upload ${file.name}`);
                }
            }

            if (failures.length) {
                throw new Error(failures[0]);
            }
            await refreshSelectedClass(classData._id);
        } catch (error) {
            console.error('Course plan upload failed:', error);
            setErrorMessage(error.message || 'Course plan upload failed.');
        } finally {
            setUploadingPlan(false);
        }
    };

    const handleMaterialUpload = async (event) => {
        const file = event.target.files[0];
        event.target.value = '';
        if (!file || !classData?._id) return;

        try {
            setUploadingMaterial(true);
            setErrorMessage('');

            const formData = new FormData();
            formData.append('material', file);

            const res = await authFetch(`/api/faculty/classes/${classData._id}/study-materials`, {
                method: 'POST',
                body: formData
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to upload study material');
            }

            await refreshSelectedClass(classData._id);
        } catch (error) {
            console.error('Study material upload failed:', error);
            setErrorMessage(error.message || 'Study material upload failed.');
        } finally {
            setUploadingMaterial(false);
        }
    };

    const handleRegistrationStatusChange = async (studentId, nextStatus) => {
        const action = nextStatus === 'approved' ? 'approve' : 'reject';
        const actionKey = `${studentId}:${action}`;

        try {
            setRegistrationActionKey(actionKey);
            setErrorMessage('');

            const res = await authFetch(`/api/faculty/registrations/${studentId}/${action}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    classId: nextStatus === 'approved' && selectedClassId ? selectedClassId : undefined
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.message || 'Failed to update registration status');
            }

            await fetchRegistrationStudents();
            if (selectedClassId) {
                await fetchStudentsForClass(selectedClassId);
            }
        } catch (error) {
            console.error('Failed to update registration status:', error);
            setErrorMessage(error.message || 'Failed to update student status.');
        } finally {
            setRegistrationActionKey('');
        }
    };

    const handleAttendanceStatusChange = (studentId, status) => {
        setAttendanceSelections((prev) => ({
            ...prev,
            [selectedAttendancePeriod]: {
                ...(prev[selectedAttendancePeriod] || {}),
                [studentId]: status
            }
        }));
    };

    const handleSaveAttendance = async () => {
        if (!classData?._id || !students.length) return;

        try {
            setSavingAttendance(true);
            setErrorMessage('');

            const periodSelections = attendanceSelections[selectedAttendancePeriod] || {};
            const entries = students.map((student) => ({
                studentId: student._id,
                status: periodSelections[student._id] || 'present'
            }));

            const res = await authFetch(`/api/faculty/classes/${classData._id}/attendance`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: attendanceDate,
                    period: selectedAttendancePeriod,
                    entries
                })
            });

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to save attendance');
            }

            await fetchAttendanceForDay(classData._id, attendanceDate);
        } catch (error) {
            console.error('Failed to save attendance:', error);
            setErrorMessage(error.message || 'Failed to save attendance.');
        } finally {
            setSavingAttendance(false);
        }
    };

    const handleLoadAttendanceSheet = async () => {
        if (!selectedClassId || !attendanceSheetStudentId) return;
        await fetchAttendanceSheet(selectedClassId, attendanceSheetStudentId, attendanceSheetFromDate, attendanceSheetToDate);
    };

    const renderUploadActions = (type) => {
        if (type === 'plan') {
            return (
                <label className="btn-create faculty-upload-btn">
                    <i className={`fa-solid ${uploadingPlan ? 'fa-spinner fa-spin' : 'fa-file-arrow-up'}`}></i>
                    {uploadingPlan ? 'Uploading...' : 'Upload Plans'}
                    <input
                        className="faculty-hidden-file-input"
                        type="file"
                        multiple
                        accept=".pdf,.doc,.docx,.ppt,.pptx,.txt"
                        onChange={handleCoursePlanUpload}
                        disabled={uploadingPlan}
                    />
                </label>
            );
        }

        return (
            <label className="btn-create faculty-upload-btn">
                <i className={`fa-solid ${uploadingMaterial ? 'fa-spinner fa-spin' : 'fa-cloud-arrow-up'}`}></i>
                {uploadingMaterial ? 'Uploading...' : 'Upload Material'}
                <input
                    className="faculty-hidden-file-input"
                    type="file"
                    onChange={handleMaterialUpload}
                    disabled={uploadingMaterial}
                />
            </label>
        );
    };

    const renderClassSelector = () => {
        if (!assignedClasses.length) return null;

        const getClassLabel = (cls) => `${cls.course?.name || cls.name || 'Class'} - ${cls.academicYear} - ${cls.semesterOrYear}`;

        return (
            <div className="faculty-class-picker">
                <span className="faculty-class-label">Class</span>
                {assignedClasses.length === 1 ? (
                    <div className="faculty-class-single">{getClassLabel(assignedClasses[0])}</div>
                ) : (
                    <div className="faculty-class-chips" role="tablist" aria-label="Class Selection">
                        {assignedClasses.map((cls) => (
                            <button
                                key={cls._id}
                                type="button"
                                className={`faculty-class-chip ${String(cls._id) === String(selectedClassId) ? 'active' : ''}`}
                                onClick={() => setSelectedClassId(String(cls._id))}
                                title={getClassLabel(cls)}
                                aria-selected={String(cls._id) === String(selectedClassId)}
                            >
                                {getClassLabel(cls)}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const pendingRegistrationsCount = registrationStudents.filter(
        student => student.status === 'pending'
    ).length;

    const renderSidebar = () => (
        <aside className={`hod-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <i className="fa-solid fa-graduation-cap logo-icon"></i>
                {!sidebarCollapsed && <span className="logo-text">Parker Faculty</span>}
                <button className="collapse-btn" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                    <i className={`fa-solid fa-chevron-${sidebarCollapsed ? 'right' : 'left'}`}></i>
                </button>
            </div>

            <nav className="sidebar-nav">
                <button className="nav-btn back-to-site" onClick={() => navigate('/')} title={sidebarCollapsed ? 'Back to Site' : ''}>
                    <i className="fa-solid fa-arrow-left"></i>
                    {!sidebarCollapsed && <span>Back to Site</span>}
                </button>
                <div className="nav-divider"></div>

                <div className="nav-group">
                    <p className="nav-label">Main</p>
                    <button className={`nav-btn ${activeSection === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveSection('dashboard')}>
                        <i className="fa-solid fa-chart-pie"></i>
                        {!sidebarCollapsed && <span>Overview</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'students' ? 'active' : ''}`} onClick={() => setActiveSection('students')}>
                        <i className="fa-solid fa-users"></i>
                        {!sidebarCollapsed && <span>Students</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'attendance' ? 'active' : ''}`} onClick={() => setActiveSection('attendance')}>
                        <i className="fa-solid fa-clipboard-check"></i>
                        {!sidebarCollapsed && <span>Attendance</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'registrations' ? 'active' : ''}`} onClick={() => setActiveSection('registrations')}>
                        <i className="fa-solid fa-user-check"></i>
                        {!sidebarCollapsed && <span>Registrations</span>}
                        {!sidebarCollapsed && pendingRegistrationsCount > 0 && (
                            <span className="nav-badge">{pendingRegistrationsCount}</span>
                        )}
                    </button>
                    <button className={`nav-btn ${activeSection === 'materials' ? 'active' : ''}`} onClick={() => setActiveSection('materials')}>
                        <i className="fa-solid fa-book-open"></i>
                        {!sidebarCollapsed && <span>Materials</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'leave' ? 'active' : ''}`} onClick={() => setActiveSection('leave')}>
                        <i className="fa-solid fa-calendar-plus"></i>
                        {!sidebarCollapsed && <span>Leave</span>}
                    </button>
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="nav-btn logout-btn" onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i>
                    {!sidebarCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );

    const renderContent = () => {
        if (loading) {
            return <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading faculty panel...</div>;
        }

        if (errorMessage && !classData) {
            return (
                <div className="empty-state">
                    <i className="fa-solid fa-triangle-exclamation faculty-empty-icon"></i>
                    <h3>Could Not Load Data</h3>
                    <p>{errorMessage}</p>
                </div>
            );
        }

        if (!classData) {
            return (
                <div className="empty-state">
                    <i className="fa-solid fa-chalkboard faculty-empty-icon"></i>
                    <h3>No Class Assigned</h3>
                    <p>You have not been assigned to a class yet. Please contact your HOD.</p>
                </div>
            );
        }

        if (activeSection === 'dashboard') {
            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Faculty Overview</h2>
                        {renderClassSelector()}
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card primary">
                            <div className="stat-icon"><i className="fa-solid fa-chalkboard-user"></i></div>
                            <div className="stat-info">
                                <span className="stat-number">{assignedClasses.length}</span>
                                <span className="stat-label">Assigned Classes</span>
                            </div>
                        </div>
                        <div className="stat-card warning">
                            <div className="stat-icon"><i className="fa-solid fa-users"></i></div>
                            <div className="stat-info">
                                <span className="stat-number">{students.length}</span>
                                <span className="stat-label">Students In Class</span>
                            </div>
                        </div>
                        <div className="stat-card info">
                            <div className="stat-icon"><i className="fa-solid fa-graduation-cap"></i></div>
                            <div className="stat-info">
                                <span className="stat-number stat-number-compact">{formatProgramType(classData)}</span>
                                <span className="stat-label">Program Level</span>
                            </div>
                        </div>
                        <div className="stat-card purple">
                            <div className="stat-icon"><i className="fa-solid fa-calendar-days"></i></div>
                            <div className="stat-info">
                                <span className="stat-number stat-number-compact">{classData.semesterOrYear || 'N/A'}</span>
                                <span className="stat-label">{classData.academicYear || 'Academic Year N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div className="faculty-panel-grid">
                        <div className="faculty-panel">
                            <div className="faculty-panel-header">
                                <h3><i className="fa-solid fa-layer-group"></i> Class Snapshot</h3>
                            </div>
                            <div className="faculty-panel-body">
                                <div className="faculty-detail-row">
                                    <span>Class Name</span>
                                    <span>{classData.name || 'N/A'}</span>
                                </div>
                                <div className="faculty-detail-row">
                                    <span>Course</span>
                                    <span>{classData.course?.name || 'N/A'}</span>
                                </div>
                                <div className="faculty-detail-row">
                                    <span>Course Code</span>
                                    <span>{classData.course?.code ? String(classData.course.code).toUpperCase() : 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="faculty-panel">
                            <div className="faculty-panel-header">
                                <h3><i className="fa-solid fa-file-lines"></i> Materials Summary</h3>
                            </div>
                            <div className="faculty-panel-body">
                                <div className="faculty-detail-row">
                                    <span>Course Plan</span>
                                    <span>{getCoursePlanFiles(classData).length}</span>
                                </div>
                                <div className="faculty-detail-row">
                                    <span>Study Materials</span>
                                    <span>{Array.isArray(classData.studyMaterials) ? classData.studyMaterials.length : 0}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeSection === 'students') {
            const filteredStudents = students.filter(s =>
                `${s.firstName || ''} ${s.lastName || ''} ${s.email || ''}`.toLowerCase().includes(searchTerm.toLowerCase())
            );

            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Class Students</h2>
                        <div className="faculty-section-actions">
                            {renderClassSelector()}
                            <div className="search-box">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <input
                                    type="text"
                                    placeholder="Search students..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {loadingStudents ? (
                        <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading students...</div>
                    ) : filteredStudents.length === 0 ? (
                        <div className="empty-state">No students found for this class.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                        <th>Joined On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredStudents.map((student) => (
                                        <tr key={student._id}>
                                            <td className="user-name-cell">{student.firstName} {student.lastName}</td>
                                            <td className="user-email-cell">{student.email}</td>
                                            <td>
                                                <span className={`status-badge status-${student.status || 'pending'}`}>
                                                    {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Pending'}
                                                </span>
                                            </td>
                                            <td className="user-date-cell">
                                                {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        }

        if (activeSection === 'attendance') {
            const filteredStudents = students.filter((student) =>
                `${student.firstName || ''} ${student.lastName || ''} ${student.email || ''}`
                    .toLowerCase()
                    .includes(searchTerm.toLowerCase())
            );
            const currentPeriodSelections = attendanceSelections[selectedAttendancePeriod] || {};
            const selectedSheetStudent = students.find(student => String(student._id) === String(attendanceSheetStudentId));
            const sheetSummary = attendanceSheet?.summary || { total: 0, present: 0, absent: 0, late: 0 };
            const attendanceRecords = Array.isArray(attendanceSheet?.records) ? attendanceSheet.records : [];
            const dayWiseAttendance = buildAttendanceDaySummary(attendanceRecords);
            const attendancePercent = sheetSummary.total
                ? Math.round((sheetSummary.present / sheetSummary.total) * 100)
                : 0;

            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Daily Attendance</h2>
                        <div className="faculty-section-actions">
                            {renderClassSelector()}
                        </div>
                    </div>

                    <div className="attendance-mode-tabs">
                        <button
                            type="button"
                            className={`attendance-mode-btn ${attendanceMode === 'mark' ? 'active' : ''}`}
                            onClick={() => setAttendanceMode('mark')}
                        >
                            <i className="fa-solid fa-user-check"></i> Mark Attendance
                        </button>
                        <button
                            type="button"
                            className={`attendance-mode-btn ${attendanceMode === 'sheet' ? 'active' : ''}`}
                            onClick={() => setAttendanceMode('sheet')}
                        >
                            <i className="fa-solid fa-table-list"></i> Attendance Sheet
                        </button>
                    </div>

                    <div className="attendance-schedule-note">
                        <strong>Day Schedule:</strong> 9:00 AM - 4:00 PM | <strong>Lunch Break:</strong> 1:00 PM - 2:00 PM |
                        <strong> Note:</strong> After lunch, Period 1 is 2:00-3:00 and Period 2 is 3:00-4:00.
                    </div>

                    {errorMessage && <div className="faculty-inline-error">{errorMessage}</div>}

                    {attendanceMode === 'mark' ? (
                        <>
                            <div className="attendance-mark-controls">
                                <div className="attendance-date-wrap">
                                    <label htmlFor="attendance-date" className="attendance-date-label">Date</label>
                                    <input
                                        id="attendance-date"
                                        type="date"
                                        className="attendance-date-input"
                                        value={attendanceDate}
                                        onChange={(e) => setAttendanceDate(e.target.value)}
                                    />
                                </div>
                                <div className="search-box">
                                    <i className="fa-solid fa-magnifying-glass"></i>
                                    <input
                                        type="text"
                                        placeholder="Search students..."
                                        value={searchTerm}
                                        onChange={e => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className="attendance-period-tabs">
                                {ATTENDANCE_PERIODS.map((period) => (
                                    <button
                                        key={period.number}
                                        type="button"
                                        className={`attendance-period-btn ${selectedAttendancePeriod === period.number ? 'active' : ''}`}
                                        onClick={() => setSelectedAttendancePeriod(period.number)}
                                    >
                                        <span>{period.label}</span>
                                        <small>{period.time}</small>
                                    </button>
                                ))}
                            </div>

                            {loadingAttendance || loadingStudents ? (
                                <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading attendance...</div>
                            ) : filteredStudents.length === 0 ? (
                                <div className="empty-state">No students found in this class.</div>
                            ) : (
                                <div className="faculty-attendance-card">
                                    <div className="table-responsive">
                                        <table className="users-table">
                                            <thead>
                                                <tr>
                                                    <th>Name</th>
                                                    <th>Email</th>
                                                    <th>Mark</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {filteredStudents.map((student) => {
                                                    const selectedStatus = currentPeriodSelections[student._id] || 'present';
                                                    return (
                                                        <tr key={student._id}>
                                                            <td className="user-name-cell">{student.firstName} {student.lastName}</td>
                                                            <td className="user-email-cell">{student.email}</td>
                                                            <td>
                                                                <div className="attendance-mark-toggle">
                                                                    <button
                                                                        type="button"
                                                                        className={`attendance-mark-btn mark-present ${selectedStatus === 'present' ? 'active' : ''}`}
                                                                        onClick={() => handleAttendanceStatusChange(student._id, 'present')}
                                                                        title="Mark Present"
                                                                    >
                                                                        <i className="fa-solid fa-check"></i>
                                                                    </button>
                                                                    <button
                                                                        type="button"
                                                                        className={`attendance-mark-btn mark-absent ${selectedStatus === 'absent' ? 'active' : ''}`}
                                                                        onClick={() => handleAttendanceStatusChange(student._id, 'absent')}
                                                                        title="Mark Absent"
                                                                    >
                                                                        <i className="fa-solid fa-xmark"></i>
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                    <div className="attendance-actions">
                                        <button
                                            type="button"
                                            className="btn-create"
                                            onClick={handleSaveAttendance}
                                            disabled={savingAttendance}
                                        >
                                            <i className={`fa-solid ${savingAttendance ? 'fa-spinner fa-spin' : 'fa-floppy-disk'}`}></i>
                                            {savingAttendance ? 'Saving...' : `Save ${ATTENDANCE_PERIODS.find(p => p.number === selectedAttendancePeriod)?.label || 'Attendance'}`}
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="faculty-attendance-sheet">
                            <div className="attendance-range-tabs" role="tablist" aria-label="Attendance range">
                                <button
                                    type="button"
                                    className={`attendance-range-tab ${attendanceSheetRangeType === 'day' ? 'active' : ''}`}
                                    onClick={() => handleAttendanceSheetRangeTypeChange('day')}
                                >
                                    Specific Day
                                </button>
                                <button
                                    type="button"
                                    className={`attendance-range-tab ${attendanceSheetRangeType === 'monthly' ? 'active' : ''}`}
                                    onClick={() => handleAttendanceSheetRangeTypeChange('monthly')}
                                >
                                    Monthly
                                </button>
                                <button
                                    type="button"
                                    className={`attendance-range-tab ${attendanceSheetRangeType === 'semester' ? 'active' : ''}`}
                                    onClick={() => handleAttendanceSheetRangeTypeChange('semester')}
                                >
                                    Entire Semester
                                </button>
                            </div>

                            <div className="attendance-sheet-controls">
                                <div className="attendance-field">
                                    <label htmlFor="sheet-student-trigger">Student</label>
                                    <div
                                        className={`attendance-custom-select ${isSheetStudentDropdownOpen ? 'open' : ''}`}
                                        ref={sheetStudentDropdownRef}
                                    >
                                        <button
                                            id="sheet-student-trigger"
                                            type="button"
                                            className="attendance-custom-select-trigger"
                                            onClick={() => {
                                                setIsSheetStudentDropdownOpen((prev) => {
                                                    const nextOpen = !prev;
                                                    if (nextOpen && selectedClassId) {
                                                        fetchStudentsForClass(selectedClassId, { silent: true });
                                                    }
                                                    return nextOpen;
                                                });
                                            }}
                                            disabled={!students.length}
                                        >
                                            <span className={`attendance-custom-select-value ${!selectedSheetStudent ? 'placeholder' : ''}`}>
                                                {selectedSheetStudent
                                                    ? `${selectedSheetStudent.firstName} ${selectedSheetStudent.lastName}`
                                                    : 'Select student'}
                                            </span>
                                            <i className="fa-solid fa-chevron-down"></i>
                                        </button>
                                        {isSheetStudentDropdownOpen && students.length > 0 && (
                                            <ul className="attendance-custom-select-dropdown" role="listbox" aria-label="Student list">
                                                {students.map((student) => {
                                                    const isSelected = String(student._id) === String(attendanceSheetStudentId);
                                                    return (
                                                        <li
                                                            key={student._id}
                                                            className={`attendance-custom-select-option ${isSelected ? 'selected' : ''}`}
                                                            role="option"
                                                            aria-selected={isSelected}
                                                            onClick={() => {
                                                                setAttendanceSheetStudentId(String(student._id));
                                                                setIsSheetStudentDropdownOpen(false);
                                                            }}
                                                        >
                                                            {student.firstName} {student.lastName}
                                                        </li>
                                                    );
                                                })}
                                            </ul>
                                        )}
                                    </div>
                                </div>
                                {attendanceSheetRangeType === 'day' ? (
                                    <div className="attendance-field">
                                        <label htmlFor="sheet-day">Day</label>
                                        <input
                                            id="sheet-day"
                                            type="date"
                                            value={attendanceSheetDay}
                                            onChange={(e) => handleAttendanceSheetDayChange(e.target.value)}
                                        />
                                    </div>
                                ) : (
                                    <>
                                        <div className="attendance-field">
                                            <label htmlFor="sheet-from">From</label>
                                            <input
                                                id="sheet-from"
                                                type="date"
                                                value={attendanceSheetFromDate}
                                                onChange={(e) => setAttendanceSheetFromDate(e.target.value)}
                                            />
                                        </div>
                                        <div className="attendance-field">
                                            <label htmlFor="sheet-to">To</label>
                                            <input
                                                id="sheet-to"
                                                type="date"
                                                value={attendanceSheetToDate}
                                                onChange={(e) => setAttendanceSheetToDate(e.target.value)}
                                            />
                                        </div>
                                    </>
                                )}
                                <button
                                    type="button"
                                    className="btn-create"
                                    onClick={handleLoadAttendanceSheet}
                                    disabled={loadingAttendanceSheet || !attendanceSheetStudentId}
                                >
                                    <i className={`fa-solid ${loadingAttendanceSheet ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'}`}></i>
                                    {loadingAttendanceSheet ? 'Loading...' : 'Load Sheet'}
                                </button>
                            </div>

                            <div className="attendance-active-range">
                                Showing records from <strong>{attendanceSheetFromDate || 'N/A'}</strong> to{' '}
                                <strong>{attendanceSheetToDate || 'N/A'}</strong>
                            </div>

                            {loadingAttendanceSheet ? (
                                <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading attendance sheet...</div>
                            ) : (
                                <>
                                    <div className="attendance-summary-grid">
                                        <div className="attendance-summary-card">
                                            <span>Total Periods</span>
                                            <strong>{sheetSummary.total}</strong>
                                        </div>
                                        <div className="attendance-summary-card present">
                                            <span>Present</span>
                                            <strong>{sheetSummary.present}</strong>
                                        </div>
                                        <div className="attendance-summary-card absent">
                                            <span>Absent</span>
                                            <strong>{sheetSummary.absent}</strong>
                                        </div>
                                        <div className="attendance-summary-card rate">
                                            <span>Attendance %</span>
                                            <strong>{attendancePercent}%</strong>
                                        </div>
                                    </div>

                                    <div className="attendance-sheet-title">
                                        {selectedSheetStudent
                                            ? `${selectedSheetStudent.firstName} ${selectedSheetStudent.lastName} - Attendance Sheet`
                                            : 'Attendance Sheet'}
                                    </div>

                                    {dayWiseAttendance.length > 0 && (
                                        <div className="attendance-daywise-block">
                                            <h4 className="attendance-daywise-title">Day-wise Period Summary</h4>
                                            <div className="table-responsive">
                                                <table className="users-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Date</th>
                                                            <th>Period Timeline (P1-P4)</th>
                                                            <th>Present Hours</th>
                                                            <th>Absent Hours</th>
                                                            <th>Late Hours</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {dayWiseAttendance.map((day) => (
                                                            <tr key={day.dateKey}>
                                                                <td>{day.dateKey}</td>
                                                                <td>
                                                                    <div className="attendance-period-timeline">
                                                                        {day.periodTimeline.map((slot) => (
                                                                            <span
                                                                                key={`timeline-${day.dateKey}-${slot.period}`}
                                                                                className={`attendance-period-pill ${slot.status}`}
                                                                            >
                                                                                P{slot.period}:{' '}
                                                                                {slot.status === 'present'
                                                                                    ? 'Present'
                                                                                    : slot.status === 'absent'
                                                                                        ? 'Absent'
                                                                                        : slot.status === 'late'
                                                                                            ? 'Late'
                                                                                            : 'Not Marked'}
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="attendance-hours-list">
                                                                        {day.presentPeriods.length > 0 ? day.presentPeriods.map((period) => (
                                                                            <span
                                                                                key={`present-${day.dateKey}-${period.period}`}
                                                                                className="attendance-hour-pill present"
                                                                            >
                                                                                {period.label}
                                                                            </span>
                                                                        )) : <span className="attendance-hours-empty">None</span>}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="attendance-hours-list">
                                                                        {day.absentPeriods.length > 0 ? day.absentPeriods.map((period) => (
                                                                            <span
                                                                                key={`absent-${day.dateKey}-${period.period}`}
                                                                                className="attendance-hour-pill absent"
                                                                            >
                                                                                {period.label}
                                                                            </span>
                                                                        )) : <span className="attendance-hours-empty">None</span>}
                                                                    </div>
                                                                </td>
                                                                <td>
                                                                    <div className="attendance-hours-list">
                                                                        {day.latePeriods.length > 0 ? day.latePeriods.map((period) => (
                                                                            <span
                                                                                key={`late-${day.dateKey}-${period.period}`}
                                                                                className="attendance-hour-pill late"
                                                                            >
                                                                                {period.label}
                                                                            </span>
                                                                        )) : <span className="attendance-hours-empty">None</span>}
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {attendanceRecords.length > 0 ? (
                                        <div className="table-responsive">
                                            <table className="users-table">
                                                <thead>
                                                    <tr>
                                                        <th>Date</th>
                                                        <th>Period</th>
                                                        <th>Time Slot</th>
                                                        <th>Status</th>
                                                        <th>Last Updated</th>
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {attendanceRecords.map((record, index) => {
                                                        const periodMeta = ATTENDANCE_PERIODS.find(period => period.number === Number(record.period));
                                                        return (
                                                            <tr key={`${record.dateKey}-${record.period}-${index}`}>
                                                                <td>{record.dateKey}</td>
                                                                <td>{periodMeta?.label || `Period ${record.period}`}</td>
                                                                <td>{periodMeta?.time || 'N/A'}</td>
                                                                <td>
                                                                    <span className={`attendance-record-badge ${record.status}`}>
                                                                        {record.status === 'present' ? 'Present' : record.status === 'absent' ? 'Absent' : 'Late'}
                                                                    </span>
                                                                </td>
                                                                <td>{record.updatedAt ? new Date(record.updatedAt).toLocaleString() : 'N/A'}</td>
                                                            </tr>
                                                        );
                                                    })}
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="empty-state">No attendance records found for the selected filters.</div>
                                    )}
                                </>
                            )}
                        </div>
                    )}
                </div>
            );
        }

        if (activeSection === 'registrations') {
            const normalizedSearch = registrationSearchTerm.trim().toLowerCase();
            const filteredRegistrations = registrationStudents.filter((student) => {
                const statusMatch = registrationStatusFilter === 'all' || student.status === registrationStatusFilter;
                if (!statusMatch) return false;

                if (!normalizedSearch) return true;
                const text = `${student.firstName || ''} ${student.lastName || ''} ${student.email || ''} ${student.course || ''} ${student.year || ''}`.toLowerCase();
                return text.includes(normalizedSearch);
            });

            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Registration Requests</h2>
                        <div className="faculty-section-actions">
                            <div className="search-box">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <input
                                    type="text"
                                    placeholder="Search by name, email, course..."
                                    value={registrationSearchTerm}
                                    onChange={e => setRegistrationSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="faculty-status-filters">
                        {['pending', 'approved', 'rejected', 'all'].map((status) => (
                            <button
                                key={status}
                                type="button"
                                className={`faculty-status-filter-btn ${registrationStatusFilter === status ? 'active' : ''}`}
                                onClick={() => setRegistrationStatusFilter(status)}
                            >
                                {status.charAt(0).toUpperCase() + status.slice(1)}
                            </button>
                        ))}
                    </div>

                    {errorMessage && <div className="faculty-inline-error">{errorMessage}</div>}

                    {loadingRegistrations ? (
                        <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading registration requests...</div>
                    ) : filteredRegistrations.length === 0 ? (
                        <div className="empty-state">No registration requests match this filter.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Course</th>
                                        <th>Year</th>
                                        <th>Status</th>
                                        <th>Applied On</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredRegistrations.map((student) => {
                                        const approveActionKey = `${student._id}:approve`;
                                        const rejectActionKey = `${student._id}:reject`;
                                        const approving = registrationActionKey === approveActionKey;
                                        const rejecting = registrationActionKey === rejectActionKey;
                                        const actionInProgress = approving || rejecting;

                                        return (
                                            <tr key={student._id}>
                                                <td className="user-name-cell">{student.firstName} {student.lastName}</td>
                                                <td className="user-email-cell">{student.email}</td>
                                                <td>{student.course || 'N/A'}</td>
                                                <td>{student.year ? `${student.year}${student.year === '1' ? 'st' : student.year === '2' ? 'nd' : student.year === '3' ? 'rd' : 'th'} Year` : 'N/A'}</td>
                                                <td>
                                                    <span className={`status-badge status-${student.status || 'pending'}`}>
                                                        {student.status ? student.status.charAt(0).toUpperCase() + student.status.slice(1) : 'Pending'}
                                                    </span>
                                                </td>
                                                <td className="user-date-cell">
                                                    {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : 'N/A'}
                                                </td>
                                                <td>
                                                    <div className="faculty-registration-actions">
                                                        <button
                                                            type="button"
                                                            className="btn-small faculty-btn-accept"
                                                            disabled={Boolean(registrationActionKey) || student.status === 'approved'}
                                                            onClick={() => handleRegistrationStatusChange(student._id, 'approved')}
                                                        >
                                                            {approving ? 'Accepting...' : 'Accept'}
                                                        </button>
                                                        <button
                                                            type="button"
                                                            className="btn-small faculty-btn-reject"
                                                            disabled={Boolean(registrationActionKey) || student.status === 'rejected'}
                                                            onClick={() => handleRegistrationStatusChange(student._id, 'rejected')}
                                                        >
                                                            {rejecting ? 'Rejecting...' : 'Reject'}
                                                        </button>
                                                    </div>
                                                    {actionInProgress && (
                                                        <div className="faculty-action-progress">Updating...</div>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        }

        if (activeSection === 'materials') {
            const coursePlanFiles = getCoursePlanFiles(classData);
            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Study Materials</h2>
                        <div className="faculty-section-actions">
                            {renderClassSelector()}
                            {renderUploadActions('plan')}
                            {renderUploadActions('material')}
                        </div>
                    </div>

                    {errorMessage && <div className="faculty-inline-error">{errorMessage}</div>}

                    <div className="faculty-material-panels">
                        <div className="faculty-panel">
                            <div className="faculty-panel-header">
                                <h3><i className="fa-solid fa-file-pdf"></i> Course Plan</h3>
                            </div>
                            <div className="faculty-panel-body">
                                {coursePlanFiles.length > 0 ? (
                                    <div className="materials-grid">
                                        {coursePlanFiles.map(plan => (
                                            <div key={plan._id || plan.url} className="material-card">
                                                <div className="material-icon">
                                                    <i className="fa-solid fa-file-pdf"></i>
                                                </div>
                                                <div className="material-details">
                                                    <h4>{plan.title || 'Course Plan'}</h4>
                                                    <p>
                                                        Uploaded:{' '}
                                                        {plan.uploadDate ? new Date(plan.uploadDate).toLocaleDateString() : 'N/A'}
                                                    </p>
                                                </div>
                                                <a href={`http://localhost:5000${plan.url}`} target="_blank" rel="noopener noreferrer" className="btn-small">
                                                    View
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted">No course plan uploaded yet.</p>
                                )}
                            </div>
                        </div>

                        <div className="faculty-panel">
                            <div className="faculty-panel-header">
                                <h3><i className="fa-solid fa-folder-open"></i> Study Materials</h3>
                            </div>
                            <div className="faculty-panel-body">
                                {(!classData.studyMaterials || classData.studyMaterials.length === 0) ? (
                                    <div className="empty-state compact-empty-state">No study materials uploaded for this class.</div>
                                ) : (
                                    <div className="materials-grid">
                                        {classData.studyMaterials.map(mat => (
                                            <div key={mat._id} className="material-card">
                                                <div className="material-icon">
                                                    <i className="fa-regular fa-file-lines"></i>
                                                </div>
                                                <div className="material-details">
                                                    <h4>{mat.title}</h4>
                                                    <p>Uploaded: {new Date(mat.uploadDate).toLocaleDateString()}</p>
                                                </div>
                                                <a href={`http://localhost:5000${mat.url}`} target="_blank" rel="noopener noreferrer" className="btn-small">
                                                    Download
                                                </a>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        if (activeSection === 'leave') {
            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Leave Management</h2>
                        <div className="faculty-section-actions">
                            {renderClassSelector()}
                        </div>
                    </div>
                    <LeavePanel
                        role="faculty"
                        canApply
                        showInbox
                        inboxTitle="Student Leave Requests"
                        initialName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                    />
                </div>
            );
        }

        return <div className="hod-section"><h2 className="section-heading">Coming Soon</h2></div>;
    };

    if (!user || user.role !== 'faculty') return null;

    return (
        <div className="hod-layout">
            {renderSidebar()}
            <main className="hod-main">
                <header className="hod-topbar">
                    <div className="topbar-left">
                        <div className="dept-badge faculty-dept-badge">
                            <i className="fa-solid fa-chalkboard-user"></i>
                            {classData ? `${classData.course?.name || classData.name} - ${classData.semesterOrYear}` : 'Faculty Panel'}
                        </div>
                    </div>
                    <div className="topbar-right">
                        <div className="admin-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="admin-avatar" style={{ background: '#3b82f6', color: '#fff' }}>
                                {user.firstName?.[0] || 'F'}
                            </div>
                            <div className="admin-info" style={{ display: 'flex', alignItems: 'center', flexDirection: 'row' }}>
                                <span className="admin-name">{user.firstName}</span>
                                <i className={`fa-solid fa-chevron-${showProfileMenu ? 'up' : 'down'}`}></i>
                            </div>
                            {showProfileMenu && (
                                <div className="profile-dropdown" onClick={(e) => e.stopPropagation()}>
                                    <div className="profile-dropdown-header">
                                        <span className="profile-dropdown-name">{user.firstName} {user.lastName}</span>
                                        <span className="profile-dropdown-email">{user.email}</span>
                                    </div>
                                    <div className="profile-dropdown-body">
                                        <button className="profile-dropdown-item" onClick={handleLogout}>
                                            <i className="fa-solid fa-arrow-right-from-bracket"></i> Logout
                                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </header>
                <div className="admin-content">
                    {renderContent()}
                </div>
            </main>
        </div>
    );
};

export default FacultyDashboard;
