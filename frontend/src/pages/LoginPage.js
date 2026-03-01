import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import Footer from '../components/Footer';
import './LoginPage.css';
import CustomSelect from '../components/CustomSelect';
import { authFetch, notifyAuthChanged, markAuthActive } from '../components/authClient';

const LoginPage = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();
    const [isLogin, setIsLogin] = useState(searchParams.get('tab') !== 'register');

    const switchTab = (login) => {
        setIsLogin(login);
        setSearchParams(login ? {} : { tab: 'register' }, { replace: true });
    };

    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

    const [selectedDept, setSelectedDept] = useState(null);
    const [selectedProgram, setSelectedProgram] = useState(null);
    const [selectedYear, setSelectedYear] = useState(null);
    const [selectedCourse, setSelectedCourse] = useState(null);
    const [showLoginPw, setShowLoginPw] = useState(false);
    const [showRegPw, setShowRegPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMsg, setToastMsg] = useState({ title: '', message: '', type: 'success' });
    const [loading, setLoading] = useState(false);
    const [apiDepts, setApiDepts] = useState([]);
    const [apiCourses, setApiCourses] = useState([]);

    useEffect(() => {
        authFetch('/api/admin/public/departments').then(r => r.json()).then(setApiDepts).catch(() => { });
        authFetch('/api/admin/public/courses').then(r => r.json()).then(setApiCourses).catch(() => { });
    }, []);

    const showToastMessage = (title, message, type = 'success') => {
        setToastMsg({ title, message, type });
        setShowToast(true);
        setTimeout(() => setShowToast(false), 5000);
    };

    const handleRegister = async (e) => {
        e.preventDefault();
        const form = e.target;
        const password = form.querySelector('#reg-password').value;
        const confirm = form.querySelector('#reg-confirm').value;

        if (password !== confirm) {
            showToastMessage('Password Mismatch', 'Passwords do not match. Please try again.', 'error');
            return;
        }

        setLoading(true);
        try {
            const res = await authFetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    firstName: form.querySelector('#reg-first').value,
                    lastName: form.querySelector('#reg-last').value,
                    email: form.querySelector('#reg-email').value,
                    password,
                    programType: selectedProgram,
                    department: selectedDept,
                    course: selectedCourse,
                    year: selectedYear,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                showToastMessage('Registration Request Sent!', data.message, 'success');
                form.reset();
            } else {
                showToastMessage('Registration Failed', data.message, 'error');
            }
        } catch (err) {
            showToastMessage('Connection Error', 'Could not reach the server. Make sure the backend is running.', 'error');
        }
        setLoading(false);
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        const form = e.target;
        setLoading(true);
        try {
            const res = await authFetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    email: form.querySelector('#login-email').value.trim().toLowerCase(),
                    password: form.querySelector('#login-password').value,
                }),
            });
            const data = await res.json();
            if (res.ok) {
                markAuthActive();
                notifyAuthChanged();
                showToastMessage('Login Successful!', `Welcome back, ${data.user.firstName}!`, 'success');
                if (data.user.role === 'admin') {
                    setTimeout(() => navigate('/admin'), 1000);
                } else if (data.user.role === 'hod') {
                    setTimeout(() => navigate('/hod'), 1000);
                } else if (data.user.role === 'faculty') {
                    setTimeout(() => navigate('/faculty'), 1000);
                } else if (data.user.role === 'student') {
                    setTimeout(() => navigate('/student'), 1000);
                }
            } else {
                showToastMessage('Login Failed', data.message, 'error');
            }
        } catch (err) {
            showToastMessage('Connection Error', 'Could not reach the server. Make sure the backend is running.', 'error');
        }
        setLoading(false);
    };

    const deptOptions = apiDepts.map(d => ({ value: d.code, label: d.name }));
    const filteredCourseOptions = apiCourses
        .filter(c => {
            if (!selectedDept) return false;
            const dept = apiDepts.find(d => d.code === selectedDept);
            const deptId = typeof c.department === 'object' ? c.department._id : c.department;
            return deptId === dept?._id;
        })
        .filter(c => !selectedProgram || c.programType === selectedProgram)
        .map(c => ({ value: c.code, label: c.name }));

    return (
        <div className="login-page-wrapper">
            <Header />

            <div className="login-hero">
                <div className="login-hero-overlay"></div>
                <div className="login-hero-content">
                    <h1>{isLogin ? 'Welcome Back' : 'Create Account'}</h1>
                    <p>{isLogin ? 'Sign in to access your Parker University portal.' : 'Join Parker University and start your academic journey.'}</p>
                </div>
            </div>

            <main className="login-main">
                <div className="container">
                    <div className="login-card">
                        {/* Toggle Tabs */}
                        <div className="login-tabs">
                            <button
                                className={`tab-btn ${isLogin ? 'active' : ''}`}
                                onClick={() => switchTab(true)}
                            >
                                Sign In
                            </button>
                            <button
                                className={`tab-btn ${!isLogin ? 'active' : ''}`}
                                onClick={() => switchTab(false)}
                            >
                                Register
                            </button>
                        </div>

                        {/* Login Form */}
                        {isLogin ? (
                            <form className="login-form" onSubmit={handleLogin}>
                                <div className="form-group">
                                    <label htmlFor="login-email">Email Address</label>
                                    <div className="input-wrapper">
                                        <i className="fa-solid fa-envelope"></i>
                                        <input type="email" id="login-email" placeholder="you@parker.edu" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="login-password">Password</label>
                                    <div className="input-wrapper">
                                        <i className="fa-solid fa-lock"></i>
                                        <input type={showLoginPw ? 'text' : 'password'} id="login-password" placeholder="Enter your password" />
                                        <button type="button" className="pw-toggle" onClick={() => setShowLoginPw(!showLoginPw)}>
                                            <i className={`fa-solid ${showLoginPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="form-options">
                                    <label className="remember-me">
                                        <input type="checkbox" /> Remember me
                                    </label>
                                    <a href="#forgot" className="forgot-link">Forgot password?</a>
                                </div>
                                <button type="submit" className="btn-submit">Sign In</button>
                            </form>
                        ) : (
                            <form className="login-form" onSubmit={handleRegister}>
                                <div className="form-row">
                                    <div className="form-group">
                                        <label htmlFor="reg-first">First Name</label>
                                        <div className="input-wrapper">
                                            <i className="fa-solid fa-user"></i>
                                            <input type="text" id="reg-first" placeholder="First name" />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="reg-last">Last Name</label>
                                        <div className="input-wrapper">
                                            <i className="fa-solid fa-user"></i>
                                            <input type="text" id="reg-last" placeholder="Last name" />
                                        </div>
                                    </div>
                                </div>
                                <CustomSelect
                                    label="Program Type"
                                    icon="fa-solid fa-graduation-cap"
                                    placeholder="Select UG or PG"
                                    id="reg-program"
                                    value={selectedProgram}
                                    options={[
                                        { value: 'ug', label: 'Undergraduate (UG)' },
                                        { value: 'pg', label: 'Postgraduate (PG)' },
                                    ]}
                                    onChange={(val) => setSelectedProgram(val)}
                                />
                                <div className="form-row">
                                    <CustomSelect
                                        label="Department"
                                        icon="fa-solid fa-book"
                                        placeholder="Select department"
                                        id="reg-dept"
                                        value={selectedDept}
                                        options={deptOptions}
                                        onChange={(val) => setSelectedDept(val)}
                                    />
                                    <CustomSelect
                                        label="Year"
                                        icon="fa-solid fa-calendar"
                                        placeholder="Select year"
                                        id="reg-year"
                                        value={selectedYear}
                                        options={[
                                            { value: '1', label: '1st Year' },
                                            { value: '2', label: '2nd Year' },
                                            { value: '3', label: '3rd Year' },
                                            { value: '4', label: '4th Year' },
                                        ]}
                                        onChange={(val) => setSelectedYear(val)}
                                    />
                                </div>
                                <CustomSelect
                                    label="Course"
                                    icon="fa-solid fa-chalkboard"
                                    placeholder={selectedDept ? "Select course" : "Select a department first"}
                                    id="reg-course"
                                    value={selectedCourse}
                                    options={filteredCourseOptions}
                                    onChange={(val) => setSelectedCourse(val)}
                                />
                                <div className="form-group">
                                    <label htmlFor="reg-email">Email Address</label>
                                    <div className="input-wrapper">
                                        <i className="fa-solid fa-envelope"></i>
                                        <input type="email" id="reg-email" placeholder="you@parker.edu" />
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="reg-password">Password</label>
                                    <div className="input-wrapper">
                                        <i className="fa-solid fa-lock"></i>
                                        <input type={showRegPw ? 'text' : 'password'} id="reg-password" placeholder="Create a password" />
                                        <button type="button" className="pw-toggle" onClick={() => setShowRegPw(!showRegPw)}>
                                            <i className={`fa-solid ${showRegPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="form-group">
                                    <label htmlFor="reg-confirm">Confirm Password</label>
                                    <div className="input-wrapper">
                                        <i className="fa-solid fa-lock"></i>
                                        <input type={showConfirmPw ? 'text' : 'password'} id="reg-confirm" placeholder="Confirm your password" />
                                        <button type="button" className="pw-toggle" onClick={() => setShowConfirmPw(!showConfirmPw)}>
                                            <i className={`fa-solid ${showConfirmPw ? 'fa-eye-slash' : 'fa-eye'}`}></i>
                                        </button>
                                    </div>
                                </div>
                                <div className="form-options">
                                    <label className="remember-me">
                                        <input type="checkbox" /> I agree to the <a href="/terms" target="_blank" rel="noopener noreferrer">Terms &amp; Conditions</a>
                                    </label>
                                </div>
                                <button type="submit" className="btn-submit">Create Account</button>
                            </form>
                        )}
                    </div>
                </div>
            </main>

            <Footer />

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

export default LoginPage;
