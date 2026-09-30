import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  UserPlus,
  GraduationCap,
  Users,
  UserCheck,
  Calendar,
  Clock,
  Award,
  DollarSign,
  Megaphone,
  Settings,
  LogOut
} from 'lucide-react';
import logoImg from '../../assets/logo.png';
import '../../styles/admin/sidebar.css';

const AdminSidebar = ({ isOpen, onCloseSidebar, onLogout }) => {
  const navItems = [
    { label: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
    { label: 'New Admission', path: '/admin/new-admission', icon: UserPlus },
    { label: 'All Students', path: '/admin/students', icon: GraduationCap },
    { label: 'Teachers', path: '/admin/teachers', icon: Users },
    { label: 'Office Staff', path: '/admin/staff', icon: UserCheck },
    { label: 'Batches', path: '/admin/batches', icon: Calendar },
    { label: 'Attendance', path: '/admin/attendance', icon: Clock },
    { label: 'Marks / Results', path: '/admin/results', icon: Award },
    { label: 'Fees', path: '/admin/fees', icon: DollarSign },
    { label: 'Announcements', path: '/admin/announcements', icon: Megaphone },
    { label: 'Settings', path: '/admin/settings', icon: Settings }
  ];

  return (
    <aside className={`admin-sidebar ${isOpen ? 'open' : ''}`}>
      {/* Sidebar Header / Brand Logo */}
      <div className="sidebar-header">
        <img src={logoImg} alt="Unique Classes" className="sidebar-logo" />
        <div className="sidebar-brand-info">
          <span className="sidebar-brand-name">UNIQUE CLASSES</span>
          <span className="sidebar-role-badge">ADMIN PANEL</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="sidebar-nav">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `sidebar-link ${isActive ? 'active' : ''}`
              }
              onClick={() => {
                if (onCloseSidebar) onCloseSidebar();
              }}
            >
              <IconComponent size={18} className="sidebar-icon" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer Logout */}
      <div className="sidebar-footer">
        <button className="logout-btn" onClick={onLogout}>
          <LogOut size={18} />
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
};

export default AdminSidebar;
