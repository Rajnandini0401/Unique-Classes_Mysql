import React, { useState, useEffect, useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Menu, Bell, ChevronDown, User, LogOut, BookOpen, Clock } from 'lucide-react';
import { AuthContext } from '../../context/AuthContext';
import { getAuthenticatedTeacherProfileAPI } from '../../services/api';
import { getTeacherPhotoUrl, handleImageError } from '../../utils/photoUtils';

const TeacherHeader = ({ onToggleSidebar, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const { teacherProfile, fetchTeacherProfile } = useContext(AuthContext);
  const [teacher, setTeacher] = useState({
    name: 'Loading...',
    subject: '',
    email: '',
    photo: ''
  });
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    let isMounted = true;
    const loadProfile = async () => {
      let tData = teacherProfile;
      if (!tData) {
        tData = await fetchTeacherProfile();
      }
      if (!tData) {
        try {
          const res = await getAuthenticatedTeacherProfileAPI();
          if (res.success && res.teacher) tData = res.teacher;
        } catch (e) {
          console.warn('TeacherHeader profile error:', e.message);
        }
      }
      if (isMounted && tData) {
        setTeacher({
          name: tData.fullname || tData.name || 'Teacher',
          subject: Array.isArray(tData.subjects) ? tData.subjects.join(', ') : (tData.subjects || ''),
          email: tData.email || '',
          photo: tData.photo || ''
        });
      }
    };
    loadProfile();
    return () => { isMounted = false; };
  }, [teacherProfile]);

  const getPageTitle = () => {
    switch (location.pathname) {
      case '/teacher/dashboard':
        return 'Dashboard';
      case '/teacher/classes':
        return 'My Classes';
      case '/teacher/attendance':
        return 'Mark Attendance';
      case '/teacher/tests':
        return 'Tests & Marks';
      case '/teacher/students':
        return 'Student Directory';
      case '/teacher/profile':
        return 'My Profile';
      default:
        return 'Teacher Dashboard';
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

  const avatarSrc = getTeacherPhotoUrl(teacher.photo);

  return (
    <header className="teacher-header">
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
          <span className="teacher-badge-pill">Teacher Panel</span>
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

          {/* Notification Preview Dropdown */}
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
                    <p className="teacher-notif-text">Upcoming 10th Standard Mathematics test tomorrow at 8:00 AM.</p>
                    <span className="teacher-notif-time">10 mins ago</span>
                  </div>
                </div>
                <div className="teacher-notification-item">
                  <div className="teacher-notif-icon-box dark">
                    <BookOpen size={16} />
                  </div>
                  <div className="teacher-notif-info">
                    <p className="teacher-notif-text">Monthly attendance report generated for 9th Standard.</p>
                    <span className="teacher-notif-time">2 hours ago</span>
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
              alt={teacher.name}
              className="teacher-avatar-img"
              onLoad={(e) => { e.target.style.display = 'block'; }}
              onError={handleImageError}
            />
          </div>

          <div className="teacher-profile-info">
            <span className="teacher-profile-name">{teacher.name}</span>
            <span className="teacher-profile-role">{teacher.subject}</span>
          </div>

          <ChevronDown size={16} className={`teacher-chevron ${dropdownOpen ? 'rotate' : ''}`} />

          {/* Profile Dropdown Menu */}
          {dropdownOpen && (
            <div className="teacher-profile-dropdown" onClick={(e) => e.stopPropagation()}>
              <div className="teacher-dropdown-user-header">
                <strong>{teacher.name}</strong>
                <span>{teacher.email}</span>
              </div>

              <div
                className="teacher-dropdown-menu-item"
                onClick={() => {
                  setDropdownOpen(false);
                  navigate('/teacher/profile');
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

export default TeacherHeader;
