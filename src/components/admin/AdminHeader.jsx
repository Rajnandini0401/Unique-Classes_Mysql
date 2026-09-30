import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, Settings, LogOut } from 'lucide-react';

const AdminHeader = ({ onToggleSidebar, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const location = useLocation();

  const getPageTitle = () => {
    if (location.pathname === '/admin/new-admission') return 'New Admission';
    if (location.pathname === '/admin/students') return 'All Students';
    if (location.pathname === '/admin/teachers') return 'Teachers';
    if (location.pathname === '/admin/staff') return 'Office Staff';
    if (location.pathname === '/admin/courses') return 'Courses';
    if (location.pathname === '/admin/batches') return 'Batches';
    if (location.pathname === '/admin/attendance') return 'Attendance';
    if (location.pathname === '/admin/results') return 'Marks & Results';
    if (location.pathname === '/admin/fees') return 'Fees';
    if (location.pathname === '/admin/announcements') return 'Announcements';
    if (location.pathname === '/admin/gallery') return 'Gallery';
    return 'Dashboard';
  };

  return (
    <header className="admin-header">
      {/* Left Title & Mobile Sidebar Toggle */}
      <div className="header-left">
        <button
          className="sidebar-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Sidebar Navigation"
        >
          <Menu size={20} />
        </button>
        <h1 className="header-page-title">{getPageTitle()}</h1>
      </div>

      {/* Right Notifications & Admin Profile */}
      <div className="header-right">
        <button className="notification-btn" aria-label="Notifications">
          <Bell size={18} />
          <span className="notification-badge-dot" />
        </button>

        {/* Profile Avatar & Dropdown */}
        <div
          className="profile-wrapper"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <div className="profile-avatar">A</div>
          <span className="profile-name">Admin</span>
          <ChevronDown size={16} color="#656565" />

          {/* Profile Dropdown Menu UI Stub */}
          {dropdownOpen && (
            <div className="dropdown-menu-stub" onClick={(e) => e.stopPropagation()}>
              <div className="dropdown-item flex-center flex-gap-sm" style={{ justifyContent: 'flex-start' }}>
                <User size={14} /> My Profile
              </div>
              <div className="dropdown-item flex-center flex-gap-sm" style={{ justifyContent: 'flex-start' }}>
                <Settings size={14} /> Settings
              </div>
              <div
                className="dropdown-item flex-center flex-gap-sm"
                style={{ justifyContent: 'flex-start', color: '#EF4444' }}
                onClick={() => {
                  setDropdownOpen(false);
                  onLogout && onLogout();
                }}
              >
                <LogOut size={14} /> Logout
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default AdminHeader;
