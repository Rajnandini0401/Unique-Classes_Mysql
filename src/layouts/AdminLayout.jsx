import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from '../components/admin/AdminSidebar';
import AdminHeader from '../components/admin/AdminHeader';

import '../styles/admin/admin-layout.css';

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    navigate('/login');
  };

  return (
    <div className="admin-layout">
      {/* Semi-transparent Mobile Drawer Overlay */}
      {sidebarOpen && (
        <div
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
          aria-label="Close Mobile Sidebar"
        />
      )}

      {/* Fixed Desktop Sidebar / Off-Canvas Mobile Drawer */}
      <AdminSidebar
        isOpen={sidebarOpen}
        onCloseSidebar={() => setSidebarOpen(false)}
        onLogout={handleLogout}
      />

      {/* Right Viewport Main Wrapper */}
      <div className="admin-main-wrapper">
        {/* Fixed Top Header */}
        <AdminHeader
          onToggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          onLogout={handleLogout}
        />

        {/* Vertically Scrollable Main Content Area */}
        <main className="admin-content-body">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
