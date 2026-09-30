import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  User,
  FileText,
  FileCheck2,
  IndianRupee,
  Clock,
  Megaphone,
  LogOut,
  Sparkles
} from 'lucide-react';
import logoImg from '../../assets/logo.png';

const navItems = [
  { label: 'Dashboard', path: '/student/dashboard', icon: LayoutDashboard },
  { label: 'My Profile', path: '/student/profile', icon: User },
  { label: 'Assignments', path: '/student/assignments', icon: FileText },
  { label: 'Tests & Marks', path: '/student/tests', icon: FileCheck2 },
  { label: 'My Fees', path: '/student/fees', icon: IndianRupee },
  { label: 'My Schedule', path: '/student/schedule', icon: Clock },
  { label: 'Announcements', path: '/student/announcements', icon: Megaphone }
];

const StudentSidebar = ({ onLogout }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  return (
    <aside className="student-desktop-sidebar no-print">
      <div className="student-sidebar-brand">
        <img src={logoImg} alt="Unique Classes" style={{ width: '38px', height: '38px', borderRadius: '50%' }} />
        <div>
          <div style={{ fontWeight: 900, color: '#1E3A8A', fontSize: '0.95rem' }}>UNIQUE CLASSES</div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37', display: 'flex', alignItems: 'center', gap: '3px' }}>
            <Sparkles size={10} /> STUDENT PORTAL
          </div>
        </div>
      </div>

      <nav className="student-sidebar-menu">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `student-sidebar-link ${isActive ? 'active' : ''}`}
            >
              <Icon size={18} />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      <div style={{ padding: '1rem', borderTop: '1px solid #E2E8F0' }}>
        <button
          type="button"
          onClick={handleLogout}
          style={{
            width: '100%',
            padding: '0.65rem 0.85rem',
            background: '#FEF2F2',
            border: '1px solid #FCA5A5',
            color: '#DC2626',
            borderRadius: '8px',
            fontWeight: 800,
            fontSize: '0.85rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer'
          }}
        >
          <LogOut size={16} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default StudentSidebar;
