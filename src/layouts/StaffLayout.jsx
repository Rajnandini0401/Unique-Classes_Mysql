import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import StaffSidebar from '../components/staff/StaffSidebar';
import StaffHeader from '../components/staff/StaffHeader';
import '../styles/teacher/teacher-layout.css';

const StaffLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useContext(AuthContext) || {};

  const handleLogout = () => {
    if (logout) logout();
    localStorage.removeItem('staffToken');
    localStorage.removeItem('staffUser');
    navigate('/login');
  };

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
      <StaffSidebar
        isOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Main Viewport Column Container */}
      <div className="teacher-main-viewport">
        {/* Top Fixed Staff Header */}
        <StaffHeader
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

export default StaffLayout;
