import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getCurrentUser, logoutUser } from './authClient';

const Header = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [dropdownOpen, setDropdownOpen] = useState(false);
    const dropdownRef = useRef(null);

    useEffect(() => {
        let mounted = true;
        const syncUser = async () => {
            const currentUser = await getCurrentUser();
            if (mounted) setUser(currentUser);
        };

        syncUser();
        window.addEventListener('auth-changed', syncUser);
        return () => {
            mounted = false;
            window.removeEventListener('auth-changed', syncUser);
        };
    }, []);

    // Close dropdown on outside click
    useEffect(() => {
        const handleClick = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) setDropdownOpen(false);
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, []);

    const handleLogout = async () => {
        await logoutUser();
        setUser(null);
        setDropdownOpen(false);
        window.dispatchEvent(new Event('auth-changed'));
        navigate('/login');
    };

    return (
        <header className="main-header">
            <div className="container header-inner">
                <Link to="/" className="logo">
                    <img src="/logo.png" alt="Parker University Logo" />
                </Link>
                <nav className="main-nav">
                    <ul>
                        <li><Link to="/">Home</Link></li>
                        <li><Link to="/about">About</Link></li>
                        <li className="dropdown">
                            <Link to="/about">Academics <i className="fa-solid fa-chevron-down"
                                style={{ fontSize: "10px", marginLeft: "5px" }}></i></Link>
                            <ul className="dropdown-menu">
                                <li><Link to="/academics/computer-science">Computer Science</Link></li>
                                <li><Link to="/academics/business-administration">Business Administration</Link></li>
                                <li><Link to="/academics/engineering">Engineering</Link></li>
                                <li><Link to="/academics/arts-humanities">Arts &amp; Humanities</Link></li>
                            </ul>
                        </li>
                        <li><Link to="/life-at-parker">Life at Parker</Link></li>
                    </ul>
                </nav>
                <div className="header-actions">
                    <Link to="/enquiry-contact" className="btn btn-primary">Enquiry Contact</Link>
                    {user ? (
                        <div className="header-profile" ref={dropdownRef}>
                            <button className="profile-btn" onClick={() => setDropdownOpen(!dropdownOpen)}>
                                <span className="profile-initials">{user.firstName?.[0]}{user.lastName?.[0]}</span>
                                <span className="profile-name">{user.firstName}</span>
                                <i className={`fa-solid fa-chevron-${dropdownOpen ? 'up' : 'down'}`} style={{ fontSize: '10px' }}></i>
                            </button>
                            {dropdownOpen && (
                                <div className="profile-dropdown">
                                    <div className="profile-dropdown-header">
                                        <span className="profile-dropdown-name">{user.firstName} {user.lastName}</span>
                                        <span className="profile-dropdown-email">{user.email}</span>
                                    </div>
                                    <div className="profile-dropdown-divider"></div>
                                    <button className="profile-dropdown-item" onClick={() => {
                                        if (user.role === 'admin') navigate('/admin');
                                        else if (user.role === 'hod') navigate('/hod');
                                        else if (user.role === 'faculty') navigate('/faculty');
                                        else if (user.role === 'student') navigate('/student');
                                        else navigate('/dashboard');
                                        setDropdownOpen(false);
                                    }}>
                                        <i className="fa-solid fa-chart-line"></i> Dashboard
                                    </button>
                                    <button className="profile-dropdown-item logout-item" onClick={handleLogout}>
                                        <i className="fa-solid fa-right-from-bracket"></i> Logout
                                    </button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <Link to="/login" className="btn btn-login">Login</Link>
                    )}
                </div>
            </div>
        </header>
    );
};

export default Header;
