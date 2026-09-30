import React, { useContext } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  UserCheck,
  FileCheck2,
  Calendar,
  GraduationCap,
  Megaphone,
  User,
  LogOut,
  Sparkles,
  X
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { AuthContext } from '../../context/AuthContext';
import { getTeacherPhotoUrl, handleImageError } from '../../utils/photoUtils';

const TeacherSidebar = ({ isOpen, onCloseSidebar, onLogout }) => {
  const navigate = useNavigate();
  const { teacherProfile, user } = useContext(AuthContext) || {};

  const navItems = [
    { label: 'Dashboard', path: '/teacher/dashboard', icon: LayoutDashboard },
    { label: 'My Batches', path: '/teacher/batches', icon: Calendar },
    { label: 'My Classes', path: '/teacher/classes', icon: BookOpen },
    { label: 'Assignments', path: '/teacher/assignments', icon: FileText },
    { label: 'Attendance', path: '/teacher/attendance', icon: UserCheck },
    { label: 'Tests & Marks', path: '/teacher/tests', icon: FileCheck2 },
    { label: 'Announcements', path: '/teacher/announcements', icon: Megaphone },
    { label: 'Students', path: '/teacher/students', icon: GraduationCap },
    { label: 'Profile', path: '/teacher/profile', icon: User }
  ];

  const handleLogoutClick = () => {
    if (onLogout) {
      onLogout();
    } else {
      navigate('/login');
    }
  };

  const displayName = teacherProfile?.name || user?.username || 'Teacher';
  const displayId = teacherProfile?.teacher_id || 'TCH';
  const photoUrl = getTeacherPhotoUrl(teacherProfile?.photo);

  return (
    <aside className={`teacher-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Brand Header */}
      <div className="teacher-sidebar-brand">
        <div className="teacher-brand-left">
          <img src={logoImg} alt="Unique Classes Logo" className="teacher-sidebar-logo" />
          <div className="teacher-brand-details">
            <span className="teacher-brand-name">UNIQUE CLASSES</span>
            <span className="teacher-portal-tag">
              <Sparkles size={11} color="#F4C542" /> TEACHER PANEL
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
        <div className="teacher-nav-group-title">MAIN MENU</div>
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

      {/* Teacher Quick Profile Badge & Logout */}
      <div className="teacher-sidebar-footer">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem', padding: '0.5rem', background: '#1F1F1F', borderRadius: '8px' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#D4AF37', color: '#151515', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', overflow: 'hidden', flexShrink: 0 }}>
            {photoUrl ? (
              <img src={photoUrl} alt={displayName} onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              displayName.charAt(0).toUpperCase()
            )}
          </div>
          <div style={{ overflow: 'hidden' }}>
            <div style={{ color: '#FFFFFF', fontSize: '0.82rem', fontWeight: '700', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{displayName}</div>
            <div style={{ color: '#D4AF37', fontSize: '0.72rem', fontWeight: '600' }}>ID: {displayId}</div>
          </div>
        </div>
        <button className="teacher-logout-btn" onClick={handleLogoutClick}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default TeacherSidebar;

