import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { getPhotoUrl } from '../../utils/photoUtils';
import { Menu, Bell, ChevronDown, User, LogOut, BookOpen, Clock } from 'lucide-react';

const StaffHeader = ({ onToggleSidebar, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { user, staffProfile, logout } = useContext(AuthContext) || {};
  const location = useLocation();
  const navigate = useNavigate();

  const staffName = staffProfile?.name || user?.staffName || user?.name || 'Office Staff';
  const staffRole = staffProfile?.responsibility || 'Academic & Administrative Staff';
  const staffEmail = user?.email || (staffProfile?.staff_id ? `${staffProfile.staff_id.toLowerCase()}@staff.uniqueclasses.com` : 'staff@uniqueclasses.com');
  const avatarSrc = getPhotoUrl(staffProfile?.photo || user?.photo, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400');

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/staff/dashboard':
        return 'Staff Dashboard';
      case '/staff/attendance':
        return 'Attendance Management';
      case '/staff/tests':
        return 'Tests & Marks';
      case '/staff/admission':
        return 'New Student Admission';
      case '/staff/students':
        return 'All Students Directory';
      case '/staff/profile':
        return 'Staff Profile';
      default:
        return 'Staff Panel';
    }
  };

  const handleLogout = () => {
    setDropdownOpen(false);
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="teacher-header no-print">
      {/* Header Left: Menu Toggle + Dynamic Title */}
      <div className="teacher-header-left">
        <button
          className="teacher-menu-toggle-btn"
          onClick={onToggleSidebar}
          aria-label="Toggle Navigation Drawer"
        >
          <Menu size={22} />
        </button>

        <div className="teacher-title-container">
          <span className="teacher-badge-pill" style={{ background: '#F4C542', color: '#151515' }}>
            STAFF PANEL
          </span>
          <h1 className="teacher-header-title">{getPageTitle()}</h1>
        </div>
      </div>

      {/* Header Right: Notifications & Profile */}
      <div className="teacher-header-right">
        {/* Notification Bell */}
        <div className="teacher-notification-wrapper">
          <button
            className="teacher-notification-btn"
            onClick={() => {
              setNotificationsOpen(!notificationsOpen);
              setDropdownOpen(false);
            }}
            aria-label="Notifications"
          >
            <Bell size={20} />
            <span className="teacher-notification-dot" />
          </button>

          {/* Notification Dropdown */}
          {notificationsOpen && (
            <div className="teacher-notification-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="teacher-dropdown-header">
                <h4>Notifications</h4>
                <span className="teacher-badge-sm">2 New</span>
              </div>
              <div className="teacher-notification-list">
                <div className="teacher-notification-item">
                  <div className="teacher-notif-icon-box gold">
                    <Clock size={16} />
                  </div>
                  <div className="teacher-notif-info">
                    <p className="teacher-notif-text">Attendance record updated for 10th Standard.</p>
                    <span className="teacher-notif-time">5 mins ago</span>
                  </div>
                </div>
                <div className="teacher-notification-item">
                  <div className="teacher-notif-icon-box dark">
                    <BookOpen size={16} />
                  </div>
                  <div className="teacher-notif-info">
                    <p className="teacher-notif-text">New student admission recorded cleanly.</p>
                    <span className="teacher-notif-time">1 hour ago</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Profile Card & Dropdown */}
        <div
          className="teacher-profile-wrapper"
          onClick={() => {
            setDropdownOpen(!dropdownOpen);
            setNotificationsOpen(false);
          }}
        >
          <div className="teacher-avatar-box">
            <img
              src={avatarSrc}
              alt={staffName}
              className="teacher-avatar-img"
            />
          </div>

          <div className="teacher-profile-info">
            <span className="teacher-profile-name">{staffName}</span>
            <span className="teacher-profile-role">{staffRole}</span>
          </div>

          <ChevronDown size={16} className={`teacher-chevron ${dropdownOpen ? 'rotate' : ''}`} />

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="teacher-profile-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="teacher-dropdown-user-header">
                <strong>{staffName}</strong>
                <span>{staffEmail}</span>
              </div>

              <div
                className="teacher-dropdown-menu-item"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/staff/profile');
                }}
              >
                <User size={16} />
                <span>My Profile</span>
              </div>

              <div className="teacher-dropdown-divider" />

              <div
                className="teacher-dropdown-menu-item danger"
                onClick={handleLogout}
              >
                <LogOut size={16} />
                <span>Logout</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default StaffHeader;
