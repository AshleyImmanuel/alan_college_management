import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import './HodDashboard.css';
import './FacultyDashboard.css';
import './StudentDashboard.css';
import { authFetch, getCurrentUser, logoutUser, notifyAuthChanged } from '../components/authClient';
import LeavePanel from '../components/LeavePanel';

const ATTENDANCE_PERIODS = [
    { number: 1, label: 'Period 1', time: '9:00 AM - 10:00 AM' },
    { number: 2, label: 'Period 2', time: '10:00 AM - 11:00 AM' },
    { number: 3, label: 'After Lunch - Period 1', time: '2:00 PM - 3:00 PM' },
    { number: 4, label: 'After Lunch - Period 2', time: '3:00 PM - 4:00 PM' }
];

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

const StudentDashboard = () => {
    const navigate = useNavigate();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [activeSection, setActiveSection] = useState('dashboard');
    const [enrolledClasses, setEnrolledClasses] = useState([]);
    const [selectedClassId, setSelectedClassId] = useState('');
    const [classData, setClassData] = useState(null);
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingStudents, setLoadingStudents] = useState(false);
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    const [attendanceRangeType, setAttendanceRangeType] = useState('monthly');
    const [attendanceDay, setAttendanceDay] = useState(getTodayDateKey());
    const [attendanceFromDate, setAttendanceFromDate] = useState(() => getMonthRange().from);
    const [attendanceToDate, setAttendanceToDate] = useState(() => getMonthRange().to);
    const [attendanceReport, setAttendanceReport] = useState(null);
    const [loadingAttendance, setLoadingAttendance] = useState(false);
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

    const fetchEnrolledClasses = useCallback(async () => {
        try {
            setLoading(true);
            setErrorMessage('');

            const classesRes = await authFetch('/api/student/classes');
            if (!classesRes.ok) throw new Error('Failed to fetch classes');

            const classesData = await classesRes.json();
            if (!Array.isArray(classesData) || classesData.length === 0) {
                setEnrolledClasses([]);
                setSelectedClassId('');
                setClassData(null);
                setStudents([]);
                setAttendanceReport(null);
                return;
            }

            setEnrolledClasses(classesData);
            setSelectedClassId((prevSelectedClassId) => {
                if (prevSelectedClassId && classesData.some(cls => String(cls._id) === String(prevSelectedClassId))) {
                    return prevSelectedClassId;
                }
                return String(classesData[0]._id);
            });
        } catch (error) {
            console.error('Failed to fetch classes:', error);
            setErrorMessage('Failed to load student data. Please refresh.');
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchStudentsForClass = useCallback(async (classId) => {
        if (!classId) {
            setStudents([]);
            return;
        }

        try {
            setLoadingStudents(true);
            const studentsRes = await authFetch(`/api/student/classes/${classId}/students`);
            if (!studentsRes.ok) throw new Error('Failed to fetch students');

            const studentsData = await studentsRes.json();
            setStudents(Array.isArray(studentsData) ? studentsData : []);
        } catch (error) {
            console.error('Failed to fetch students:', error);
            setStudents([]);
            setErrorMessage('Unable to load classmates for the selected class.');
        } finally {
            setLoadingStudents(false);
        }
    }, []);

    const fetchAttendanceReport = useCallback(async (classId, rangeType, day, fromDate, toDate) => {
        if (!classId) {
            setAttendanceReport(null);
            return;
        }

        try {
            setLoadingAttendance(true);

            const params = new URLSearchParams();
            if (rangeType === 'day') {
                if (day) params.set('day', day);
            } else {
                if (fromDate) params.set('from', fromDate);
                if (toDate) params.set('to', toDate);
            }

            const queryString = params.toString();
            const endpoint = queryString
                ? `/api/student/classes/${classId}/attendance?${queryString}`
                : `/api/student/classes/${classId}/attendance`;
            const res = await authFetch(endpoint);

            if (!res.ok) {
                const data = await res.json().catch(() => ({}));
                throw new Error(data.message || 'Failed to fetch attendance report');
            }

            const data = await res.json();
            setAttendanceReport(data);
        } catch (error) {
            console.error('Failed to fetch attendance report:', error);
            setAttendanceReport(null);
            setErrorMessage(error.message || 'Unable to load attendance report.');
        } finally {
            setLoadingAttendance(false);
        }
    }, []);

    const applyAttendanceRange = useCallback((rangeType, options = {}) => {
        if (rangeType === 'day') {
            const day = options.day || attendanceDay || getTodayDateKey();
            setAttendanceDay(day);
            setAttendanceFromDate(day);
            setAttendanceToDate(day);
            return;
        }

        if (rangeType === 'semester') {
            const { from, to } = getSemesterRange(classData);
            setAttendanceFromDate(from);
            setAttendanceToDate(to);
            return;
        }

        const { from, to } = getMonthRange(options.anchorDate || getTodayDateKey());
        setAttendanceFromDate(from);
        setAttendanceToDate(to);
    }, [attendanceDay, classData]);

    const handleAttendanceRangeTypeChange = (nextType) => {
        setAttendanceRangeType(nextType);
        applyAttendanceRange(nextType);
    };

    const handleAttendanceDayChange = (nextDay) => {
        setAttendanceDay(nextDay);
        if (attendanceRangeType === 'day') {
            applyAttendanceRange('day', { day: nextDay });
        }
    };

    const handleLoadAttendance = async () => {
        if (!selectedClassId) return;
        await fetchAttendanceReport(
            selectedClassId,
            attendanceRangeType,
            attendanceDay,
            attendanceFromDate,
            attendanceToDate
        );
    };

    useEffect(() => {
        let mounted = true;
        const hydrateAuth = async () => {
            const currentUser = await getCurrentUser();
            if (!mounted) return;

            if (!currentUser || currentUser.role !== 'student') {
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
        if (user?.role !== 'student') return;
        fetchEnrolledClasses();
    }, [authLoading, user?.role, fetchEnrolledClasses]);

    useEffect(() => {
        if (!selectedClassId) {
            setClassData(null);
            setStudents([]);
            setAttendanceReport(null);
            return;
        }

        const selectedClass = enrolledClasses.find(cls => String(cls._id) === String(selectedClassId)) || null;
        setClassData(selectedClass);
        setSearchTerm('');
        fetchStudentsForClass(selectedClassId);
    }, [selectedClassId, enrolledClasses, fetchStudentsForClass]);

    useEffect(() => {
        if (activeSection !== 'attendance') return;
        applyAttendanceRange(attendanceRangeType);
    }, [
        activeSection,
        attendanceRangeType,
        selectedClassId,
        classData?.academicYear,
        applyAttendanceRange
    ]);

    useEffect(() => {
        if (activeSection !== 'attendance') return;
        if (!selectedClassId) return;

        fetchAttendanceReport(
            selectedClassId,
            attendanceRangeType,
            attendanceDay,
            attendanceFromDate,
            attendanceToDate
        );
    }, [
        activeSection,
        selectedClassId,
        attendanceRangeType,
        attendanceDay,
        attendanceFromDate,
        attendanceToDate,
        fetchAttendanceReport
    ]);

    const handleLogout = async () => {
        await logoutUser();
        notifyAuthChanged();
        navigate('/login');
    };

    const renderClassSelector = () => {
        if (!enrolledClasses.length) return null;

        const getClassLabel = (cls) => `${cls.course?.name || cls.name || 'Class'} - ${cls.academicYear} - ${cls.semesterOrYear}`;

        return (
            <div className="faculty-class-picker">
                <span className="faculty-class-label">Class</span>
                {enrolledClasses.length === 1 ? (
                    <div className="faculty-class-single">{getClassLabel(enrolledClasses[0])}</div>
                ) : (
                    <div className="faculty-class-chips" role="tablist" aria-label="Class Selection">
                        {enrolledClasses.map((cls) => (
                            <button
                                key={cls._id}
                                type="button"
                                role="tab"
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

    const renderSidebar = () => (
        <aside className={`hod-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <i className="fa-solid fa-graduation-cap logo-icon"></i>
                {!sidebarCollapsed && <span className="logo-text">Parker Student</span>}
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
                        {!sidebarCollapsed && <span>Classmates</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'attendance' ? 'active' : ''}`} onClick={() => setActiveSection('attendance')}>
                        <i className="fa-solid fa-clipboard-check"></i>
                        {!sidebarCollapsed && <span>Attendance</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'leave' ? 'active' : ''}`} onClick={() => setActiveSection('leave')}>
                        <i className="fa-solid fa-calendar-plus"></i>
                        {!sidebarCollapsed && <span>Leave</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'materials' ? 'active' : ''}`} onClick={() => setActiveSection('materials')}>
                        <i className="fa-solid fa-book-open"></i>
                        {!sidebarCollapsed && <span>Materials</span>}
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
            return <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading student panel...</div>;
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
                    <h3>No Class Enrolled</h3>
                    <p>You are not enrolled in a class yet. Please contact your HOD.</p>
                </div>
            );
        }

        if (activeSection === 'dashboard') {
            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Student Overview</h2>
                        <div className="faculty-section-actions">
                            {renderClassSelector()}
                            <button type="button" className="btn-create" onClick={() => setActiveSection('leave')}>
                                <i className="fa-solid fa-calendar-plus"></i> Apply Leave
                            </button>
                        </div>
                    </div>

                    <div className="stats-grid">
                        <div className="stat-card primary">
                            <div className="stat-icon"><i className="fa-solid fa-chalkboard-user"></i></div>
                            <div className="stat-info">
                                <span className="stat-number">{enrolledClasses.length}</span>
                                <span className="stat-label">Enrolled Classes</span>
                            </div>
                        </div>
                        <div className="stat-card warning">
                            <div className="stat-icon"><i className="fa-solid fa-users"></i></div>
                            <div className="stat-info">
                                <span className="stat-number">{students.length}</span>
                                <span className="stat-label">Classmates</span>
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

                    {errorMessage && <div className="student-inline-error">{errorMessage}</div>}
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
                        <h2 className="section-heading">Classmates</h2>
                        <div className="faculty-section-actions">
                            {renderClassSelector()}
                            <div className="search-box">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <input
                                    type="text"
                                    placeholder="Search classmates..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    {loadingStudents ? (
                        <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading classmates...</div>
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
            const summary = attendanceReport?.summary || { total: 0, present: 0, absent: 0, late: 0 };
            const attendanceRecords = Array.isArray(attendanceReport?.records) ? attendanceReport.records : [];
            const dayWiseAttendance = buildAttendanceDaySummary(attendanceRecords);
            const attendancePercent = summary.total
                ? Math.round((summary.present / summary.total) * 100)
                : 0;

            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Daily Attendance</h2>
                        <div className="faculty-section-actions">
                            {renderClassSelector()}
                        </div>
                    </div>

                    <div className="attendance-schedule-note">
                        <strong>Day Schedule:</strong> 9:00 AM - 4:00 PM | <strong>Lunch Break:</strong> 1:00 PM - 2:00 PM |
                        <strong> Note:</strong> After lunch, Period 1 is 2:00-3:00 and Period 2 is 3:00-4:00.
                    </div>

                    {errorMessage && <div className="student-inline-error">{errorMessage}</div>}

                    <div className="faculty-attendance-sheet">
                        <div className="attendance-range-tabs" role="tablist" aria-label="Attendance range">
                            <button
                                type="button"
                                className={`attendance-range-tab ${attendanceRangeType === 'day' ? 'active' : ''}`}
                                onClick={() => handleAttendanceRangeTypeChange('day')}
                            >
                                Specific Day
                            </button>
                            <button
                                type="button"
                                className={`attendance-range-tab ${attendanceRangeType === 'monthly' ? 'active' : ''}`}
                                onClick={() => handleAttendanceRangeTypeChange('monthly')}
                            >
                                Monthly
                            </button>
                            <button
                                type="button"
                                className={`attendance-range-tab ${attendanceRangeType === 'semester' ? 'active' : ''}`}
                                onClick={() => handleAttendanceRangeTypeChange('semester')}
                            >
                                Entire Semester
                            </button>
                        </div>

                        <div className="attendance-sheet-controls">
                            {attendanceRangeType === 'day' ? (
                                <div className="attendance-field">
                                    <label htmlFor="student-attendance-day">Day</label>
                                    <input
                                        id="student-attendance-day"
                                        type="date"
                                        value={attendanceDay}
                                        onChange={(e) => handleAttendanceDayChange(e.target.value)}
                                    />
                                </div>
                            ) : (
                                <>
                                    <div className="attendance-field">
                                        <label htmlFor="student-attendance-from">From</label>
                                        <input
                                            id="student-attendance-from"
                                            type="date"
                                            value={attendanceFromDate}
                                            onChange={(e) => setAttendanceFromDate(e.target.value)}
                                        />
                                    </div>
                                    <div className="attendance-field">
                                        <label htmlFor="student-attendance-to">To</label>
                                        <input
                                            id="student-attendance-to"
                                            type="date"
                                            value={attendanceToDate}
                                            onChange={(e) => setAttendanceToDate(e.target.value)}
                                        />
                                    </div>
                                </>
                            )}

                            <button
                                type="button"
                                className="btn-create"
                                onClick={handleLoadAttendance}
                                disabled={loadingAttendance}
                            >
                                <i className={`fa-solid ${loadingAttendance ? 'fa-spinner fa-spin' : 'fa-arrows-rotate'}`}></i>
                                {loadingAttendance ? 'Loading...' : 'Load Sheet'}
                            </button>
                        </div>

                        <div className="attendance-active-range">
                            Showing records from <strong>{attendanceFromDate || 'N/A'}</strong> to{' '}
                            <strong>{attendanceToDate || 'N/A'}</strong>
                        </div>

                        {loadingAttendance ? (
                            <div className="loading-spinner"><i className="fa-solid fa-circle-notch fa-spin"></i> Loading attendance...</div>
                        ) : (
                            <>
                                <div className="attendance-summary-grid">
                                    <div className="attendance-summary-card">
                                        <span>Total Periods</span>
                                        <strong>{summary.total}</strong>
                                    </div>
                                    <div className="attendance-summary-card present">
                                        <span>Present</span>
                                        <strong>{summary.present}</strong>
                                    </div>
                                    <div className="attendance-summary-card absent">
                                        <span>Absent</span>
                                        <strong>{summary.absent}</strong>
                                    </div>
                                    <div className="attendance-summary-card rate">
                                        <span>Attendance %</span>
                                        <strong>{attendancePercent}%</strong>
                                    </div>
                                </div>

                                <div className="attendance-sheet-title">My Attendance Sheet</div>

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
                                                                            key={`${day.dateKey}-${slot.period}`}
                                                                            className={`attendance-period-pill ${slot.status}`}
                                                                            title={`${slot.label} (${slot.time})`}
                                                                        >
                                                                            P{slot.period}
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
                        role="student"
                        canApply
                        showInbox={false}
                        initialName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                    />
                </div>
            );
        }

        if (activeSection === 'materials') {
            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Course Plan & Study Materials</h2>
                        <div className="faculty-section-actions">
                            {renderClassSelector()}
                        </div>
                    </div>

                    {errorMessage && <div className="student-inline-error">{errorMessage}</div>}

                    <div className="faculty-material-panels student-materials-panels">
                        <div className="faculty-panel">
                            <div className="faculty-panel-header">
                                <h3><i className="fa-solid fa-file-pdf"></i> Course Plan</h3>
                            </div>
                            <div className="faculty-panel-body">
                                {classData.coursePlan?.fileUrl ? (
                                    <div className="material-item">
                                        <div className="material-info">
                                            <i className="fa-solid fa-file-pdf"></i>
                                            <span>{classData.coursePlan.originalName || 'Course Plan'}</span>
                                        </div>
                                        <a href={`http://localhost:5000${classData.coursePlan.fileUrl}`} target="_blank" rel="noopener noreferrer" className="btn-small">
                                            View
                                        </a>
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

        return <div className="hod-section"><h2 className="section-heading">Coming Soon</h2></div>;
    };

    if (!user || user.role !== 'student') return null;

    return (
        <div className="hod-layout">
            {renderSidebar()}
            <main className="hod-main">
                <header className="hod-topbar">
                    <div className="topbar-left">
                        <div className="dept-badge faculty-dept-badge">
                            <i className="fa-solid fa-user-graduate"></i>
                            {classData ? `${classData.course?.name || classData.name} - ${classData.semesterOrYear}` : 'Student Panel'}
                        </div>
                    </div>
                    <div className="topbar-right">
                        <div className="admin-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="admin-avatar" style={{ background: '#16a34a', color: '#fff' }}>
                                {user.firstName?.[0] || 'S'}
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

export default StudentDashboard;
