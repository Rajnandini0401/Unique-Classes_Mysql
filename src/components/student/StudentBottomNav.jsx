import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  Home,
  FileText,
  FileCheck2,
  IndianRupee,
  Menu,
  User,
  Clock,
  Megaphone,
  LogOut,
  X
} from 'lucide-react';

const StudentBottomNav = ({ onLogout }) => {
  const [showMoreMenu, setShowMoreMenu] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    setShowMoreMenu(false);
    if (onLogout) {
      onLogout();
    } else {
      localStorage.removeItem('token');
      navigate('/login');
    }
  };

  return (
    <>
      {/* Mobile Bottom Navigation Bar */}
      <nav className="student-bottom-nav no-print">
        <NavLink
          to="/student/dashboard"
          className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
        >
          <Home size={20} />
          <span>Home</span>
        </NavLink>

        <NavLink
          to="/student/assignments"
          className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
        >
          <FileText size={20} />
          <span>Assignments</span>
        </NavLink>

        <NavLink
          to="/student/tests"
          className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
        >
          <FileCheck2 size={20} />
          <span>Tests</span>
        </NavLink>

        <NavLink
          to="/student/fees"
          className={({ isActive }) => `student-nav-item ${isActive ? 'active' : ''}`}
        >
          <IndianRupee size={20} />
          <span>Fees</span>
        </NavLink>

        <button
          type="button"
          className={`student-nav-item ${showMoreMenu ? 'active' : ''}`}
          onClick={() => setShowMoreMenu(true)}
        >
          <Menu size={20} />
          <span>More</span>
        </button>
      </nav>

      {/* Mobile "More" Drawer Overlay */}
      {showMoreMenu && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.65)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center'
          }}
          onClick={() => setShowMoreMenu(false)}
        >
          <div
            style={{
              background: '#FFFFFF',
              width: '100%',
              maxHeight: '80vh',
              borderTopLeftRadius: '20px',
              borderTopRightRadius: '20px',
              padding: '1.25rem 1.25rem 2rem 1.25rem',
              boxSizing: 'border-box',
              overflowY: 'auto'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <span style={{ fontSize: '1rem', fontWeight: 900, color: '#1E3A8A' }}>More Student Options</span>
              <button
                onClick={() => setShowMoreMenu(false)}
                style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              >
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.85rem' }}>
              <NavLink
                to="/student/profile"
                onClick={() => setShowMoreMenu(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem', background: '#F8FAFC', borderRadius: '10px', textDecoration: 'none', color: '#1E293B', fontWeight: 800, fontSize: '0.88rem', border: '1px solid #E2E8F0' }}
              >
                <User size={18} color="#1E3A8A" />
                <span>My Profile</span>
              </NavLink>

              <NavLink
                to="/student/schedule"
                onClick={() => setShowMoreMenu(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem', background: '#F8FAFC', borderRadius: '10px', textDecoration: 'none', color: '#1E293B', fontWeight: 800, fontSize: '0.88rem', border: '1px solid #E2E8F0' }}
              >
                <Clock size={18} color="#1E3A8A" />
                <span>My Schedule</span>
              </NavLink>

              <NavLink
                to="/student/announcements"
                onClick={() => setShowMoreMenu(false)}
                style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', padding: '0.85rem', background: '#F8FAFC', borderRadius: '10px', textDecoration: 'none', color: '#1E293B', fontWeight: 800, fontSize: '0.88rem', border: '1px solid #E2E8F0' }}
              >
                <Megaphone size={18} color="#1E3A8A" />
                <span>Announcements</span>
              </NavLink>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                width: '100%',
                marginTop: '1.25rem',
                padding: '0.85rem',
                borderRadius: '10px',
                background: '#FEF2F2',
                border: '1px solid #FCA5A5',
                color: '#DC2626',
                fontWeight: 800,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                cursor: 'pointer'
              }}
            >
              <LogOut size={18} />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default StudentBottomNav;
