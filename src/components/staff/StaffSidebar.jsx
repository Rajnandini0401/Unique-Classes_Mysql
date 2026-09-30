import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  UserCheck,
  FileCheck2,
  UserPlus,
  Clock,
  IndianRupee,
  GraduationCap,
  Megaphone,
  User,
  LogOut,
  Sparkles,
  X
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

const StaffSidebar = ({ isOpen, onCloseSidebar, onLogout }) => {
  const navigate = useNavigate();

  const navItems = [
    { label: 'Dashboard', path: '/staff/dashboard', icon: LayoutDashboard },
    { label: 'New Admission', path: '/staff/admission', icon: UserPlus },
    { label: 'All Students', path: '/staff/students', icon: GraduationCap },
    { label: 'Attendance', path: '/staff/attendance', icon: UserCheck },
    { label: 'Tests & Marks', path: '/staff/tests', icon: FileCheck2 },
    { label: 'Fees', path: '/staff/fees', icon: IndianRupee },
    { label: 'Batches', path: '/staff/batches', icon: Clock },
    { label: 'Announcements', path: '/staff/announcements', icon: Megaphone },
    { label: 'Profile', path: '/staff/profile', icon: User }
  ];

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  return (
    <aside className={`teacher-sidebar no-print ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="teacher-sidebar-brand">
        <div className="teacher-brand-left">
          <img src={logoImg} alt="Unique Classes Logo" className="teacher-sidebar-logo" />
          <div className="teacher-brand-details">
            <span className="teacher-brand-name">UNIQUE CLASSES</span>
            <span className="teacher-portal-tag">
              <Sparkles size={11} color="#F4C542" /> STAFF PANEL
            </span>
          </div>
        </div>
        {/* Mobile Close Button */}
        <button
          className="teacher-sidebar-close-mobile"
          onClick={onCloseSidebar}
          aria-label="Close sidebar"
        >
          <X size={18} />
        </button>
      </div>

      {/* Navigation Menu */}
      <nav className="teacher-sidebar-nav">
        <div className="teacher-nav-group-title">STAFF MENU</div>
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `teacher-nav-link ${isActive ? 'active' : ''}`
              }
              onClick={() => {
                if (onCloseSidebar) onCloseSidebar();
              }}
            >
              <IconComponent size={19} className="teacher-nav-icon" />
              <span className="teacher-nav-label">{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Staff Quick Profile Badge & Logout */}
      <div className="teacher-sidebar-footer">
        <button className="teacher-logout-btn" onClick={handleLogoutClick}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default StaffSidebar;
