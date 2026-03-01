import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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

function App() {
  return (
    <Router>
      <div className="App">
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
    </Router>
  );
}

export default App;
