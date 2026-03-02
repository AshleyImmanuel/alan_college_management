import React, { useEffect, useRef, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import AboutPage from './pages/AboutPage';
import ComputerSciencePage from './pages/ComputerSciencePage';
import BusinessAdministrationPage from './pages/BusinessAdministrationPage';
import EngineeringPage from './pages/EngineeringPage';
import ArtsHumanitiesPage from './pages/ArtsHumanitiesPage';
import LifeAtParkerPage from './pages/LifeAtParkerPage';
import EnrollNowPage from './pages/EnrollNowPage';
import LoginPage from './pages/LoginPage';
import TermsPage from './pages/TermsPage';
import AdminDashboard from './pages/AdminDashboard';
import HodDashboard from './pages/HodDashboard';
import FacultyDashboard from './pages/FacultyDashboard';
import StudentDashboard from './pages/StudentDashboard';
import { getCurrentUser } from './components/authClient';
import './App.css';

const INTRO_DURATION_MS = 1800;
const INTRO_FADE_MS = 280;

function DashboardRedirect() {
  const [authState, setAuthState] = useState({ loading: true, user: null });

  useEffect(() => {
    let mounted = true;
    getCurrentUser()
      .then((user) => {
        if (mounted) setAuthState({ loading: false, user });
      })
      .catch(() => {
        if (mounted) setAuthState({ loading: false, user: null });
      });

    return () => {
      mounted = false;
    };
  }, []);

  if (authState.loading) {
    return null;
  }

  const user = authState.user;
  if (!user) return <Navigate to="/login" replace />;
  if (user.role === 'admin') return <Navigate to="/admin" replace />;
  if (user.role === 'hod') return <Navigate to="/hod" replace />;
  if (user.role === 'faculty') return <Navigate to="/faculty" replace />;
  if (user.role === 'student') return <Navigate to="/student" replace />;

  return <Navigate to="/login" replace />;
}

function AppShell() {
  const location = useLocation();
  const [showIntro, setShowIntro] = useState(location.pathname === '/');
  const [introClosing, setIntroClosing] = useState(false);
  const skipTimerRef = useRef(null);

  useEffect(() => {
    if (location.pathname === '/') {
      setShowIntro(true);
      setIntroClosing(false);
      return;
    }

    setShowIntro(false);
    setIntroClosing(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!showIntro || location.pathname !== '/') return undefined;

    let closeTimer = null;
    let hideTimer = null;

    try {
      const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const total = prefersReducedMotion ? 450 : INTRO_DURATION_MS;
      const fadeLead = prefersReducedMotion ? 120 : INTRO_FADE_MS;

      closeTimer = window.setTimeout(() => setIntroClosing(true), Math.max(total - fadeLead, 0));
      hideTimer = window.setTimeout(() => setShowIntro(false), total);
    } catch {
      closeTimer = window.setTimeout(() => setIntroClosing(true), INTRO_DURATION_MS - INTRO_FADE_MS);
      hideTimer = window.setTimeout(() => setShowIntro(false), INTRO_DURATION_MS);
    }

    document.body.classList.add('intro-active');

    return () => {
      if (closeTimer) window.clearTimeout(closeTimer);
      if (hideTimer) window.clearTimeout(hideTimer);
      document.body.classList.remove('intro-active');
    };
  }, [showIntro, location.pathname]);

  useEffect(() => {
    return () => {
      if (skipTimerRef.current) {
        window.clearTimeout(skipTimerRef.current);
      }
    };
  }, []);

  const handleSkipIntro = () => {
    setIntroClosing(true);

    if (skipTimerRef.current) {
      window.clearTimeout(skipTimerRef.current);
    }

    skipTimerRef.current = window.setTimeout(() => setShowIntro(false), 180);
  };

  return (
    <div className="App">
      {showIntro && location.pathname === '/' ? (
        <div className={`intro-overlay${introClosing ? ' intro-overlay--closing' : ''}`} role="presentation">
          <div className="intro-container">
            <div className="intro-shell">
              <div className="intro-logo-stage">
                <div className="intro-logo-core">
                  <img src="/logo.png" alt="Parker University logo" className="intro-logo" />
                </div>
              </div>
              <p className="intro-kicker">Parker University Presents</p>
              <h1 className="intro-title">
                <span className="intro-title-line">Parker University</span>
              </h1>
              <p className="intro-tagline">Knowledge. Character. Leadership.</p>
            </div>
          </div>
          <button type="button" className="intro-skip-btn" onClick={handleSkipIntro}>
            Skip Intro
          </button>
        </div>
      ) : null}

      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/about" element={<AboutPage />} />
        <Route path="/academics/computer-science" element={<ComputerSciencePage />} />
        <Route path="/academics/business-administration" element={<BusinessAdministrationPage />} />
        <Route path="/academics/engineering" element={<EngineeringPage />} />
        <Route path="/academics/arts-humanities" element={<ArtsHumanitiesPage />} />
        <Route path="/life-at-parker" element={<LifeAtParkerPage />} />
        <Route path="/enquiry-contact" element={<EnrollNowPage />} />
        <Route path="/enroll" element={<Navigate to="/enquiry-contact" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
        <Route path="/hod" element={<HodDashboard />} />
        <Route path="/faculty" element={<FacultyDashboard />} />
        <Route path="/student" element={<StudentDashboard />} />
        <Route path="/dashboard" element={<DashboardRedirect />} />
        <Route path="/dashboard/*" element={<DashboardRedirect />} />
        <Route path="dashboard" element={<DashboardRedirect />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppShell />
    </Router>
  );
}

export default App;
