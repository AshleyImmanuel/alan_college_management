import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import CustomSelect from '../components/CustomSelect';
import './AdminDashboard.css';
import { authFetch, getCurrentUser, logoutUser, notifyAuthChanged } from '../components/authClient';
import LeavePanel from '../components/LeavePanel';

const AdminDashboard = () => {
    const navigate = useNavigate();
    const [activeSection, setActiveSection] = useState('dashboard');
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [stats, setStats] = useState({ totalUsers: 0, pendingUsers: 0, approvedUsers: 0, rejectedUsers: 0, students: 0, hods: 0, faculties: 0, departments: 0 });
    const [users, setUsers] = useState([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('all');
    const [roleFilter, setRoleFilter] = useState('all');
    const [showRoleFilter, setShowRoleFilter] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState({ title: '', message: '', type: 'success' });
    const [createForm, setCreateForm] = useState({ firstName: '', lastName: '', email: '', password: '', role: 'hod', department: '', classId: '', programType: '', courseId: '' });
    const [showPassword, setShowPassword] = useState(false);
    const [deptDrill, setDeptDrill] = useState({ level: 'list', dept: null, program: null, course: null });
    const [deptSearch, setDeptSearch] = useState('');
    const [deptYearFilter, setDeptYearFilter] = useState('all');
    const [departments, setDepartments] = useState([]);
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [showModal, setShowModal] = useState(null);
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null });
    const [showProfileMenu, setShowProfileMenu] = useState(false);
    const [deptForm, setDeptForm] = useState({ name: '', code: '', icon: 'fa-building-columns', color: '#3b82f6' });
    const [courseForm, setCourseForm] = useState({ name: '', code: '', department: '', programType: 'ug', duration: 3 });
    const [user, setUser] = useState(null);
    const [authLoading, setAuthLoading] = useState(true);

    const normalizeProgramType = (programType) => {
        const normalized = String(programType || '').trim().toLowerCase();
        return normalized;
    };

    const getClassProgramType = (cls) => normalizeProgramType(cls?.course?.programType || cls?.programType);

    const getDepartmentIdByCode = (deptCode) => String(departments.find(d => d.code === deptCode)?._id || '');

    const isInSelectedDepartment = (itemDepartment, deptCode) => {
        if (!deptCode) return true;
        const selectedDeptId = getDepartmentIdByCode(deptCode);
        if (!selectedDeptId) return false;
        const itemDeptId = typeof itemDepartment === 'object' ? itemDepartment?._id : itemDepartment;
        return String(itemDeptId) === selectedDeptId;
    };

    const showToastMessage = (title, message, type = 'success') => {
        setToastMsg({ title, message, type });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 4000);
    };

    const fetchStats = useCallback(async () => {
        try {
            const res = await authFetch('/api/admin/stats');
            if (res.ok) { const data = await res.json(); setStats(data); }
        } catch (err) { console.error('Failed to fetch stats'); }
    }, []);

    const fetchUsers = useCallback(async () => {
        try {
            const res = await authFetch('/api/admin/users');
            if (res.ok) { const data = await res.json(); setUsers(data); }
        } catch (err) { console.error('Failed to fetch users'); }
    }, []);

    const fetchDepartments = useCallback(async () => {
        try {
            const res = await authFetch('/api/admin/departments');
            if (res.ok) { const data = await res.json(); setDepartments(data); }
        } catch (err) { console.error('Failed to fetch departments'); }
    }, []);

    const fetchCourses = useCallback(async () => {
        try {
            const res = await authFetch('/api/admin/courses');
            if (res.ok) { const data = await res.json(); setCourses(data); }
        } catch (err) { console.error('Failed to fetch courses'); }
    }, []);

    const fetchClasses = useCallback(async () => {
        try {
            const res = await authFetch('/api/hod/classes');
            if (res.ok) { const data = await res.json(); setClasses(data); }
        } catch (err) { console.error('Failed to fetch classes'); }
    }, []);

    useEffect(() => {
        let mounted = true;
        const hydrateAuth = async () => {
            const currentUser = await getCurrentUser();
            if (!mounted) return;

            if (!currentUser || currentUser.role !== 'admin') {
                setAuthLoading(false);
                navigate('/login');
                return;
            }

            setUser(currentUser);
            setAuthLoading(false);
            fetchStats();
            fetchUsers();
            fetchDepartments();
            fetchCourses();
            fetchClasses();
        };

        hydrateAuth();
        return () => {
            mounted = false;
        };
    }, [navigate, fetchStats, fetchUsers, fetchDepartments, fetchCourses, fetchClasses]);

    const handleApprove = async (id) => {
        try {
            const res = await authFetch(`/api/hod/approve/${id}`, { method: 'PUT' });
            const data = await res.json();
            if (res.ok) { showToastMessage('Approved', data.message); fetchUsers(); fetchStats(); }
            else { showToastMessage('Error', data.message, 'error'); }
        } catch (err) { showToastMessage('Error', 'Server connection failed', 'error'); }
    };

    const handleReject = async (id) => {
        try {
            const res = await authFetch(`/api/hod/reject/${id}`, { method: 'PUT' });
            const data = await res.json();
            if (res.ok) { showToastMessage('Rejected', data.message); fetchUsers(); fetchStats(); }
            else { showToastMessage('Error', data.message, 'error'); }
        } catch (err) { showToastMessage('Error', 'Server connection failed', 'error'); }
    };

    const handleDelete = (id, name) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete User',
            message: `Are you sure you want to delete ${name}?`,
            onConfirm: async () => {
                try {
                    const res = await authFetch(`/api/admin/users/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok) { showToastMessage('Deleted', data.message); fetchUsers(); fetchStats(); }
                    else { showToastMessage('Error', data.message, 'error'); }
                } catch (err) { showToastMessage('Error', 'Server connection failed', 'error'); }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
            }
        });
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            const res = await authFetch('/api/admin/create-user', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(createForm),
            });
            const data = await res.json();
            if (res.ok) {
                showToastMessage('Success', data.message);
                setCreateForm({ firstName: '', lastName: '', email: '', password: '', role: 'hod', department: '', classId: '' });
                fetchUsers(); fetchStats();
            } else { showToastMessage('Error', data.message, 'error'); }
        } catch (err) { showToastMessage('Error', 'Server connection failed', 'error'); }
    };

    const handleCreateDept = async (e) => {
        e.preventDefault();
        try {
            const res = await authFetch('/api/admin/departments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(deptForm),
            });
            const data = await res.json();
            if (res.ok) {
                showToastMessage('Success', data.message);
                setDeptForm({ name: '', code: '', icon: 'fa-building-columns', color: '#3b82f6' });
                setShowModal(null);
                fetchDepartments(); fetchStats();
            } else { showToastMessage('Error', data.message, 'error'); }
        } catch (err) { showToastMessage('Error', 'Server connection failed', 'error'); }
    };

    const handleDeleteDept = (id, name) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Department',
            message: `Delete department "${name}" and ALL its courses? This cannot be undone.`,
            onConfirm: async () => {
                try {
                    const res = await authFetch(`/api/admin/departments/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok) { showToastMessage('Deleted', data.message); fetchDepartments(); fetchCourses(); fetchStats(); }
                    else { showToastMessage('Error', data.message, 'error'); }
                } catch (err) { showToastMessage('Error', 'Server connection failed', 'error'); }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
            }
        });
    };

    const handleCreateCourse = async (e) => {
        e.preventDefault();
        try {
            const res = await authFetch('/api/admin/courses', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(courseForm),
            });
            const data = await res.json();
            if (res.ok) {
                showToastMessage('Success', data.message);
                setCourseForm({ name: '', code: '', department: '', programType: 'ug', duration: 3 });
                setShowModal(null);
                fetchCourses();
            } else { showToastMessage('Error', data.message, 'error'); }
        } catch (err) { showToastMessage('Error', 'Server connection failed', 'error'); }
    };

    const handleDeleteCourse = (id, name) => {
        setConfirmDialog({
            isOpen: true,
            title: 'Delete Course',
            message: `Delete course "${name}"?`,
            onConfirm: async () => {
                try {
                    const res = await authFetch(`/api/admin/courses/${id}`, { method: 'DELETE' });
                    const data = await res.json();
                    if (res.ok) { showToastMessage('Deleted', data.message); fetchCourses(); }
                    else { showToastMessage('Error', data.message, 'error'); }
                } catch (err) { showToastMessage('Error', 'Server connection failed', 'error'); }
                setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null });
            }
        });
    };

    const handleLogout = async () => {
        await logoutUser();
        notifyAuthChanged();
        navigate('/login');
    };

    const filteredUsers = users.filter(u => {
        if (u.role === 'student' || u.role === 'admin') return false;

        const matchSearch = `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(searchTerm.toLowerCase());
        const matchStatus = filterStatus === 'all' || u.status === filterStatus;
        const matchRole = roleFilter === 'all' || u.role === roleFilter;

        return matchSearch && matchStatus && matchRole;
    });

    const pendingUsers = users.filter(u => u.status === 'pending');

    const navItems = [
        { id: 'dashboard', icon: 'fa-chart-pie', label: 'Dashboard' },
        { id: 'departments', icon: 'fa-building-columns', label: 'Departments' },
        { id: 'users', icon: 'fa-users', label: 'Users' },
        { id: 'create', icon: 'fa-user-plus', label: 'Create Account' },
        { id: 'leave', icon: 'fa-calendar-days', label: 'Leave Requests' },
    ];

    if (authLoading) return null;
    if (!user || user.role !== 'admin') return null;

    // Build lookup maps from API data
    const deptLabels = {};
    departments.forEach(d => { deptLabels[d.code] = d.name; });
    const courseLabels = {};
    courses.forEach(c => { courseLabels[c.code] = c.name; });

    const renderStatusBadge = (status) => (
        <span className={`status-badge status-${status}`}>
            <i className={`fa-solid ${status === 'approved' ? 'fa-check-circle' : status === 'rejected' ? 'fa-times-circle' : 'fa-hourglass-half'}`}></i>
            {status}
        </span>
    );

    // ========== SECTION RENDERERS ==========

    const renderDashboard = () => (
        <div className="admin-section">
            <div className="stats-secondary">
                <div className="stat-card stat-students">
                    <div className="stat-icon"><i className="fa-solid fa-user-graduate"></i></div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.students}</span>
                        <span className="stat-label">Students</span>
                    </div>
                </div>
                <div className="stat-card stat-hods">
                    <div className="stat-icon"><i className="fa-solid fa-chalkboard-teacher"></i></div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.hods}</span>
                        <span className="stat-label">HODs</span>
                    </div>
                </div>
                <div className="stat-card stat-faculties">
                    <div className="stat-icon"><i className="fa-solid fa-person-chalkboard"></i></div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.faculties}</span>
                        <span className="stat-label">Faculties</span>
                    </div>
                </div>
                <div className="stat-card stat-depts" onClick={() => { setDeptDrill({ level: 'list', dept: null, program: null, course: null }); setActiveSection('departments'); }}>
                    <div className="stat-icon"><i className="fa-solid fa-building-columns"></i></div>
                    <div className="stat-info">
                        <span className="stat-number">{stats.departments}</span>
                        <span className="stat-label">Departments</span>
                    </div>
                </div>
            </div>
        </div>
    );

    const renderLeaves = () => (
        <div className="admin-section">
            <h2 className="section-heading">HOD Leave Requests</h2>
            <LeavePanel
                role="admin"
                canApply={false}
                showInbox
                inboxTitle="HOD Leave Requests"
                onToast={showToastMessage}
            />
        </div>
    );

    const renderUsers = () => (
        <div className="admin-section">
            <h2 className="section-heading">All Users</h2>
            <div className="users-toolbar">
                <div className="search-box">
                    <i className="fa-solid fa-magnifying-glass"></i>
                    <input type="text" placeholder="Search users..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div className="filter-group" style={{ position: 'relative' }}>
                    <button
                        className={`filter-btn ${roleFilter !== 'all' ? 'active' : ''}`}
                        onClick={() => setShowRoleFilter(!showRoleFilter)}
                        style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
                    >
                        <i className="fa-solid fa-filter"></i>
                        Role: {roleFilter === 'all' ? 'All' : roleFilter === 'hod' ? 'HOD' : 'Faculty'}
                        <i className={`fa-solid fa-chevron-${showRoleFilter ? 'up' : 'down'}`} style={{ fontSize: '10px', marginLeft: '4px' }}></i>
                    </button>

                    {showRoleFilter && (
                        <div className="role-filter-dropdown" style={{
                            position: 'absolute', top: '100%', left: 0, marginTop: '8px',
                            background: '#fff', borderRadius: '10px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                            border: '1px solid #e5e7eb', zIndex: 100, minWidth: '140px', overflow: 'hidden'
                        }}>
                            {['all', 'hod', 'faculty'].map(r => (
                                <button key={r}
                                    onClick={() => { setRoleFilter(r); setShowRoleFilter(false); }}
                                    style={{
                                        display: 'block', width: '100%', padding: '12px 16px', textAlign: 'left',
                                        background: roleFilter === r ? '#eff6ff' : '#fff',
                                        color: roleFilter === r ? '#2563eb' : '#374151',
                                        border: 'none', borderBottom: '1px solid #f3f4f6', cursor: 'pointer',
                                        fontWeight: roleFilter === r ? '600' : '500', transition: 'all 0.2s',
                                        outline: 'none'
                                    }}
                                    onMouseEnter={(e) => { if (roleFilter !== r) e.target.style.background = '#f9fafb'; }}
                                    onMouseLeave={(e) => { if (roleFilter !== r) e.target.style.background = '#fff'; }}
                                >
                                    {r === 'all' ? 'All Roles' : r === 'hod' ? 'HOD' : 'Faculty'}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            <div className="users-table-wrapper">
                <table className="users-table">
                    <thead>
                        <tr><th>Name</th><th>Email</th><th>Role</th><th>Department</th><th>Status</th><th>Actions</th></tr>
                    </thead>
                    <tbody>
                        {filteredUsers.map(u => (
                            <tr key={u._id}>
                                <td className="user-name-cell">{u.firstName} {u.lastName}</td>
                                <td className="user-email-cell">{u.email}</td>
                                <td><span className="role-badge">{u.role}</span></td>
                                <td>{deptLabels[u.department] || u.department || '—'}</td>
                                <td>{renderStatusBadge(u.status)}</td>
                                <td className="actions-cell">
                                    {u.status === 'pending' && (
                                        <>
                                            <button className="btn-action btn-approve" onClick={() => handleApprove(u._id)}><i className="fa-solid fa-check"></i></button>
                                            <button className="btn-action btn-reject" onClick={() => handleReject(u._id)}><i className="fa-solid fa-xmark"></i></button>
                                        </>
                                    )}
                                    {u.role !== 'admin' && <button className="btn-action btn-delete" onClick={() => handleDelete(u._id, `${u.firstName} ${u.lastName}`)}><i className="fa-solid fa-trash"></i></button>}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );

    const renderPending = () => (
        <div className="admin-section">
            <h2 className="section-heading">Pending Approvals <span className="pending-count">{pendingUsers.length}</span></h2>
            {pendingUsers.length === 0 ? (
                <div className="empty-card">
                    <i className="fa-solid fa-check-double"></i>
                    <h3>All caught up!</h3>
                    <p>There are no pending approvals right now.</p>
                </div>
            ) : (
                <div className="pending-cards-grid">
                    {pendingUsers.map(u => (
                        <div key={u._id} className="pending-card">
                            <div className="pending-card-header">
                                <div className="pending-avatar">{u.firstName[0]}{u.lastName[0]}</div>
                                <div>
                                    <h4>{u.firstName} {u.lastName}</h4>
                                    <span className="pending-email">{u.email}</span>
                                </div>
                            </div>
                            <div className="pending-details">
                                <div className="detail-row">
                                    <span>Role</span>
                                    <span className="role-badge">{u.role}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Department</span>
                                    <span>{deptLabels[u.department] || u.department || '—'}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Course</span>
                                    <span>{courseLabels[u.course] || u.course || '—'}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Year</span>
                                    <span>{u.year ? `Year ${u.year}` : '—'}</span>
                                </div>
                                <div className="detail-row">
                                    <span>Program</span>
                                    <span>{u.programType === 'ug' ? 'Undergraduate' : u.programType === 'pg' ? 'Postgraduate' : '—'}</span>
                                </div>
                            </div>
                            <div className="pending-card-actions">
                                <button className="btn-card btn-card-approve" onClick={() => handleApprove(u._id)}>
                                    <i className="fa-solid fa-check"></i> Approve
                                </button>
                                <button className="btn-card btn-card-reject" onClick={() => handleReject(u._id)}>
                                    <i className="fa-solid fa-xmark"></i> Reject
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );

    const renderCreate = () => (
        <div className="admin-section">
            <h2 className="section-heading">Create HOD / Faculty Account</h2>
            <div className="create-form-card">
                <form onSubmit={handleCreateUser}>
                    <div className="form-row-admin">
                        <div className="form-group-admin">
                            <label>First Name</label>
                            <input type="text" value={createForm.firstName} onChange={e => setCreateForm({ ...createForm, firstName: e.target.value })} required />
                        </div>
                        <div className="form-group-admin">
                            <label>Last Name</label>
                            <input type="text" value={createForm.lastName} onChange={e => setCreateForm({ ...createForm, lastName: e.target.value })} required />
                        </div>
                    </div>
                    <div className="form-group-admin">
                        <label>Email</label>
                        <input type="email" value={createForm.email} onChange={e => setCreateForm({ ...createForm, email: e.target.value })} required />
                    </div>
                    <div className="form-group-admin" style={{ position: 'relative' }}>
                        <label>Password</label>
                        <input
                            type={showPassword ? "text" : "password"}
                            value={createForm.password}
                            onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                            required
                            minLength={6}
                            style={{ paddingRight: '40px' }}
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            style={{
                                position: 'absolute',
                                right: '12px',
                                top: '38px',
                                background: 'none',
                                border: 'none',
                                color: '#6b7280',
                                cursor: 'pointer'
                            }}
                        >
                            <i className={`fa-solid ${showPassword ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                        </button>
                    </div>
                    <div className="form-row-admin" style={{ display: 'flex', gap: '15px' }}>
                        <div style={{ flex: 1 }}>
                            <CustomSelect
                                id="create-user-role"
                                label="Role"
                                icon="fa-solid fa-user-shield"
                                placeholder="Select Role"
                                value={createForm.role}
                                onChange={(val) => setCreateForm({ ...createForm, role: val })}
                                options={[
                                    { value: 'hod', label: 'HOD' },
                                    { value: 'faculty', label: 'Faculty' }
                                ]}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <CustomSelect
                                id="create-user-dept"
                                label="Department"
                                icon="fa-solid fa-building-columns"
                                placeholder="Select Department"
                                value={createForm.department}
                                onChange={(val) => setCreateForm({ ...createForm, department: val, programType: '', courseId: '', classId: '' })}
                                options={departments.map(d => ({ value: d.code, label: d.name }))}
                            />
                        </div>
                    </div>
                    {createForm.role === 'faculty' && (
                        <div className="form-row-admin" style={{ display: 'flex', gap: '15px', marginBottom: "24px", flexWrap: 'wrap' }}>
                            <div className="form-group-admin" style={{ flex: '1 1 calc(33.333% - 15px)', marginBottom: 0 }}>
                                <CustomSelect
                                    label="Program Level"
                                    icon="fa-solid fa-graduation-cap"
                                    placeholder="Any Program"
                                    value={createForm.programType}
                                    options={[
                                        { value: '', label: 'All Programs' },
                                        ...Array.from(new Map([
                                            ...courses
                                                .filter(c => isInSelectedDepartment(c.department, createForm.department))
                                                .map(c => [normalizeProgramType(c.programType), c.programTypeLabel || c.programType]),
                                            ...classes
                                                .filter(c => isInSelectedDepartment(c.department, createForm.department))
                                                .map(c => [
                                                    getClassProgramType(c),
                                                    c?.course?.programTypeLabel || c?.programTypeLabel || c?.course?.programType || c?.programType
                                                ])
                                        ].filter(([value]) => Boolean(value)
                                        )).entries()).map(([value, label]) => ({
                                            value,
                                            label: String(label || value)
                                        }))
                                    ]}
                                    onChange={val => setCreateForm({ ...createForm, programType: val, courseId: '', classId: '' })}
                                />
                            </div>
                            <div className="form-group-admin" style={{ flex: '1 1 calc(33.333% - 15px)', marginBottom: 0 }}>
                                <CustomSelect
                                    label="Course"
                                    icon="fa-solid fa-book"
                                    placeholder="Any Course"
                                    value={createForm.courseId}
                                    options={[
                                        { value: '', label: 'All Courses' },
                                        ...Array.from(new Map([
                                            ...courses
                                                .filter(c => isInSelectedDepartment(c.department, createForm.department))
                                                .filter(c => createForm.programType ? normalizeProgramType(c.programType) === createForm.programType : true)
                                                .map(c => [String(c._id), { value: c._id, label: c.name || c.code }]),
                                            ...classes
                                                .filter(c => isInSelectedDepartment(c.department, createForm.department))
                                                .filter(c => createForm.programType ? getClassProgramType(c) === createForm.programType : true)
                                                .map(c => c.course)
                                                .filter(Boolean)
                                                .map(c => [String(c._id), { value: c._id, label: c.name || c.code }])
                                        ]).values())
                                    ]}
                                    onChange={val => setCreateForm({ ...createForm, courseId: val, classId: '' })}
                                />
                            </div>
                            <div className="form-group-admin" style={{ flex: '1 1 calc(33.333% - 15px)', marginBottom: 0 }}>
                                <CustomSelect
                                    label="Assigned Class (Optional)"
                                    icon="fa-solid fa-chalkboard"
                                    placeholder="Select exact batch"
                                    value={createForm.classId}
                                    options={[
                                        { value: '', label: 'None' },
                                        ...classes
                                            .filter(c => {
                                                if (!isInSelectedDepartment(c.department, createForm.department)) return false;
                                                if (createForm.courseId) return String(c.course?._id) === String(createForm.courseId);
                                                if (createForm.programType) return getClassProgramType(c) === createForm.programType;
                                                return true;
                                            })
                                            .map(c => ({
                                                value: c._id,
                                                label: `${c.academicYear} - ${c.semesterOrYear} (${c.course?.name || c.name})`
                                            }))
                                    ]}
                                    onChange={val => setCreateForm({ ...createForm, classId: val })}
                                />
                            </div>
                        </div>
                    )}
                    <button type="submit" className="btn-create-user">
                        <i className="fa-solid fa-user-plus"></i> Create Account
                    </button>
                </form>
            </div>
        </div>
    );

    const renderDepartments = () => {
        const { level, dept, program, course } = deptDrill;

        const currentDept = departments.find(d => d.code === dept);
        const deptCourses = courses.filter(c => {
            const deptId = typeof c.department === 'object' ? c.department._id : c.department;
            return deptId === currentDept?._id;
        });
        const ugCourses = deptCourses.filter(c => c.programType === 'ug');
        const pgCourses = deptCourses.filter(c => c.programType === 'pg');

        const breadcrumbs = [{ label: 'Departments', onClick: () => { setDeptDrill({ level: 'list', dept: null, program: null, course: null }); setDeptSearch(''); setDeptYearFilter('all'); } }];
        if (dept) breadcrumbs.push({ label: currentDept?.name || dept, onClick: () => { setDeptDrill({ level: 'programs', dept, program: null, course: null }); setDeptSearch(''); setDeptYearFilter('all'); } });
        if (program) breadcrumbs.push({ label: program === 'ug' ? 'Undergraduate' : 'Postgraduate', onClick: () => { setDeptDrill({ ...deptDrill, level: 'courses', course: null }); setDeptSearch(''); setDeptYearFilter('all'); } });
        if (course) breadcrumbs.push({ label: courseLabels[course] || course });

        const BreadcrumbBar = () => (
            <div className="breadcrumbs">
                {breadcrumbs.map((b, i) => (
                    <span key={i}>
                        {b.onClick ? <button className="breadcrumb-link" onClick={b.onClick}>{b.label}</button> : <span className="breadcrumb-current">{b.label}</span>}
                        {i < breadcrumbs.length - 1 && <i className="fa-solid fa-chevron-right breadcrumb-sep"></i>}
                    </span>
                ))}
            </div>
        );

        // Level: Department list
        if (level === 'list') {
            return (
                <div className="admin-section">
                    <div className="section-header-row">
                        <h2 className="section-heading">Departments</h2>
                        <button className="btn-add" onClick={() => setShowModal('dept')}>
                            <i className="fa-solid fa-plus"></i> New Department
                        </button>
                    </div>
                    {departments.length === 0 ? (
                        <div className="empty-card">
                            <i className="fa-solid fa-building-columns"></i>
                            <h3>No departments yet</h3>
                            <p>Create your first department to get started.</p>
                        </div>
                    ) : (
                        <div className="dept-cards-grid">
                            {departments.map(d => (
                                <div key={d._id} className="dept-card">
                                    <div className="dept-card-clickable" onClick={() => setDeptDrill({ level: 'programs', dept: d.code, program: null, course: null })}>
                                        <div className="dept-card-icon" style={{ background: `${d.color}15`, color: d.color }}>
                                            <i className={`fa-solid ${d.icon}`}></i>
                                        </div>
                                        <div className="dept-card-info">
                                            <h3>{d.name}</h3>
                                            <p>{d.courseCount || 0} Courses · {d.studentCount || 0} Students</p>
                                        </div>
                                    </div>
                                    <button className="btn-action btn-delete dept-delete-btn" onClick={(e) => { e.stopPropagation(); handleDeleteDept(d._id, d.name); }} title="Delete">
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                    <i className="fa-solid fa-chevron-right dept-card-arrow"></i>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Level: UG / PG selection
        if (level === 'programs') {
            const ugCount = users.filter(u => u.department === dept && u.programType === 'ug' && u.role === 'student').length;
            const pgCount = users.filter(u => u.department === dept && u.programType === 'pg' && u.role === 'student').length;
            return (
                <div className="admin-section">
                    <BreadcrumbBar />
                    <h2 className="section-heading">{currentDept?.name}</h2>
                    <div className="program-cards">
                        <div className="program-card program-ug" onClick={() => setDeptDrill({ ...deptDrill, level: 'courses', program: 'ug' })}>
                            <div className="program-icon"><i className="fa-solid fa-graduation-cap"></i></div>
                            <h3>Undergraduate (UG)</h3>
                            <p>{ugCourses.length} Courses · {ugCount} Students</p>
                        </div>
                        <div className="program-card program-pg" onClick={() => setDeptDrill({ ...deptDrill, level: 'courses', program: 'pg' })}>
                            <div className="program-icon"><i className="fa-solid fa-user-graduate"></i></div>
                            <h3>Postgraduate (PG)</h3>
                            <p>{pgCourses.length} Courses · {pgCount} Students</p>
                        </div>
                    </div>
                </div>
            );
        }

        // Level: Courses list
        if (level === 'courses') {
            const filteredCourses = program === 'ug' ? ugCourses : pgCourses;
            return (
                <div className="admin-section">
                    <BreadcrumbBar />
                    <div className="section-header-row">
                        <h2 className="section-heading">{program === 'ug' ? 'Undergraduate' : 'Postgraduate'} Courses</h2>
                        <button className="btn-add" onClick={() => { setCourseForm({ name: '', code: '', department: currentDept?._id || '', programType: program, duration: program === 'pg' ? 2 : 3 }); setShowModal('course'); }}>
                            <i className="fa-solid fa-plus"></i> New Course
                        </button>
                    </div>
                    {filteredCourses.length === 0 ? (
                        <div className="empty-card">
                            <i className="fa-solid fa-book-open"></i>
                            <h3>No courses yet</h3>
                            <p>Create your first {program === 'ug' ? 'UG' : 'PG'} course.</p>
                        </div>
                    ) : (
                        <div className="course-cards-grid">
                            {filteredCourses.map(c => (
                                <div key={c._id} className="course-card">
                                    <div className="course-card-clickable" onClick={() => { setDeptDrill({ ...deptDrill, level: 'students', course: c.code }); setDeptSearch(''); setDeptYearFilter('all'); }}>
                                        <h4>{c.name}</h4>
                                        <span className="course-count">{users.filter(u => u.course === c.code && u.role === 'student').length} Students · {c.duration} yrs</span>
                                    </div>
                                    <button className="btn-action btn-delete" onClick={(e) => { e.stopPropagation(); handleDeleteCourse(c._id, c.name); }} title="Delete">
                                        <i className="fa-solid fa-trash"></i>
                                    </button>
                                    <i className="fa-solid fa-chevron-right course-arrow"></i>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            );
        }

        // Level: Students grouped by year
        if (level === 'students') {
            const currentCourse = courses.find(c => c.code === course);
            const duration = currentCourse?.duration || (program === 'pg' ? 2 : 3);
            const years = Array.from({ length: duration }, (_, i) => String(i + 1));

            let courseStudents = users.filter(u => u.course === course && u.role === 'student');
            if (deptSearch) {
                courseStudents = courseStudents.filter(u =>
                    `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(deptSearch.toLowerCase())
                );
            }
            if (deptYearFilter !== 'all') {
                courseStudents = courseStudents.filter(u => u.year === deptYearFilter);
            }
            return (
                <div className="admin-section">
                    <BreadcrumbBar />
                    <h2 className="section-heading">{courseLabels[course] || course}</h2>
                    <div className="users-toolbar">
                        <div className="search-box">
                            <i className="fa-solid fa-magnifying-glass"></i>
                            <input type="text" placeholder="Search students..." value={deptSearch} onChange={e => setDeptSearch(e.target.value)} />
                        </div>
                        <div className="filter-group">
                            <button className={`filter-btn ${deptYearFilter === 'all' ? 'active' : ''}`} onClick={() => setDeptYearFilter('all')}>All Years</button>
                            {years.map(y => (
                                <button key={y} className={`filter-btn ${deptYearFilter === y ? 'active' : ''}`} onClick={() => setDeptYearFilter(y)}>Year {y}</button>
                            ))}
                        </div>
                    </div>
                    {deptSearch && courseStudents.length === 0 ? (
                        <div className="empty-card">
                            <i className="fa-solid fa-user-slash"></i>
                            <h3>No results</h3>
                            <p>No students match your search.</p>
                        </div>
                    ) : (
                        deptYearFilter === 'all' ? (
                            years.map(y => {
                                const yearStudents = courseStudents.filter(u => u.year === y);
                                const shortName = (courseLabels[course] || course).split(' ').pop();
                                const yearLabel = y === '1' ? '1st' : y === '2' ? '2nd' : y === '3' ? '3rd' : '4th';
                                return (
                                    <div key={y} className="year-group">
                                        <h3 className="year-heading">
                                            {shortName} {yearLabel} Year
                                            <span className="year-count">{yearStudents.length} students</span>
                                        </h3>
                                        {yearStudents.length === 0 ? (
                                            <div className="year-empty">No students enrolled</div>
                                        ) : (
                                            <div className="users-table-wrapper">
                                                <table className="users-table">
                                                    <thead><tr><th>Name</th><th>Email</th><th>Status</th><th>Actions</th></tr></thead>
                                                    <tbody>
                                                        {yearStudents.map(u => (
                                                            <tr key={u._id}>
                                                                <td className="user-name-cell">{u.firstName} {u.lastName}</td>
                                                                <td className="user-email-cell">{u.email}</td>
                                                                <td>{renderStatusBadge(u.status)}</td>
                                                                <td className="actions-cell">
                                                                    {u.status === 'pending' && (
                                                                        <>
                                                                            <button className="btn-action btn-approve" onClick={() => handleApprove(u._id)}><i className="fa-solid fa-check"></i></button>
                                                                            <button className="btn-action btn-reject" onClick={() => handleReject(u._id)}><i className="fa-solid fa-xmark"></i></button>
                                                                        </>
                                                                    )}
                                                                    <button className="btn-action btn-delete" onClick={() => handleDelete(u._id, `${u.firstName} ${u.lastName}`)}><i className="fa-solid fa-trash"></i></button>
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
                            <div className="users-table-wrapper">
                                <table className="users-table">
                                    <thead><tr><th>Name</th><th>Email</th><th>Year</th><th>Status</th><th>Actions</th></tr></thead>
                                    <tbody>
                                        {courseStudents.map(u => (
                                            <tr key={u._id}>
                                                <td className="user-name-cell">{u.firstName} {u.lastName}</td>
                                                <td className="user-email-cell">{u.email}</td>
                                                <td>Year {u.year}</td>
                                                <td>{renderStatusBadge(u.status)}</td>
                                                <td className="actions-cell">
                                                    {u.status === 'pending' && (
                                                        <>
                                                            <button className="btn-action btn-approve" onClick={() => handleApprove(u._id)}><i className="fa-solid fa-check"></i></button>
                                                            <button className="btn-action btn-reject" onClick={() => handleReject(u._id)}><i className="fa-solid fa-xmark"></i></button>
                                                        </>
                                                    )}
                                                    <button className="btn-action btn-delete" onClick={() => handleDelete(u._id, `${u.firstName} ${u.lastName}`)}><i className="fa-solid fa-trash"></i></button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )
                    )}
                </div>
            );
        }
    };

    const renderContent = () => {
        switch (activeSection) {
            case 'dashboard': return renderDashboard();
            case 'departments': return renderDepartments();
            case 'users': return renderUsers();
            case 'pending': return renderPending();
            case 'create': return renderCreate();
            case 'leave': return renderLeaves();
            default: return renderDashboard();
        }
    };

    return (
        <div className="admin-layout">
            {/* Sidebar */}
            <aside className={`admin-sidebar ${sidebarCollapsed ? 'collapsed' : ''}`}>
                <div className="sidebar-header">
                    <div className="sidebar-logo">
                        <i className="fa-solid fa-shield-halved"></i>
                        {!sidebarCollapsed && <span>Parker Admin</span>}
                    </div>
                    <button className="sidebar-toggle" onClick={() => setSidebarCollapsed(!sidebarCollapsed)}>
                        <i className={`fa-solid ${sidebarCollapsed ? 'fa-angles-right' : 'fa-angles-left'}`}></i>
                    </button>
                </div>

                <nav className="sidebar-nav">
                    <button className="nav-item back-to-site" onClick={() => navigate('/')} title={sidebarCollapsed ? 'Back to Site' : ''}>
                        <i className="fa-solid fa-arrow-left"></i>
                        {!sidebarCollapsed && <span>Back to Site</span>}
                    </button>
                    <div className="nav-divider"></div>
                    {navItems.map(item => (
                        <button
                            key={item.id}
                            className={`nav-item ${activeSection === item.id ? 'active' : ''}`}
                            onClick={() => setActiveSection(item.id)}
                            title={sidebarCollapsed ? item.label : ''}
                        >
                            <i className={`fa-solid ${item.icon}`}></i>
                            {!sidebarCollapsed && <span>{item.label}</span>}
                            {item.badge > 0 && <span className="nav-badge">{item.badge}</span>}
                        </button>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="nav-item logout-btn" onClick={handleLogout}>
                        <i className="fa-solid fa-right-from-bracket"></i>
                        {!sidebarCollapsed && <span>Logout</span>}
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <main className="admin-main">
                <header className="admin-topbar">
                    <div className="topbar-left">
                        <h1 className="topbar-title">{navItems.find(n => n.id === activeSection)?.label || 'Dashboard'}</h1>
                    </div>
                    <div className="topbar-right">
                        <div className="admin-profile" onClick={() => setShowProfileMenu(!showProfileMenu)}>
                            <div className="admin-avatar">{user.firstName?.[0] || 'A'}</div>
                            <div className="admin-info">
                                <span className="admin-name">{user.firstName} {user.lastName}</span>
                                <i className={`fa-solid fa-chevron-${showProfileMenu ? 'up' : 'down'}`} style={{ color: '#ffffff', fontSize: '12px', marginLeft: '4px' }}></i>
                                <span className="admin-role">Administrator</span>
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

            {/* Toast */}
            {showToast && (
                <div className={`admin-toast ${toastMsg.type === 'error' ? 'toast-error' : ''}`}>
                    <div className="toast-icon">
                        <i className={`fa-solid ${toastMsg.type === 'error' ? 'fa-circle-exclamation' : 'fa-circle-check'}`}></i>
                    </div>
                    <div className="toast-body">
                        <p className="toast-title">{toastMsg.title}</p>
                        <p className="toast-msg">{toastMsg.message}</p>
                    </div>
                    <button className="toast-close" onClick={() => setShowToast(false)}>
                        <i className="fa-solid fa-xmark"></i>
                    </button>
                </div>
            )}

            {/* Create Department Modal */}
            {showModal === 'dept' && (
                <div className="modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Department</h3>
                            <button className="modal-close" onClick={() => setShowModal(null)}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onSubmit={handleCreateDept}>
                            <div className="form-group-admin">
                                <label>Department Name</label>
                                <input type="text" placeholder="e.g. Computer Science" value={deptForm.name} onChange={e => setDeptForm({ ...deptForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group-admin">
                                <label>Code (short, lowercase)</label>
                                <input type="text" placeholder="e.g. cs" value={deptForm.code} onChange={e => setDeptForm({ ...deptForm, code: e.target.value.toLowerCase().replace(/\s/g, '-') })} required />
                            </div>
                            <div className="form-row-admin">
                                <div className="form-group-admin">
                                    <label>Icon</label>
                                    <div className="icon-picker">
                                        {[
                                            { icon: 'fa-laptop-code', label: 'Tech' },
                                            { icon: 'fa-building-columns', label: 'General' },
                                            { icon: 'fa-flask', label: 'Science' },
                                            { icon: 'fa-calculator', label: 'Math' },
                                            { icon: 'fa-palette', label: 'Arts' },
                                            { icon: 'fa-briefcase', label: 'Business' },
                                            { icon: 'fa-gears', label: 'Engineering' },
                                            { icon: 'fa-stethoscope', label: 'Medical' },
                                            { icon: 'fa-scale-balanced', label: 'Law' },
                                            { icon: 'fa-book', label: 'Literature' },
                                            { icon: 'fa-earth-americas', label: 'Geo' },
                                            { icon: 'fa-music', label: 'Music' },
                                        ].map(item => (
                                            <button
                                                key={item.icon}
                                                type="button"
                                                className={`icon-pick-btn ${deptForm.icon === item.icon ? 'selected' : ''}`}
                                                onClick={() => setDeptForm({ ...deptForm, icon: item.icon })}
                                                title={item.label}
                                                style={deptForm.icon === item.icon ? { borderColor: deptForm.color, background: `${deptForm.color}12` } : {}}
                                            >
                                                <i className={`fa-solid ${item.icon}`} style={deptForm.icon === item.icon ? { color: deptForm.color } : {}}></i>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                                <div className="form-group-admin">
                                    <label>Color</label>
                                    <input type="color" value={deptForm.color} onChange={e => setDeptForm({ ...deptForm, color: e.target.value })} />
                                </div>
                            </div>
                            <button type="submit" className="btn-create-user"><i className="fa-solid fa-plus"></i> Create Department</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Create Course Modal */}
            {showModal === 'course' && (
                <div className="modal-overlay" onClick={() => setShowModal(null)}>
                    <div className="modal-card" onClick={e => e.stopPropagation()}>
                        <div className="modal-header">
                            <h3>Create New Course</h3>
                            <button className="modal-close" onClick={() => setShowModal(null)}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <form onSubmit={handleCreateCourse}>
                            <div className="form-group-admin">
                                <label>Course Name</label>
                                <input type="text" placeholder="e.g. BCA" value={courseForm.name} onChange={e => setCourseForm({ ...courseForm, name: e.target.value })} required />
                            </div>
                            <div className="form-group-admin">
                                <label>Code (optional, short form)</label>
                                <input type="text" placeholder="e.g. bca" value={courseForm.code} onChange={e => setCourseForm({ ...courseForm, code: e.target.value.toLowerCase().replace(/\s/g, '-') })} />
                            </div>
                            <div className="form-row-admin">
                                <div className="form-group-admin">
                                    <label>Program Type</label>
                                    <select value={courseForm.programType} onChange={e => setCourseForm({ ...courseForm, programType: e.target.value, duration: e.target.value === 'pg' ? 2 : 3 })}>
                                        <option value="ug">Undergraduate (UG)</option>
                                        <option value="pg">Postgraduate (PG)</option>
                                    </select>
                                </div>
                                <div className="form-group-admin">
                                    <label>Duration (years)</label>
                                    <input type="number" min="1" max="6" value={courseForm.duration} onChange={e => setCourseForm({ ...courseForm, duration: parseInt(e.target.value) })} required />
                                </div>
                            </div>
                            <button type="submit" className="btn-create-user"><i className="fa-solid fa-plus"></i> Create Course</button>
                        </form>
                    </div>
                </div>
            )}

            {/* Confirmation Modal */}
            {confirmDialog.isOpen && (
                <div className="modal-overlay">
                    <div className="modal-content confirm-modal">
                        <div className="modal-header">
                            <h3>{confirmDialog.title}</h3>
                            <button className="modal-close" onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}><i className="fa-solid fa-xmark"></i></button>
                        </div>
                        <div className="modal-body" style={{ padding: '24px' }}>
                            <p style={{ margin: '0 0 24px 0', color: '#4b5563', fontSize: '1rem' }}>{confirmDialog.message}</p>
                            <div className="confirm-actions" style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
                                <button className="btn-cancel" onClick={() => setConfirmDialog({ isOpen: false, title: '', message: '', onConfirm: null })}>Cancel</button>
                                <button className="btn-confirm-delete" onClick={confirmDialog.onConfirm} style={{ background: '#ef4444', color: 'white', padding: '8px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontWeight: '500' }}>Delete</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default AdminDashboard;
