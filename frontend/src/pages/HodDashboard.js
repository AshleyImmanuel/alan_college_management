import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import './HodDashboard.css';
import { authFetch, getCurrentUser, logoutUser, notifyAuthChanged } from '../components/authClient';
import LeavePanel from '../components/LeavePanel';

const HodDashboard = () => {
    const navigate = useNavigate();
    const getCurrentAcademicYear = () => {
        const now = new Date();
        const year = now.getFullYear();
        const academicStartYear = now.getMonth() >= 5 ? year : year - 1;
        return `${academicStartYear}-${academicStartYear + 1}`;
    };
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [stats, setStats] = useState({ totalStudents: 0, pendingStudents: 0, approvedStudents: 0, totalFaculty: 0, totalCourses: 0, totalClasses: 0 });
    const [students, setStudents] = useState([]);
    const [pendingStudents, setPendingStudents] = useState([]);
    const [faculties, setFaculties] = useState([]);
    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);

    const [searchTerm, setSearchTerm] = useState('');
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState({ title: '', message: '', type: 'success' });
    const [showModal, setShowModal] = useState(null);
    const [classForm, setClassForm] = useState({ name: '', courseId: '', academicYear: getCurrentAcademicYear(), semesterOrYear: '1st Year' });
    const [facultyForm, setFacultyForm] = useState({ firstName: '', lastName: '', email: '', password: '', classId: '' });
    const [facultyProgramType, setFacultyProgramType] = useState('');
    const [facultyCourseId, setFacultyCourseId] = useState('');
    const [showFacultyPassword, setShowFacultyPassword] = useState(false);
    const [classDrill, setClassDrill] = useState({ level: 'programs', program: null, course: null, year: null, activeTab: 'students' });
    const [classSearch, setClassSearch] = useState('');
    const [classYearFilter, setClassYearFilter] = useState('all');
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [uploadedPlan, setUploadedPlan] = useState(null);

    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const normalizeProgramType = (programType) => {
        const normalized = String(programType || '').trim().toLowerCase();
        return normalized;
    };

    const getClassProgramType = (cls) => normalizeProgramType(cls?.course?.programType || cls?.programType);

    const handleLogout = async () => {
        await logoutUser();
        notifyAuthChanged();
        navigate('/login');
    };

    const handleCreateFaculty = async (e) => {
        e.preventDefault();
        try {
            const res = await authFetch('/api/hod/faculty', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...facultyForm, department: user.department })
            });
            const data = await res.json();
            if (res.ok) {
                setToastMsg({ title: 'Success', message: 'Faculty member created successfully!', type: 'success' });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                setShowModal(null);
                setFacultyForm({ firstName: '', lastName: '', email: '', password: '', classId: '' });
                fetchFaculties();
            } else {
                setToastMsg({ title: 'Error', message: data.message || 'Error creating faculty', type: 'error' });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        } catch (error) {
            console.error('Create faculty error:', error);
            setToastMsg({ title: 'Error', message: 'Server connection error.', type: 'error' });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
        }
    };

    const handleFileUpload = async (event, type) => {
        const file = event.target.files[0];
        if (!file) return;

        // Simplified validation for demo
        if (file.size > 5 * 1024 * 1024) {
            setToastMsg({ title: 'Error', message: 'File size must be under 5MB', type: 'error' });
            setShowToast(true);
            setTimeout(() => setShowToast(false), 3000);
            return;
        }

        if (type === 'plan') {
            const formData = new FormData();
            formData.append('coursePlan', file);

            try {
                const response = await authFetch(`/api/hod/class/${classDrill.activeClassId}/course-plan`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    setToastMsg({ title: 'Success', message: 'Course plan uploaded successfully', type: 'success' });
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                    // Refresh data to show uploaded plan
                    fetchClasses();
                } else {
                    const data = await response.json();
                    setToastMsg({ title: 'Error', message: data.message || 'Failed to upload plan', type: 'error' });
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
            } catch (err) {
                console.error('Error uploading plan:', err);
            }
        } else if (type === 'material') {
            const formData = new FormData();
            formData.append('material', file);
            // Optionally append a title if you have a state for it, otherwise it uses original filename

            try {
                const response = await authFetch(`/api/hod/class/${classDrill.activeClassId}/study-materials`, {
                    method: 'POST',
                    body: formData
                });

                if (response.ok) {
                    setToastMsg({ title: 'Success', message: 'Study material uploaded successfully', type: 'success' });
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                    // Refresh data to show uploaded material
                    fetchClasses();
                } else {
                    const data = await response.json();
                    setToastMsg({ title: 'Error', message: data.message || 'Failed to upload material', type: 'error' });
                    setShowToast(true);
                    setTimeout(() => setShowToast(false), 3000);
                }
            } catch (err) {
                console.error('Error uploading material:', err);
            }
        }
    };

    const deleteMaterial = async (materialId) => {
        if (!window.confirm('Are you sure you want to delete this study material?')) return;

        try {
            const response = await authFetch(`/api/hod/class/${classDrill.activeClassId}/study-materials/${materialId}`, {
                method: 'DELETE'
            });

            if (response.ok) {
                setToastMsg({ title: 'Success', message: 'Study material deleted successfully', type: 'success' });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
                fetchClasses();
            } else {
                const data = await response.json();
                setToastMsg({ title: 'Error', message: data.message || 'Failed to delete material', type: 'error' });
                setShowToast(true);
                setTimeout(() => setShowToast(false), 3000);
            }
        } catch (err) {
            console.error('Error deleting material:', err);
        }
    };

    useEffect(() => {
        let mounted = true;
        const hydrateAuth = async () => {
            const currentUser = await getCurrentUser();
            if (!mounted) return;

            if (!currentUser) {
                setAuthLoading(false);
                navigate('/login');
                return;
            }

            if (currentUser.role !== 'hod' && currentUser.role !== 'admin') {
                setAuthLoading(false);
                navigate('/');
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

    // Toast helper
    const showToastMessage = (title, message, type = 'success') => {
        setToastMsg({ title, message, type });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 3000);
    };

    // Data Fetching
    const fetchStats = useCallback(async () => {
        try {
            const res = await authFetch('/api/hod/stats');
            if (res.ok) setStats(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const fetchPendingStudents = useCallback(async () => {
        try {
            const res = await authFetch('/api/hod/pending');
            if (res.ok) setPendingStudents(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const fetchStudents = useCallback(async () => {
        try {
            const res = await authFetch('/api/hod/students');
            if (res.ok) setStudents(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const fetchFaculties = useCallback(async () => {
        try {
            const res = await authFetch('/api/hod/faculty');
            if (res.ok) setFaculties(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const fetchClasses = useCallback(async () => {
        try {
            const res = await authFetch('/api/hod/classes');
            if (res.ok) setClasses(await res.json());
        } catch (err) { console.error(err); }
    }, []);

    const fetchDepartmentCourses = useCallback(async () => {
        if (!user?.department) {
            setCourses([]);
            return;
        }

        try {
            const res = await fetch(`/api/admin/public/courses?department=${user.department}`);
            if (res.ok) setCourses(await res.json());
        } catch (err) {
            console.error(err);
        }
    }, [user?.department]);

    // Initial load map
    useEffect(() => {
        if (!authLoading && user && (user.role === 'hod' || user.role === 'admin')) {
            fetchStats();
            if (activeSection === 'students') {
                fetchPendingStudents();
                fetchStudents();
            } else if (activeSection === 'classes') {
                fetchClasses();
                fetchFaculties();
                fetchDepartmentCourses();
            } else if (activeSection === 'faculty') {
                fetchFaculties();
                fetchClasses();
                fetchDepartmentCourses();
            }
        }
    }, [activeSection, authLoading, user, fetchStats, fetchPendingStudents, fetchStudents, fetchClasses, fetchFaculties, fetchDepartmentCourses]);


    // Action Handlers
    const handleApprove = async (id) => {
        try {
            const res = await authFetch(`/api/hod/approve/${id}`, { method: 'PUT' });
            if (res.ok) { showToastMessage('Approved', 'Student has been approved.'); fetchPendingStudents(); fetchStats(); fetchStudents(); }
        } catch (e) { console.error(e); }
    };

    const handleReject = async (id) => {
        try {
            const res = await authFetch(`/api/hod/reject/${id}`, { method: 'PUT' });
            if (res.ok) { showToastMessage('Rejected', 'Student rejected.', 'error'); fetchPendingStudents(); fetchStats(); }
        } catch (e) { console.error(e); }
    };

    const handleCreateClass = async (e) => {
        e.preventDefault();
        if (user.role !== 'admin') {
            showToastMessage('Access denied', 'Only admin can create classes.', 'error');
            return;
        }
        if (!classForm.courseId) {
            showToastMessage('Error', 'Please select a Course.', 'error');
            return;
        }
        try {
            const res = await authFetch('/api/hod/classes', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(classForm)
            });
            const data = await res.json();
            if (res.ok) {
                showToastMessage('Success', 'Class created.');
                setShowModal(null);
                setClassForm({ name: '', courseId: '', academicYear: getCurrentAcademicYear(), semesterOrYear: '1st Year' });
                fetchClasses(); fetchStats();
            } else { showToastMessage('Error', data.message, 'error'); }
        } catch (e) { showToastMessage('Error', 'Server Error', 'error'); }
    };


    // Rendering Functions
    const renderSidebar = () => (
        <aside className={`hod-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
            <div className="sidebar-header">
                <i className="fa-solid fa-graduation-cap logo-icon"></i>
                {!sidebarCollapsed && <span className="logo-text">Parker HOD</span>}
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
                        <i className="fa-solid fa-chart-pie"></i> {!sidebarCollapsed && <span>Overview</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'students' ? 'active' : ''}`} onClick={() => setActiveSection('students')}>
                        <i className="fa-solid fa-users"></i> {!sidebarCollapsed && <span>Students</span>}
                        {!sidebarCollapsed && pendingStudents.length > 0 && <span className="nav-badge">{pendingStudents.length}</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'faculty' ? 'active' : ''}`} onClick={() => setActiveSection('faculty')}>
                        <i className="fa-solid fa-chalkboard-user"></i> {!sidebarCollapsed && <span>Faculty</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'classes' ? 'active' : ''}`} onClick={() => setActiveSection('classes')}>
                        <i className="fa-solid fa-chalkboard"></i> {!sidebarCollapsed && <span>Classes & Batches</span>}
                    </button>
                    <button className={`nav-btn ${activeSection === 'leave' ? 'active' : ''}`} onClick={() => setActiveSection('leave')}>
                        <i className="fa-solid fa-calendar-plus"></i> {!sidebarCollapsed && <span>Leave</span>}
                    </button>
                </div>
            </nav>

            <div className="sidebar-footer">
                <button className="nav-btn logout-btn" onClick={handleLogout}>
                    <i className="fa-solid fa-right-from-bracket"></i> {!sidebarCollapsed && <span>Logout</span>}
                </button>
            </div>
        </aside>
    );

    const renderDashboard = () => (
        <div className="hod-section">
            <h2 className="section-heading">Department Overview</h2>
            <div className="stats-grid">
                <div className="stat-card primary">
                    <div className="stat-icon"><i className="fa-solid fa-users"></i></div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.totalStudents}</span>
                        <span className="stat-label">Total Students</span>
                    </div>
                </div>
                <div className="stat-card warning">
                    <div className="stat-icon"><i className="fa-solid fa-user-clock"></i></div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.pendingStudents}</span>
                        <span className="stat-label">Pending Approvals</span>
                    </div>
                </div>
                <div className="stat-card info">
                    <div className="stat-icon"><i className="fa-solid fa-chalkboard-user"></i></div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.totalFaculty}</span>
                        <span className="stat-label">Faculty Members</span>
                    </div>
                </div>
                <div className="stat-card purple">
                    <div className="stat-icon"><i className="fa-solid fa-chalkboard"></i></div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.totalClasses}</span>
                        <span className="stat-label">Active Classes</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderStudents = () => {
        const filteredPending = pendingStudents.filter(s => s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));
        const filteredApproved = students.filter(s => s.firstName.toLowerCase().includes(searchTerm.toLowerCase()) || s.email.toLowerCase().includes(searchTerm.toLowerCase()));

        return (
            <div className="hod-section">
                <div className="section-header-flex">
                    <h2 className="section-heading">Student Management</h2>
                    <div className="search-box">
                        <i className="fa-solid fa-magnifying-glass"></i>
                        <input type="text" placeholder="Search students..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                    </div>
                </div>

                {filteredPending.length > 0 && (
                    <div className="pending-approvals-section">
                        <h3 className="sub-heading">Needs Approval ({filteredPending.length})</h3>
                        <div className="pending-grid">
                            {filteredPending.map(s => (
                                <div key={s._id} className="pending-card">
                                    <div className="pending-card-header">
                                        <div className="user-avatar">{s.firstName.charAt(0)}</div>
                                        <div className="user-intro">
                                            <h4>{s.firstName} {s.lastName}</h4>
                                            <p>{s.email}</p>
                                        </div>
                                    </div>
                                    <div className="pending-details">
                                        <div className="detail-row"><span>Course</span><span>{s.course || '—'}</span></div>
                                        <div className="detail-row"><span>Year</span><span>Year {s.year || '—'}</span></div>
                                    </div>
                                    <div className="pending-card-actions">
                                        <button className="btn-card btn-card-approve" onClick={() => handleApprove(s._id)}><i className="fa-solid fa-check"></i> Approve</button>
                                        <button className="btn-card btn-card-reject" onClick={() => handleReject(s._id)}><i className="fa-solid fa-xmark"></i> Reject</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="approved-students-section">
                    <h3 className="sub-heading">Approved Students ({filteredApproved.length})</h3>
                    {filteredApproved.length === 0 ? (
                        <div className="empty-state">No approved students match your search.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Student Name</th>
                                        <th>Email</th>
                                        <th>Course</th>
                                        <th>Year</th>
                                        <th>Joined At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredApproved.map(u => (
                                        <tr key={u._id}>
                                            <td className="user-name-cell">{u.firstName} {u.lastName}</td>
                                            <td className="user-email-cell">{u.email}</td>
                                            <td>{u.course}</td>
                                            <td>Year {u.year}</td>
                                            <td className="user-date-cell">{new Date(u.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    const BreadcrumbBar = () => {
        const { level, program, course, year } = classDrill;
        return (
            <div className="hod-breadcrumbs">
                <span className="crumb" onClick={() => setClassDrill({ ...classDrill, level: 'programs', course: null, year: null })}>Programs</span>
                {level !== 'programs' && (
                    <>
                        <i className="fa-solid fa-chevron-right crumb-sep"></i>
                        <span className={`crumb ${level === 'courses' ? 'active' : ''}`} onClick={() => setClassDrill({ ...classDrill, level: 'courses', course: null, year: null })}>
                            {program === 'ug' ? 'Undergraduate' : 'Postgraduate'}
                        </span>
                    </>
                )}
                {(level === 'classes' || level === 'manage') && course && (
                    <>
                        <i className="fa-solid fa-chevron-right crumb-sep"></i>
                        <span className={`crumb ${level === 'classes' ? 'active' : ''}`} onClick={() => setClassDrill({ ...classDrill, level: 'classes', year: null })}>
                            {courses.find(c => c._id === course)?.name || 'Course'}
                        </span>
                    </>
                )}
                {level === 'manage' && year && (
                    <>
                        <i className="fa-solid fa-chevron-right" style={{ fontSize: '0.8rem', color: '#d1d5db' }}></i>
                        <span style={{ color: '#111827', fontWeight: '600', display: 'flex', alignItems: 'center' }}>Year {classDrill.year}</span>
                    </>
                )}
            </div>
        );
    };

    const renderClasses = () => {
        const { level, program, course } = classDrill;
        const ugCourses = courses.filter(c => c.programType === 'ug');
        const pgCourses = courses.filter(c => c.programType === 'pg');

        if (level === 'programs') {
            return (
                <div className="hod-section">
                    <BreadcrumbBar />
                    <div className="section-header-flex">
                        <h2 className="section-heading">Classes & Batches</h2>
                        {user.role === 'admin' && (
                            <button className="btn-create" onClick={() => setShowModal('class')}><i className="fa-solid fa-plus"></i> Create Class</button>
                        )}
                    </div>
                    <div className="program-cards">
                        <div className="program-card program-ug" onClick={() => setClassDrill({ ...classDrill, level: 'courses', program: 'ug' })}>
                            <div className="program-icon"><i className="fa-solid fa-graduation-cap"></i></div>
                            <h3>Undergraduate (UG)</h3>
                            <p>{ugCourses.length} Courses</p>
                        </div>
                        <div className="program-card program-pg" onClick={() => setClassDrill({ ...classDrill, level: 'courses', program: 'pg' })}>
                            <div className="program-icon"><i className="fa-solid fa-user-graduate"></i></div>
                            <h3>Postgraduate (PG)</h3>
                            <p>{pgCourses.length} Courses</p>
                        </div>
                    </div>
                </div>
            );
        }

        if (level === 'courses') {
            const filteredCourses = program === 'ug' ? ugCourses : pgCourses;
            return (
                <div className="hod-section">
                    <BreadcrumbBar />
                    <div className="section-header-flex">
                        <h2 className="section-heading">{program === 'ug' ? 'Undergraduate' : 'Postgraduate'} Courses</h2>
                        {user.role === 'admin' && (
                            <button className="btn-create" onClick={() => setShowModal('class')}><i className="fa-solid fa-plus"></i> Create Class</button>
                        )}
                    </div>
                    {filteredCourses.length === 0 ? (
                        <div className="empty-state">No courses in this program.</div>
                    ) : (
                        <div className="courses-grid" style={{ display: 'grid', gap: '16px', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', marginTop: '16px' }}>
                            {filteredCourses.map(c => {
                                const courseClasses = classes.filter(cls => cls.course && cls.course._id === c._id);
                                return (
                                    <div key={c._id} className="course-card" onClick={() => setClassDrill({ ...classDrill, level: 'classes', course: c._id })}>
                                        <div className="course-info">
                                            <h3>{c.name}</h3>
                                            <p>{c.code} · {courseClasses.length} Active Classes</p>
                                        </div>
                                        <i className="fa-solid fa-chevron-right course-arrow"></i>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            );
        }

        if (level === 'classes') {
            const courseClasses = classes.filter(cls => cls.course && cls.course._id === course);
            const courseObj = courses.find(c => c._id === course);
            const duration = courseObj?.duration || 3;
            const years = Array.from({ length: duration }, (_, i) => String(i + 1));

            // Combine both approved and pending students for the course
            let courseStudents = [...students, ...pendingStudents].filter(u => u.course === courseObj?.name);

            if (classSearch) {
                courseStudents = courseStudents.filter(u => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(classSearch.toLowerCase()));
            }

            return (
                <div className="hod-section">
                    <BreadcrumbBar />
                    <div className="section-header-flex">
                        <h2 className="section-heading">{courseObj?.name} Overview</h2>
                    </div>

                    <div className="users-toolbar" style={{ display: 'flex', justifyContent: 'space-between', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <div className="search-box">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input type="text" placeholder="Search students..." value={classSearch} onChange={e => setClassSearch(e.target.value)} />
                        </div>
                        <div className="filter-group" style={{ display: 'flex', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                            <button className={`filter-btn ${classYearFilter === 'all' ? 'active' : ''}`} onClick={() => setClassYearFilter('all')}>All Years</button>
                            {years.map(y => (
                                <button key={y} className={`filter-btn ${classYearFilter === y ? 'active' : ''}`} onClick={() => setClassYearFilter(y)}>Year {y}</button>
                            ))}
                        </div>
                    </div>

                    {classSearch && courseStudents.length === 0 ? (
                        <div className="empty-state">
                            No students match your search.
                        </div>
                    ) : (
                        classYearFilter === 'all' ? (
                            years.map(y => {
                                const yearStudents = courseStudents.filter(u => u.year === y);
                                const shortName = (courseObj?.name || 'Class').split(' ').pop();
                                const yearLabel = y === '1' ? '1st' : y === '2' ? '2nd' : y === '3' ? '3rd' : '4th';

                                return (
                                    <div key={y} className="year-group" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px', overflow: 'hidden' }}>
                                        <div className="year-heading" style={{ background: '#f9fafb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' }}>
                                                {shortName} {yearLabel} Year
                                                <span className="year-count" style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>{yearStudents.length} students</span>
                                            </h3>
                                            <button
                                                className="btn-dept-action btn-manage"
                                                style={{ padding: '6px 16px', fontSize: '0.85rem', width: 'auto', margin: 0 }}
                                                onClick={() => {
                                                    const cls = classes.filter(cls => cls.course && cls.course._id === courseObj._id).find(c => c.semesterOrYear === `${yearLabel} Year`);
                                                    setClassDrill({ ...classDrill, level: 'manage', year: y, activeTab: 'students', activeClassId: cls?._id });
                                                }}
                                            >
                                                Manage
                                            </button>
                                        </div>
                                        {yearStudents.length === 0 ? (
                                            <div className="year-empty" style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic', fontSize: '0.9rem' }}>
                                                No students enrolled
                                            </div>
                                        ) : (
                                            <div className="table-responsive">
                                                <table className="users-table">
                                                    <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                                                    <tbody>
                                                        {yearStudents.map(u => (
                                                            <tr key={u._id}>
                                                                <td className="user-name-cell">{u.firstName} {u.lastName}</td>
                                                                <td className="user-email-cell">{u.email}</td>
                                                                <td>
                                                                    <span className={`status-badge status-${u.status}`}>
                                                                        <i className={`fa-solid ${u.status === 'approved' ? 'fa-check-circle' : u.status === 'rejected' ? 'fa-times-circle' : 'fa-hourglass-half'}`}></i>
                                                                        {u.status}
                                                                    </span>
                                                                </td>
                                                                <td className="actions-cell">
                                                                    {u.status === 'pending' && (
                                                                        <>
                                                                            <button className="btn-card btn-card-approve" onClick={() => handleApprove(u._id)} style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}><i className="fa-solid fa-check"></i></button>
                                                                            <button className="btn-card btn-card-reject" onClick={() => handleReject(u._id)} style={{ padding: '4px 8px', fontSize: '12px' }}><i className="fa-solid fa-xmark"></i></button>
                                                                        </>
                                                                    )}
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </div>
                                );
                            })
                        ) : (
                            <div className="year-group" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', marginBottom: '24px', overflow: 'hidden' }}>
                                <div className="year-heading" style={{ background: '#f9fafb', padding: '16px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <h3 style={{ margin: 0, fontSize: '1.05rem', color: '#374151', display: 'flex', alignItems: 'center', gap: '12px', fontWeight: '600' }}>
                                        {courseObj?.name?.split(' ').pop() || 'Class'} {classYearFilter === '1' ? '1st' : classYearFilter === '2' ? '2nd' : classYearFilter === '3' ? '3rd' : '4th'} Year
                                        <span className="year-count" style={{ fontSize: '0.8rem', color: '#9ca3af', fontWeight: '500' }}>{courseStudents.filter(u => u.year === classYearFilter).length} students</span>
                                    </h3>
                                    <button
                                        className="btn-dept-action btn-manage"
                                        style={{ padding: '6px 16px', fontSize: '0.85rem', width: 'auto', margin: 0 }}
                                        onClick={() => {
                                            const yearLabel = classYearFilter === '1' ? '1st' : classYearFilter === '2' ? '2nd' : classYearFilter === '3' ? '3rd' : '4th';
                                            const cls = classes.filter(cls => cls.course && cls.course._id === courseObj._id).find(c => c.semesterOrYear === `${yearLabel} Year`);
                                            setClassDrill({ ...classDrill, level: 'manage', year: classYearFilter, activeTab: 'students', activeClassId: cls?._id });
                                        }}
                                    >
                                        Manage
                                    </button>
                                </div>
                                <div className="table-responsive">
                                    {courseStudents.filter(u => u.year === classYearFilter).length === 0 ? (
                                        <div className="year-empty" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                            No students enrolled in Year {classYearFilter}
                                        </div>
                                    ) : (
                                        <table className="users-table">
                                            <thead><tr><th>Name</th><th>Email</th><th>Year</th><th>Status</th><th>Actions</th></tr></thead>
                                            <tbody>
                                                {courseStudents.filter(u => u.year === classYearFilter).map(u => (
                                                    <tr key={u._id}>
                                                        <td className="user-name-cell">{u.firstName} {u.lastName}</td>
                                                        <td className="user-email-cell">{u.email}</td>
                                                        <td>Year {u.year}</td>
                                                        <td>
                                                            <span className={`status-badge status-${u.status}`}>
                                                                <i className={`fa-solid ${u.status === 'approved' ? 'fa-check-circle' : u.status === 'rejected' ? 'fa-times-circle' : 'fa-hourglass-half'}`}></i>
                                                                {u.status}
                                                            </span>
                                                        </td>
                                                        <td className="actions-cell">
                                                            {u.status === 'pending' && (
                                                                <>
                                                                    <button className="btn-card btn-card-approve" onClick={() => handleApprove(u._id)} style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}><i className="fa-solid fa-check"></i></button>
                                                                    <button className="btn-card btn-card-reject" onClick={() => handleReject(u._id)} style={{ padding: '4px 8px', fontSize: '12px' }}><i className="fa-solid fa-xmark"></i></button>
                                                                </>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    )}
                                </div>
                            </div>
                        )
                    )}
                </div>
            );
        }

        if (level === 'manage') {
            const courseObj = courses.find(c => c._id === course);
            const { year, activeTab } = classDrill;
            const yearStudents = [...students, ...pendingStudents].filter(u => u.course === courseObj?.name && u.year === year);

            return (
                <div className="hod-section">
                    <BreadcrumbBar />
                    <div className="section-header-flex" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', alignItems: 'flex-start' }}>
                        <div>
                            <h2 className="section-heading" style={{ margin: '0 0 8px 0', display: 'flex', alignItems: 'center' }}>
                                {courseObj?.name} - Year {year}
                            </h2>
                            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.95rem' }}>Manage students, course plans, and study materials for this batch.</p>
                        </div>
                    </div>

                    <div className="manage-tabs" style={{ display: 'flex', gap: '32px', borderBottom: '1px solid #e5e7eb', marginBottom: '24px' }}>
                        <button
                            style={{ padding: '12px 0', border: 'none', background: 'none', fontSize: '1rem', fontWeight: activeTab === 'students' ? '600' : '500', color: activeTab === 'students' ? '#4f46e5' : '#6b7280', borderBottom: activeTab === 'students' ? '2px solid #4f46e5' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => setClassDrill({ ...classDrill, activeTab: 'students' })}
                        >
                            <i className="fa-solid fa-users" style={{ marginRight: '8px' }}></i> Students ({yearStudents.length})
                        </button>
                        <button
                            style={{ padding: '12px 0', border: 'none', background: 'none', fontSize: '1rem', fontWeight: activeTab === 'plan' ? '600' : '500', color: activeTab === 'plan' ? '#4f46e5' : '#6b7280', borderBottom: activeTab === 'plan' ? '2px solid #4f46e5' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => {
                                const cls = classes.filter(cls => cls.course && cls.course._id === courseObj._id).find(c => c.semesterOrYear === `${classDrill.year === '1' ? '1st' : classDrill.year === '2' ? '2nd' : classDrill.year === '3' ? '3rd' : '4th'} Year`);
                                setClassDrill({ ...classDrill, activeTab: 'plan', activeClassId: cls?._id });
                            }}
                        >
                            <i className="fa-solid fa-calendar-days" style={{ marginRight: '8px' }}></i> Course Plan
                        </button>
                        <button
                            style={{ padding: '12px 0', border: 'none', background: 'none', fontSize: '1rem', fontWeight: activeTab === 'materials' ? '600' : '500', color: activeTab === 'materials' ? '#4f46e5' : '#6b7280', borderBottom: activeTab === 'materials' ? '2px solid #4f46e5' : '2px solid transparent', cursor: 'pointer', transition: 'all 0.2s' }}
                            onClick={() => {
                                const cls = classes.filter(cls => cls.course && cls.course._id === courseObj._id).find(c => c.semesterOrYear === `${classDrill.year === '1' ? '1st' : classDrill.year === '2' ? '2nd' : classDrill.year === '3' ? '3rd' : '4th'} Year`);
                                setClassDrill({ ...classDrill, activeTab: 'materials', activeClassId: cls?._id });
                            }}
                        >
                            <i className="fa-solid fa-file-pdf" style={{ marginRight: '8px' }}></i> Study Materials
                        </button>
                    </div>

                    <div className="tab-content">
                        {activeTab === 'students' && (
                            <div className="table-responsive" style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden' }}>
                                {yearStudents.length === 0 ? (
                                    <div className="year-empty" style={{ padding: '40px', textAlign: 'center', color: '#9ca3af', fontStyle: 'italic' }}>
                                        No students enrolled in this batch.
                                    </div>
                                ) : (
                                    <table className="users-table">
                                        <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                                        <tbody>
                                            {yearStudents.map(u => (
                                                <tr key={u._id}>
                                                    <td className="user-name-cell">{u.firstName} {u.lastName}</td>
                                                    <td className="user-email-cell">{u.email}</td>
                                                    <td>
                                                        <span className={`status-badge status-${u.status}`}>
                                                            <i className={`fa-solid ${u.status === 'approved' ? 'fa-check-circle' : u.status === 'rejected' ? 'fa-times-circle' : 'fa-hourglass-half'}`}></i>
                                                            {u.status}
                                                        </span>
                                                    </td>
                                                    <td className="actions-cell">
                                                        {u.status === 'pending' && (
                                                            <>
                                                                <button className="btn-card btn-card-approve" onClick={() => handleApprove(u._id)} style={{ padding: '4px 8px', fontSize: '12px', marginRight: '4px' }}><i className="fa-solid fa-check"></i></button>
                                                                <button className="btn-card btn-card-reject" onClick={() => handleReject(u._id)} style={{ padding: '4px 8px', fontSize: '12px' }}><i className="fa-solid fa-xmark"></i></button>
                                                            </>
                                                        )}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        )}

                        {activeTab === 'plan' && (
                            <div className="tab-pane" style={{ background: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                    <div>
                                        <h3 style={{ fontSize: '1.25rem', color: '#111827', margin: '0 0 4px 0' }}>Course Syllabus & Plan</h3>
                                        <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>The official curriculum document for this batch.</p>
                                    </div>
                                    <div>
                                        <input
                                            type="file"
                                            id="plan-upload"
                                            style={{ display: 'none' }}
                                            accept=".pdf,.doc,.docx"
                                            onChange={(e) => handleFileUpload(e, 'plan')}
                                        />
                                        <button
                                            className="btn-create"
                                            onClick={() => document.getElementById('plan-upload').click()}
                                        >
                                            <i className="fa-solid fa-cloud-arrow-up"></i> {uploadedPlan ? 'Update Plan' : 'Upload Plan'}
                                        </button>
                                    </div>
                                </div>

                                {classes.find(c => c._id === classDrill.activeClassId)?.coursePlan?.fileUrl ? (() => {
                                    const activeCls = classes.find(c => c._id === classDrill.activeClassId);
                                    return (
                                        <div style={{ display: 'flex', alignItems: 'center', p: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                                            <div style={{ width: '40px', height: '40px', background: '#eff6ff', color: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginRight: '16px' }}>
                                                <i className="fa-solid fa-file-pdf"></i>
                                            </div>
                                            <div style={{ flex: 1 }}>
                                                <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '1rem' }}>{activeCls.coursePlan.originalName || 'Course Plan.pdf'}</h4>
                                                <p style={{ margin: 0, color: '#64748b', fontSize: '0.85rem' }}>Uploaded file</p>
                                            </div>
                                            <div style={{ display: 'flex', gap: '8px' }}>
                                                <a href={`http://localhost:5000${activeCls.coursePlan.fileUrl}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}>
                                                    <i className="fa-solid fa-download"></i> Download
                                                </a>
                                            </div>
                                        </div>
                                    );
                                })() : (
                                    <div className="empty-state" style={{ background: '#f9fafb', borderRadius: '12px', padding: '60px 20px', border: '2px dashed #e5e7eb', marginTop: '16px' }}>
                                        <i className="fa-solid fa-calendar-plus" style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }}></i>
                                        <h3 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '8px' }}>No Course Plan Yet</h3>
                                        <p style={{ color: '#6b7280', marginBottom: '24px', maxWidth: '400px', margin: '0 auto' }}>Upload a syllabus or create a detailed week-by-week course plan for this batch.</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {activeTab === 'materials' && (() => {
                            const activeCls = classes.find(c => c._id === classDrill.activeClassId);
                            const materials = activeCls?.studyMaterials || [];

                            return (
                                <div className="tab-pane" style={{ background: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e5e7eb' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                                        <div>
                                            <h3 style={{ fontSize: '1.25rem', color: '#111827', margin: '0 0 4px 0' }}>Study Materials</h3>
                                            <p style={{ color: '#6b7280', margin: 0, fontSize: '0.9rem' }}>Upload resources for students in this batch.</p>
                                        </div>
                                        <div>
                                            <input
                                                type="file"
                                                id="material-upload"
                                                style={{ display: 'none' }}
                                                accept=".pdf,.doc,.docx,.ppt,.pptx"
                                                onChange={(e) => handleFileUpload(e, 'material')}
                                            />
                                            <button
                                                className="btn-create"
                                                onClick={() => document.getElementById('material-upload').click()}
                                            >
                                                <i className="fa-solid fa-file-arrow-up"></i> Upload Material
                                            </button>
                                        </div>
                                    </div>

                                    {materials.length > 0 ? (
                                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
                                            {materials.map((mat, index) => (
                                                <div key={index} style={{ display: 'flex', flexDirection: 'column', p: '16px', background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '16px' }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', marginBottom: '16px' }}>
                                                        <div style={{ width: '40px', height: '40px', background: '#eff6ff', color: '#3b82f6', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '20px', marginRight: '16px', flexShrink: 0 }}>
                                                            <i className={`fa-solid ${mat.url.endsWith('.pdf') ? 'fa-file-pdf' : mat.url.match(/\.doc$|\.docx$/) ? 'fa-file-word' : mat.url.match(/\.ppt$|\.pptx$/) ? 'fa-file-powerpoint' : 'fa-file'}`}></i>
                                                        </div>
                                                        <div style={{ flex: 1, minWidth: 0 }}>
                                                            <h4 style={{ margin: '0 0 4px 0', color: '#1e293b', fontSize: '1rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={mat.title}>{mat.title}</h4>
                                                            <p style={{ margin: 0, color: '#64748b', fontSize: '0.8rem' }}>Uploaded on {new Date(mat.uploadDate).toLocaleDateString()}</p>
                                                        </div>
                                                    </div>
                                                    <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
                                                        <a href={`http://localhost:5000${mat.url}`} target="_blank" rel="noopener noreferrer" style={{ flex: 1, textDecoration: 'none', background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', color: '#3b82f6', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem', textAlign: 'center' }}>
                                                            <i className="fa-solid fa-download"></i> Download
                                                        </a>
                                                        <button
                                                            style={{ background: 'white', border: '1px solid #e2e8f0', padding: '6px 12px', borderRadius: '6px', color: '#ef4444', cursor: 'pointer', fontWeight: '500', fontSize: '0.85rem' }}
                                                            onClick={() => deleteMaterial(mat._id)}
                                                        >
                                                            <i className="fa-solid fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="empty-state" style={{ background: '#f9fafb', borderRadius: '12px', padding: '60px 20px', border: '2px dashed #e5e7eb', marginTop: '16px' }}>
                                            <i className="fa-solid fa-folder-open" style={{ fontSize: '48px', color: '#9ca3af', marginBottom: '16px' }}></i>
                                            <h3 style={{ fontSize: '1.25rem', color: '#374151', marginBottom: '8px' }}>No Study Materials</h3>
                                            <p style={{ color: '#6b7280', marginBottom: '0', maxWidth: '400px', margin: '0 auto' }}>Upload PDFs, presentations, and resources for students in this batch.</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })()}
                    </div>
                </div>
            );
        }
    };

    const renderContent = () => {
        if (activeSection === 'dashboard') return renderDashboard();
        if (activeSection === 'students') return renderStudents();
        if (activeSection === 'classes') return renderClasses();
        if (activeSection === 'faculty') {
            const facultyList = faculties;
            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Faculty Members</h2>
                        <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                            <div className="search-box">
                                <i className="fa-solid fa-magnifying-glass"></i>
                                <input type="text" placeholder="Search faculty..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                            </div>
                            <button className="btn-card btn-add-faculty" onClick={() => setShowModal('faculty')}>
                                <i className="fa-solid fa-plus"></i> Add Faculty
                            </button>
                        </div>
                    </div>
                    {facultyList.length === 0 ? (
                        <div className="empty-state">No faculty members found in this department.</div>
                    ) : (
                        <div className="table-responsive">
                            <table className="users-table">
                                <thead>
                                    <tr>
                                        <th>Name</th>
                                        <th>Email</th>
                                        <th>Role</th>
                                        <th>Joined On</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {facultyList.filter(f => `${f.firstName} ${f.lastName} ${f.email}`.toLowerCase().includes(searchTerm.toLowerCase())).map(f => (
                                        <tr key={f._id}>
                                            <td className="user-name-cell">{f.firstName} {f.lastName}</td>
                                            <td className="user-email-cell">{f.email}</td>
                                            <td><span className="role-badge" style={{ background: f.role === 'hod' ? '#fef3c7' : '#f3f4f6', color: f.role === 'hod' ? '#d97706' : '#4b5563' }}>{f.role === 'hod' ? 'HOD' : 'Faculty'}</span></td>
                                            <td className="user-date-cell">{new Date(f.createdAt).toLocaleDateString()}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            );
        }

        if (activeSection === 'leave') {
            const dashboardRole = user?.role === 'admin' ? 'admin' : 'hod';
            return (
                <div className="hod-section">
                    <div className="section-header-flex">
                        <h2 className="section-heading">Leave Management</h2>
                    </div>
                    <LeavePanel
                        role={dashboardRole}
                        canApply={dashboardRole === 'hod'}
                        showInbox
                        inboxTitle={dashboardRole === 'hod' ? 'Faculty Leave Requests' : 'HOD Leave Requests'}
                        initialName={`${user?.firstName || ''} ${user?.lastName || ''}`.trim()}
                        onToast={showToastMessage}
                    />
                </div>
            );
        }

        return <div className="hod-section"><h2 className="section-heading">Coming Soon</h2></div>;
    };

    if (!user || (user.role !== 'hod' && user.role !== 'admin')) return null;

    return (
        <div className="hod-layout">
            {renderSidebar()}
            <main className="hod-main">
                <header className="hod-topbar">
                    <div className="topbar-left">
                        <div className="dept-badge">
                            <i className="fa-solid fa-building-columns"></i> {user.department ? user.department.toUpperCase() : 'HOD'} Dept
                        </div>
                    </div>
                    <div className="topbar-right">
                        <div className="admin-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="admin-avatar" style={{ background: '#facc15' }}>{user.firstName?.[0] || 'H'}</div>
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

            {/* Create Faculty Modal */}
            {showModal === 'faculty' && (user.role === 'hod' || user.role === 'admin') && (
                <div className="modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Faculty</h3>
                            <button className="btn-close" onClick={() => setShowModal(null)}>
                                <i className="fa-solid fa-xmark"></i>
                            </button>
                        </div>
                        <form className="modal-form" onSubmit={handleCreateFaculty}>
                            <div className="form-row-admin" style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }} className="form-group-admin">
                                    <label>First Name</label>
                                    <div className="input-wrapper-admin">
                                        <i className="fa-solid fa-user"></i>
                                        <input
                                            type="text"
                                            placeholder="First name"
                                            required
                                            value={facultyForm.firstName}
                                            onChange={e => setFacultyForm({ ...facultyForm, firstName: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }} className="form-group-admin">
                                    <label>Last Name</label>
                                    <div className="input-wrapper-admin">
                                        <i className="fa-solid fa-user"></i>
                                        <input
                                            type="text"
                                            placeholder="Last name"
                                            required
                                            value={facultyForm.lastName}
                                            onChange={e => setFacultyForm({ ...facultyForm, lastName: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>
                            <div className="form-row-admin" style={{ display: 'flex', gap: '15px' }}>
                                <div style={{ flex: 1 }} className="form-group-admin">
                                    <label>Email Address</label>
                                    <div className="input-wrapper-admin">
                                        <i className="fa-solid fa-envelope"></i>
                                        <input
                                            type="email"
                                            placeholder="Email address"
                                            required
                                            value={facultyForm.email}
                                            onChange={e => setFacultyForm({ ...facultyForm, email: e.target.value })}
                                        />
                                    </div>
                                </div>
                                <div style={{ flex: 1 }} className="form-group-admin">
                                    <label>Password</label>
                                    <div className="input-wrapper-admin">
                                        <i className="fa-solid fa-lock"></i>
                                        <input
                                            type={showFacultyPassword ? "text" : "password"}
                                            placeholder="Password"
                                            required
                                            value={facultyForm.password}
                                            onChange={e => setFacultyForm({ ...facultyForm, password: e.target.value })}
                                        />
                                        <button
                                            type="button"
                                            className="btn-toggle-password"
                                            onClick={(_e) => setShowFacultyPassword(!showFacultyPassword)}
                                        >
                                            <i className={`fa-solid ${showFacultyPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                            </div>
                            <div className="form-row-admin" style={{ display: 'flex', gap: '15px' }}>
                                <div className="form-group-admin" style={{ flex: 1 }}>
                                    <label>Department</label>
                                    <div className="input-wrapper-admin">
                                        <i className="fa-solid fa-building-columns"></i>
                                        <input
                                            type="text"
                                            value={user.department ? user.department.toUpperCase() : 'Your Department'}
                                            disabled
                                            style={{ backgroundColor: '#f3f4f6', cursor: 'not-allowed', color: '#6b7280' }}
                                        />
                                    </div>
                                </div>
                                <div className="form-group-admin" style={{ flex: 1 }}>
                                    <CustomSelect
                                        label="Program Level"
                                        icon="fa-solid fa-graduation-cap"
                                        placeholder="Any Program"
                                        value={facultyProgramType}
                                        options={[
                                            { value: '', label: 'All Programs' },
                                            ...Array.from(new Map([
                                                ...courses.map(c => [normalizeProgramType(c?.programType), c?.programTypeLabel || c?.programType]),
                                                ...classes.map(c => [
                                                    getClassProgramType(c),
                                                    c?.course?.programTypeLabel || c?.programTypeLabel || c?.course?.programType || c?.programType
                                                ])
                                            ].filter(([value]) => Boolean(value))).entries()).map(([value, label]) => ({
                                                value,
                                                label: String(label || value)
                                            }))
                                        ]}
                                        onChange={val => { setFacultyProgramType(val); setFacultyCourseId(''); setFacultyForm({ ...facultyForm, classId: '' }); }}
                                    />
                                </div>
                            </div>
                            <div className="form-row-admin" style={{ display: 'flex', gap: '15px', marginBottom: "24px" }}>
                                <div className="form-group-admin" style={{ flex: 1, marginBottom: 0 }}>
                                    <CustomSelect
                                        label="Course"
                                        icon="fa-solid fa-book"
                                        placeholder="Any Course"
                                        value={facultyCourseId}
                                        options={[
                                            { value: '', label: 'All Courses' },
                                            ...Array.from(new Map([
                                                ...courses
                                                    .filter(c => facultyProgramType ? normalizeProgramType(c?.programType) === facultyProgramType : true)
                                                    .map(c => [String(c._id), { value: c._id, label: c.name || c.code }]),
                                                ...classes
                                                    .filter(c => facultyProgramType ? getClassProgramType(c) === facultyProgramType : true)
                                                    .map(c => c.course)
                                                    .filter(Boolean)
                                                    .map(c => [String(c._id), { value: c._id, label: c.name || c.code }])
                                            ]).values())
                                        ]}
                                        onChange={val => { setFacultyCourseId(val); setFacultyForm({ ...facultyForm, classId: '' }); }}
                                    />
                                </div>
                                <div className="form-group-admin" style={{ flex: 1, marginBottom: 0 }}>
                                    <CustomSelect
                                        label="Assigned Class (Optional)"
                                        icon="fa-solid fa-chalkboard"
                                        placeholder="Select exact batch"
                                        value={facultyForm.classId}
                                        options={[
                                            { value: '', label: 'None' },
                                            ...classes
                                                .filter(c => facultyCourseId ? String(c.course?._id) === String(facultyCourseId) : (facultyProgramType ? getClassProgramType(c) === facultyProgramType : true))
                                                .map(c => ({
                                                    value: c._id,
                                                    label: `${c.academicYear} - ${c.semesterOrYear} (${c.course?.name || c.name})`
                                                }))
                                        ]}
                                        onChange={val => setFacultyForm({ ...facultyForm, classId: val })}
                                    />
                                </div>
                            </div>
                            <button type="submit" className="btn-create">
                                <i className="fa-solid fa-user-plus"></i> Create Faculty
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Toast Notification */}
            {showToast && (
                <div className={`toast-notification ${toastMsg.type === 'error' ? 'toast-error' : ''}`}>
                    <div className="toast-icon">
                        <i className={`fa-solid ${toastMsg.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
                    </div>
                    <div className="toast-content">
                        <p className="toast-title">{toastMsg.title}</p>
                        <p className="toast-message">{toastMsg.message}</p>
                    </div>
                    <button className="toast-close" onClick={() => setShowToast(false)}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}
        </div>
    );
};

export default HodDashboard;
