import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Bell, ArrowRight, X } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { getStudentPhotoUrl, handleImageError } from '../../utils/photoUtils';
import { getStudentAnnouncementsAPI, markAnnouncementReadAPI } from '../../services/api';

const StudentHeader = ({ student, loading = false }) => {
  const navigate = useNavigate();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [announcements, setAnnouncements] = useState([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
  const dropdownRef = useRef(null);

  // Student Identity Data
  const studentId = student?._id || student?.id || localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
  const studentName = student?.name || '';
  const standard = student?.standard || student?.class || '';
  const rollNo = student?.rollNo ? `Roll No. ${student.rollNo}` : '';
  const photoUrl = getStudentPhotoUrl(student?.photo);

  const fetchHeaderAnnouncements = useCallback(async () => {
    if (!studentId && !standard) return;
    setLoadingAnnouncements(true);
    try {
      const res = await getStudentAnnouncementsAPI(studentId, standard);
      if (res && res.success && Array.isArray(res.announcements)) {
        setAnnouncements(res.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Error fetching header notifications:', err);
      setAnnouncements([]);
    } finally {
      setLoadingAnnouncements(false);
    }
  }, [studentId, standard]);

  useEffect(() => {
    fetchHeaderAnnouncements();
  }, [fetchHeaderAnnouncements]);

  // Handle outside click to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const unreadAnnouncements = announcements.filter(a => !a.isRead);
  const unreadCount = unreadAnnouncements.length;

  const handleMarkAsRead = async (announcementId) => {
    if (!studentId || !announcementId) return;
    // Optimistic UI update
    setAnnouncements(prev =>
      prev.map(a => (a._id === announcementId ? { ...a, isRead: true } : a))
    );
    try {
      await markAnnouncementReadAPI(announcementId, studentId);
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleNotificationClick = (item) => {
    if (!item.isRead) {
      handleMarkAsRead(item._id);
    }
    setSelectedAnnouncement(item);
    setDropdownOpen(false);
  };

  const handleViewAll = () => {
    setDropdownOpen(false);
    navigate('/student/announcements');
  };

  return (
    <header className="student-header no-print">
      <div className="student-header-content">
        {/* Left: Brand */}
        <div className="student-header-brand">
          <img src={logoImg} alt="Unique Classes" className="student-header-logo" />
          <div>
            <div className="student-brand-title">UNIQUE CLASSES</div>
            <div className="student-brand-tag">
              <Sparkles size={10} color="#F4C542" /> STUDENT PANEL
            </div>
          </div>
        </div>

        {/* Right: Student Identity & Notification */}
        <div className="student-header-user">
          {/* Identity Block (No Greeting) */}
          <div className="student-header-text">
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-end' }}>
                <div style={{ width: '100px', height: '12px', background: 'rgba(255, 255, 255, 0.2)', borderRadius: '4px' }} />
                <div style={{ width: '130px', height: '10px', background: 'rgba(255, 255, 255, 0.15)', borderRadius: '4px' }} />
              </div>
            ) : (
              <>
                <span className="student-header-name" title={studentName}>
                  {studentName || 'Student'}
                </span>
                <span className="student-header-sub">
                  {[standard ? `${standard} Standard` : '', rollNo].filter(Boolean).join(' • ') || 'Student Portal'}
                </span>
              </>
            )}
          </div>

          {/* Dynamic Notification Bell */}
          <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
              type="button"
              className="notification-bell-btn"
              onClick={() => setDropdownOpen(prev => !prev)}
              title="Notifications"
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                background: dropdownOpen ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.12)',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
                padding: 0
              }}
            >
              <Bell size={18} />
              {unreadCount > 0 && (
                <span
                  style={{
                    position: 'absolute',
                    top: '-2px',
                    right: '-2px',
                    background: '#EF4444',
                    color: '#FFFFFF',
                    fontSize: '0.65rem',
                    fontWeight: 900,
                    minWidth: '17px',
                    height: '17px',
                    borderRadius: '9px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '0 3px',
                    border: '2px solid #0F172A',
                    boxShadow: '0 2px 6px rgba(239, 68, 68, 0.4)'
                  }}
                >
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {/* Notification Dropdown Panel */}
            {dropdownOpen && (
              <div
                style={{
                  position: 'absolute',
                  top: 'calc(100% + 10px)',
                  right: 0,
                  width: 'min(340px, 88vw)',
                  background: '#FFFFFF',
                  color: '#0F172A',
                  borderRadius: '12px',
                  boxShadow: '0 12px 36px rgba(0, 0, 0, 0.25)',
                  border: '1px solid #E2E8F0',
                  zIndex: 1000,
                  overflow: 'hidden',
                  animation: 'fadeIn 0.15s ease-out'
                }}
              >
                {/* Dropdown Header */}
                <div
                  style={{
                    padding: '0.75rem 1rem',
                    background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
                    color: '#FFFFFF',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 800, fontSize: '0.88rem' }}>
                    <Bell size={16} color="#F4C542" /> Notifications
                  </div>
                  {unreadCount > 0 && (
                    <span
                      style={{
                        background: '#EF4444',
                        color: '#FFFFFF',
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.5rem',
                        borderRadius: '10px'
                      }}
                    >
                      {unreadCount} new
                    </span>
                  )}
                </div>

                {/* Notification List */}
                <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                  {loadingAnnouncements ? (
                    <div style={{ padding: '1.25rem', textAlign: 'center', fontSize: '0.82rem', color: '#64748B' }}>
                      Loading notifications...
                    </div>
                  ) : announcements.length === 0 ? (
                    <div style={{ padding: '1.5rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '0.82rem' }}>
                      No announcements right now.
                    </div>
                  ) : (
                    announcements.slice(0, 5).map((item) => {
                      const isUnread = !item.isRead;
                      return (
                        <div
                          key={item._id}
                          onClick={() => handleNotificationClick(item)}
                          style={{
                            padding: '0.75rem 1rem',
                            borderBottom: '1px solid #F1F5F9',
                            background: isUnread ? '#EFF6FF' : '#FFFFFF',
                            cursor: 'pointer',
                            display: 'flex',
                            gap: '0.6rem',
                            alignItems: 'flex-start',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <div style={{ marginTop: '2px', flexShrink: 0 }}>
                            {isUnread ? (
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#EF4444' }} />
                            ) : (
                              <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: '#CBD5E1' }} />
                            )}
                          </div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div
                              style={{
                                fontSize: '0.83rem',
                                fontWeight: isUnread ? 800 : 600,
                                color: isUnread ? '#1E3A8A' : '#334155',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis'
                              }}
                            >
                              {item.title}
                            </div>
                            <div
                              style={{
                                fontSize: '0.75rem',
                                color: '#64748B',
                                marginTop: '2px',
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                                lineHeight: '1.3'
                              }}
                            >
                              {item.content || item.message}
                            </div>
                            <div style={{ fontSize: '0.68rem', color: '#94A3B8', marginTop: '4px', fontWeight: 600 }}>
                              {item.announcementDate
                                ? new Date(item.announcementDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                                : 'Recent'}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* Dropdown Footer */}
                <div
                  style={{
                    padding: '0.6rem 1rem',
                    background: '#F8FAFC',
                    borderTop: '1px solid #E2E8F0',
                    textAlign: 'center'
                  }}
                >
                  <button
                    type="button"
                    onClick={handleViewAll}
                    style={{
                      background: 'transparent',
                      border: 'none',
                      color: '#1E3A8A',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    View All <ArrowRight size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Student Avatar / Photo */}
          <div
            className="student-header-avatar"
            style={{ position: 'relative', overflow: 'hidden', cursor: 'pointer' }}
            onClick={() => navigate('/student/profile')}
            title="My Profile"
          >
            {photoUrl ? (
              <>
                <img
                  src={photoUrl}
                  alt={studentName}
                  onError={(e) => handleImageError(e, '')}
                  style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                />
                <span className="photo-fallback" style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center' }}>
                  {studentName ? studentName.charAt(0).toUpperCase() : 'S'}
                </span>
              </>
            ) : (
              <span>{studentName ? studentName.charAt(0).toUpperCase() : 'S'}</span>
            )}
          </div>
        </div>
      </div>

      {/* Selected Announcement Modal Detail */}
      {selectedAnnouncement && (
        <div
          className="modal-overlay"
          style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.65)' }}
          onClick={() => setSelectedAnnouncement(null)}
        >
          <div
            className="action-modal-card"
            style={{ width: 'min(550px, 92vw)', maxHeight: '85vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: '12px', padding: '1.25rem', color: '#0F172A' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem', marginBottom: '1rem' }}>
              <h3 style={{ fontSize: '1.2rem', color: '#1E3A8A', fontWeight: 800, margin: 0 }}>
                {selectedAnnouncement.title}
              </h3>
              <X size={20} style={{ cursor: 'pointer', color: '#64748B' }} onClick={() => setSelectedAnnouncement(null)} />
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', fontSize: '0.78rem', flexWrap: 'wrap' }}>
              <span style={{ background: '#DBEAFE', padding: '0.15rem 0.55rem', borderRadius: '4px', fontWeight: 800, color: '#1E40AF' }}>
                Target: {selectedAnnouncement.targetClass || 'General'}
              </span>
              <span style={{ background: '#FEF3C7', padding: '0.15rem 0.55rem', borderRadius: '4px', fontWeight: 800, color: '#B45309' }}>
                By: {selectedAnnouncement.createdByName || selectedAnnouncement.createdByRole || 'Admin'}
              </span>
              <span style={{ color: '#64748B', fontWeight: 700, alignSelf: 'center' }}>
                {selectedAnnouncement.announcementDate ? new Date(selectedAnnouncement.announcementDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : ''}
              </span>
            </div>

            <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2E8F0', fontSize: '0.88rem', lineHeight: 1.6, color: '#1E293B', marginBottom: '1rem', whiteSpace: 'pre-line' }}>
              {selectedAnnouncement.content || selectedAnnouncement.message}
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <button
                type="button"
                onClick={handleViewAll}
                style={{ background: 'transparent', border: 'none', color: '#1E3A8A', fontWeight: 800, fontSize: '0.82rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
              >
                Go to Announcements Page <ArrowRight size={14} />
              </button>
              <button className="btn-act-view" onClick={() => setSelectedAnnouncement(null)} style={{ padding: '0.4rem 1.25rem', fontSize: '0.82rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default StudentHeader;
