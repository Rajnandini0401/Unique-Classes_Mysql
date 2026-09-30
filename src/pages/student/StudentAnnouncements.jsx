import React, { useState, useEffect, useCallback } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import {
  Megaphone,
  Calendar,
  Paperclip,
  Eye,
  FileText,
  AlertCircle,
  Loader2,
  Sparkles,
  Search,
  Filter,
  X
} from 'lucide-react';
import { getCurrentStudentProfileAPI, getStudentAnnouncementsAPI, markAnnouncementReadAPI } from '../../services/api';
import AnnouncementCard from '../../components/common/AnnouncementCard';

const StudentAnnouncements = () => {
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const fetchAnnouncementsData = useCallback(async () => {
    setLoadingStudent(true);
    setLoading(true);
    setErrorMsg('');

    try {
      const savedStudentId = localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
      const meRes = await getCurrentStudentProfileAPI(savedStudentId || undefined);

      let std = null;
      let sId = savedStudentId;
      if (meRes.success && meRes.student) {
        setStudent(meRes.student);
        std = meRes.student.standard;
        sId = meRes.student._id;
      }

      const res = await getStudentAnnouncementsAPI(sId, std);
      if (res.success && Array.isArray(res.announcements)) {
        setAnnouncements(res.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      console.error('Error fetching announcements:', err);
      setErrorMsg('Failed to load announcements from server.');
    } finally {
      setLoadingStudent(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAnnouncementsData();
  }, [fetchAnnouncementsData]);

  if (loadingStudent || loading) {
    return (
      <StudentLayout>
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ color: '#1E3A8A', fontWeight: 800 }}>Loading Announcements...</div>
        </div>
      </StudentLayout>
    );
  }

  // Filter announcements by search query
  const filteredAnnouncements = announcements.filter((a) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      (a.title && a.title.toLowerCase().includes(q)) ||
      (a.content && a.content.toLowerCase().includes(q)) ||
      (a.message && a.message.toLowerCase().includes(q)) ||
      (a.description && a.description.toLowerCase().includes(q)) ||
      (a.targetSubject && a.targetSubject.toLowerCase().includes(q)) ||
      (a.category && a.category.toLowerCase().includes(q))
    );
  });

  return (
    <StudentLayout student={student}>
      <div style={{ maxWidth: '1050px', margin: '0 auto' }}>

        {/* HEADER BRANDING */}
        <div className="student-card" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)', color: '#FFFFFF', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                INSTITUTE NOTICES & UPDATES
              </div>
              <h2 style={{ margin: '0.2rem 0 0', color: '#FFFFFF', fontSize: '1.3rem', fontWeight: 900 }}>
                Announcements
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                Important dates, exam notices, holiday updates, and batch schedules
              </p>
            </div>
          </div>
        </div>

        {/* SEARCH BAR */}
        <div className="student-card" style={{ padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: '#F8FAFC', padding: '0.4rem 0.75rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
            <Search size={16} color="#64748B" />
            <input
              type="text"
              placeholder="Search announcements by title or keyword..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                border: 'none',
                outline: 'none',
                background: 'transparent',
                width: '100%',
                fontSize: '0.85rem',
                color: '#0F172A',
                fontWeight: 600
              }}
            />
          </div>
        </div>

        {/* ANNOUNCEMENT GRID */}
        <div className="student-card">
          <div className="student-card-title" style={{ marginBottom: '1.25rem' }}>
            <h3>
              <Megaphone size={18} color="#1E3A8A" /> Latest Notices
            </h3>
          </div>

          {filteredAnnouncements.length > 0 ? (
            <div className="announcements-grid">
              {filteredAnnouncements.map((item) => (
                <AnnouncementCard
                  key={item._id}
                  announcement={item}
                  role="Student"
                  onView={async (ann) => {
                    setSelectedAnnouncement(ann);
                    const sId = student?._id || student?.id || localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
                    if (sId && ann?._id) {
                      try {
                        await markAnnouncementReadAPI(ann._id, sId);
                      } catch (err) {
                        console.error('Error marking announcement as read:', err);
                      }
                    }
                  }}
                />
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.88rem', color: '#64748B', padding: '2rem 0', textAlign: 'center' }}>
              No announcements available.
            </div>
          )}
        </div>

        {/* ANNOUNCEMENT DETAIL VIEW MODAL */}
        {selectedAnnouncement && (
          <div
            className="modal-overlay"
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.65)' }}
            onClick={() => setSelectedAnnouncement(null)}
          >
            <div
              className="action-modal-card"
              style={{ width: 'min(600px, 92vw)', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: '8px', padding: '1.5rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2DBD0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.35rem', color: '#1E3A8A', fontWeight: 800, margin: 0 }}>
                  {selectedAnnouncement.title}
                </h3>
                <X size={20} style={{ cursor: 'pointer' }} onClick={() => setSelectedAnnouncement(null)} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#DBEAFE', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 800, color: '#1E40AF' }}>
                  Target: {selectedAnnouncement.targetClass || selectedAnnouncement.targetSubject || 'General'}
                </span>
                <span style={{ background: selectedAnnouncement.createdByRole === 'Teacher' ? '#D1FAE5' : '#FEF3C7', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 800, color: selectedAnnouncement.createdByRole === 'Teacher' ? '#047857' : '#B45309' }}>
                  By: {selectedAnnouncement.createdByName || selectedAnnouncement.createdByRole || 'Admin'}
                </span>
                <span style={{ color: '#64748B', fontWeight: 700, alignSelf: 'center' }}>
                  Date: {selectedAnnouncement.announcementDate ? new Date(selectedAnnouncement.announcementDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : '--'}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.95rem', lineHeight: 1.6, color: '#171717', marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                {selectedAnnouncement.content || selectedAnnouncement.message || selectedAnnouncement.description}
              </div>

              {selectedAnnouncement.attachment && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <a
                    href={selectedAnnouncement.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1E3A8A', fontWeight: 800, textDecoration: 'underline', background: '#EFF6FF', padding: '0.4rem 0.85rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}
                  >
                    <Paperclip size={16} /> View Announcement Attachment
                  </a>
                </div>
              )}

              <div style={{ textAlign: 'right' }}>
                <button className="btn-act-view" onClick={() => setSelectedAnnouncement(null)} style={{ padding: '0.5rem 1.5rem' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </StudentLayout>
  );
};

export default StudentAnnouncements;
