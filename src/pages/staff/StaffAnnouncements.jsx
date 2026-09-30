import React, { useState, useEffect, useCallback } from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import {
  Megaphone,
  Search,
  Calendar,
  Eye,
  Paperclip,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import { getAnnouncementsAPI } from '../../services/api';
import AnnouncementCard from '../../components/common/AnnouncementCard';

const StaffAnnouncements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getAnnouncementsAPI({
        role: 'Staff',
        search: searchQuery
      });
      if (res.success && Array.isArray(res.announcements)) {
        setAnnouncements(res.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      setApiError(err.message || 'Unable to fetch announcements.');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  return (
    <StaffLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        <div style={{ marginBottom: '1.25rem' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E3A8A', margin: 0 }}>
            Staff Notices & Bulletins
          </h2>
          <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '2px 0 0 0' }}>
            Official announcements issued to office staff and faculty.
          </p>
        </div>

        {apiError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Search Input */}
        <div className="ann-filter-card" style={{ marginBottom: '1.25rem' }}>
          <input
            type="text"
            placeholder="🔍 Search Staff Notices..."
            className="a-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="filter-btn-submit" onClick={fetchAnnouncements}>Search</button>
        </div>

        {/* Announcement Grid */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2DBD0', padding: '1.25rem', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Megaphone size={18} color="#1E3A8A" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E3A8A', margin: 0 }}>
              Staff Bulletins
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
              <Loader2 size={32} className="spin-icon" style={{ margin: '0 auto 0.75rem auto', color: '#1E3A8A' }} />
              <div>Loading notices...</div>
            </div>
          ) : announcements.length > 0 ? (
            <div className="announcements-grid">
              {announcements.map((a) => (
                <AnnouncementCard
                  key={a._id}
                  announcement={a}
                  role="Staff"
                  onView={(ann) => setSelectedAnnouncement(ann)}
                />
              ))}
            </div>
          ) : (
            <div className="empty-state-box" style={{ padding: '3rem', textAlign: 'center' }}>
              <Megaphone size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
              <div className="empty-state-text">No staff notices found.</div>
            </div>
          )}
        </div>

        {/* View Modal */}
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

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem' }}>
                <span style={{ background: '#F3E8FF', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 700, color: '#6B21A8' }}>
                  Audience: {selectedAnnouncement.audience}
                </span>
                <span style={{ color: '#666', fontWeight: 700, alignSelf: 'center' }}>
                  Date: {new Date(selectedAnnouncement.announcementDate).toLocaleDateString('en-GB')}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.95rem', lineHeight: 1.6, color: '#171717', marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                {selectedAnnouncement.content || selectedAnnouncement.message}
              </div>

              {selectedAnnouncement.attachment && (
                <div style={{ marginBottom: '1.25rem' }}>
                  <a
                    href={selectedAnnouncement.attachment}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#1E3A8A', fontWeight: 800, textDecoration: 'underline' }}
                  >
                    <Paperclip size={16} /> View Attachment
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
    </StaffLayout>
  );
};

export default StaffAnnouncements;
