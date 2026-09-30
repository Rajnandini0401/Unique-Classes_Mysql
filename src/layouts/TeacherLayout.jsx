import React, { useState, useContext } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import TeacherSidebar from '../components/teacher/TeacherSidebar';
import TeacherHeader from '../components/teacher/TeacherHeader';
import { AuthContext } from '../context/AuthContext';
import '../styles/teacher/teacher-layout.css';

const TeacherLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { user, teacherProfile, loading, logout } = useContext(AuthContext) || {};

  const handleLogout = () => {
    if (logout) {
      logout();
    } else {
      localStorage.removeItem('token');
      localStorage.removeItem('teacherToken');
      localStorage.removeItem('teacherId');
    }
    navigate('/login', { replace: true });
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh', background: '#0a0a0c', color: 'var(--color-champagne-gold)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="spinner" style={{ margin: '0 auto 1rem auto', width: '36px', height: '36px', border: '3px solid rgba(212,175,55,0.2)', borderTopColor: 'var(--color-metallic-gold)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p style={{ fontSize: '0.9rem', color: 'var(--text-light-muted)' }}>Verifying session...</p>
        </div>
      </div>
    );
  }

  const token = localStorage.getItem('token');
  const isTeacherUser = Boolean(user && user.role === 'teacher');
  const hasProfile = Boolean(teacherProfile && teacherProfile.id);

  if (!token || !user || !isTeacherUser || !hasProfile) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="teacher-layout">
      {/* Mobile Drawer Overlay Backdrop */}
      {sidebarOpen && (
        <div
          className="teacher-sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close Mobile Sidebar Drawer"
        />
      )}

      {/* Fixed Desktop Sidebar / Off-Canvas Mobile Drawer */}
      <TeacherSidebar
        isOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Viewport Column Container */}
      <div className="teacher-main-viewport">
        {/* Top Fixed Teacher Header */}
        <TeacherHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        {/* Independently Scrollable Main Content Body */}
        <main className="teacher-content-scrollable">
          <div className="teacher-content-inner">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default TeacherLayout;
