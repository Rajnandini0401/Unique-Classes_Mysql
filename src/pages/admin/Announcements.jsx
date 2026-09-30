import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../layouts/AdminLayout';
import { Megaphone, Plus, Search, Filter, Eye, Edit2, Trash2, X, Calendar, AlertCircle, Loader2, Users, Globe, Paperclip } from 'lucide-react';
import {
  getAnnouncementsAPI,
  createAnnouncementAPI,
  updateAnnouncementAPI,
  deleteAnnouncementAPI
} from '../../services/api';
import '../../styles/admin/announcements.css';

const AUDIENCE_OPTIONS = [
  'Teacher + Staff',
  'Students',
  'Teacher + Student + Staff',
  'Public Website'
];

const CLASS_OPTIONS = [
  'All Students',
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th'
];

const STATUS_OPTIONS = ['All', 'Published', 'Draft', 'Active', 'Inactive'];

const isTargetClassRequired = (audience) => {
  return audience === 'Students' || audience === 'Teacher + Student + Staff';
};

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [selectedAudience, setSelectedAudience] = useState('All');
  const [filterDate, setFilterDate] = useState('');

  // Single Action State for Modals
  const [activeAction, setActiveAction] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Form State for Create / Edit
  const [formState, setFormState] = useState({
    title: '',
    content: '',
    audience: 'Students',
    targetClass: 'All Students',
    targetSubject: '',
    announcementDate: new Date().toISOString().split('T')[0],
    expiryDate: '',
    attachment: '',
    status: 'Published'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState('');

  // Disable background scrolling when modal opens
  useEffect(() => {
    if (activeAction) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [activeAction]);

  // Fetch Announcements from Backend API
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getAnnouncementsAPI({
        search: searchQuery,
        status: selectedStatus,
        audience: selectedAudience,
        date: filterDate,
        role: 'Admin',
        creatorRole: 'Admin'
      });
      if (res.success && Array.isArray(res.announcements)) {
        setAnnouncements(res.announcements);
      } else {
        setAnnouncements([]);
      }
    } catch (err) {
      setApiError(err.message || 'Unable to fetch announcements from server');
      setAnnouncements([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedStatus, selectedAudience, filterDate]);

  useEffect(() => {
    fetchAnnouncements();
  }, [fetchAnnouncements]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedStatus('All');
    setSelectedAudience('All');
    setFilterDate('');
  };

  // Close modal helper
  const handleCloseModal = () => {
    setActiveAction(null);
    setSelectedAnnouncement(null);
    setFormError('');
  };

  // Open Create Modal
  const handleOpenCreateModal = () => {
    setSelectedAnnouncement(null);
    setFormState({
      title: '',
      content: '',
      audience: 'Students',
      targetClass: 'All Students',
      targetSubject: '',
      announcementDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      attachment: '',
      status: 'Published'
    });
    setFormError('');
    setActiveAction('create');
  };

  // Open View Modal
  const handleOpenViewModal = (ann) => {
    setSelectedAnnouncement(ann);
    setActiveAction('view');
  };

  // Open Edit Modal
  const handleOpenEditModal = (ann) => {
    setSelectedAnnouncement(ann);
    const dateFormatted = ann.announcementDate
      ? new Date(ann.announcementDate).toISOString().split('T')[0]
      : new Date().toISOString().split('T')[0];

    const expiryFormatted = ann.expiryDate
      ? new Date(ann.expiryDate).toISOString().split('T')[0]
      : '';

    const aud = ann.audience || 'Students';
    const requiresClass = isTargetClassRequired(aud);

    setFormState({
      title: ann.title || '',
      content: ann.content || ann.message || '',
      audience: aud,
      targetClass: requiresClass ? (ann.targetClass || 'All Students') : '',
      targetSubject: ann.targetSubject || '',
      announcementDate: dateFormatted,
      expiryDate: expiryFormatted,
      attachment: ann.attachment || '',
      status: ann.status || 'Published'
    });
    setFormError('');
    setActiveAction('edit');
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (ann) => {
    setSelectedAnnouncement(ann);
    setActiveAction('delete');
  };

  // Submit Create / Edit Handler
  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formState.title || !formState.title.trim()) {
      setFormError('Validation Error: Please enter announcement title.');
      return;
    }
    if (!formState.content || !formState.content.trim()) {
      setFormError('Validation Error: Please enter announcement content.');
      return;
    }
    if (!formState.audience) {
      setFormError('Validation Error: Please select target audience.');
      return;
    }
    if (isTargetClassRequired(formState.audience)) {
      if (!formState.targetClass || !formState.targetClass.trim()) {
        setFormError('Please select a target class.');
        return;
      }
    }

    const payload = {
      ...formState,
      targetClass: isTargetClassRequired(formState.audience) ? formState.targetClass : ''
    };

    setIsSubmitting(true);

    try {
      if (activeAction === 'edit' && selectedAnnouncement) {
        const res = await updateAnnouncementAPI(selectedAnnouncement._id, payload, 'Admin');
        if (res.success) {
          handleCloseModal();
          fetchAnnouncements();
        } else {
          setFormError(res.message || 'Failed to update announcement.');
        }
      } else if (activeAction === 'create') {
        const res = await createAnnouncementAPI(payload, 'Admin');
        if (res.success) {
          handleCloseModal();
          fetchAnnouncements();
        } else {
          setFormError(res.message || 'Failed to create announcement.');
        }
      }
    } catch (err) {
      setFormError(err.message || 'Server error while saving announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Handler
  const handleDeleteConfirm = async () => {
    if (!selectedAnnouncement) return;
    setIsSubmitting(true);
    try {
      const res = await deleteAnnouncementAPI(selectedAnnouncement._id, 'Admin');
      if (res.success) {
        handleCloseModal();
        fetchAnnouncements();
      } else {
        setApiError(res.message || 'Failed to delete announcement.');
      }
    } catch (err) {
      setApiError(err.message || 'Server error while deleting announcement.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AdminLayout>
      <div className="announcements-container">
        {/* Top Header & Create Button */}
        <div className="announcements-top-bar">
          <div>
            <h2 className="announcements-heading">Announcements</h2>
            <p className="announcements-subtitle">Create and publish audience-targeted announcements for Unique Classes.</p>
          </div>
          <button className="add-schedule-btn" onClick={handleOpenCreateModal}>
            <Plus size={18} /> Create Announcement
          </button>
        </div>

        {/* API Error Banner */}
        {apiError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Dynamic Summary Cards */}
        <div className="ann-summary-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.25rem' }}>
          <div className="ann-stat-card">
            <div className="ann-stat-icon">
              <Megaphone size={26} />
            </div>
            <div className="ann-stat-details">
              <span className="ann-stat-label">Total Notices</span>
              <span className="ann-stat-count">{loading ? '...' : announcements.length}</span>
            </div>
          </div>

          <div className="ann-stat-card">
            <div className="ann-stat-icon" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <Users size={26} />
            </div>
            <div className="ann-stat-details">
              <span className="ann-stat-label">Student Notices</span>
              <span className="ann-stat-count">
                {loading ? '...' : announcements.filter(a => a.audience === 'Students' || a.audience === 'Teacher + Student + Staff').length}
              </span>
            </div>
          </div>

          <div className="ann-stat-card">
            <div className="ann-stat-icon" style={{ background: '#F0FDF4', color: '#16A34A' }}>
              <Globe size={26} />
            </div>
            <div className="ann-stat-details">
              <span className="ann-stat-label">Public Website</span>
              <span className="ann-stat-count">
                {loading ? '...' : announcements.filter(a => a.audience === 'Public Website').length}
              </span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="ann-filter-card" style={{ gap: '0.6rem', flexWrap: 'wrap' }}>
          <input
            type="text"
            placeholder="🔍 Search Announcement (Title / Content)"
            className="a-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="a-select-filter"
            value={selectedAudience}
            onChange={(e) => setSelectedAudience(e.target.value)}
          >
            <option value="All">Audience (All)</option>
            {AUDIENCE_OPTIONS.map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </select>

          <select
            className="a-select-filter"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="All">Status (All)</option>
            <option value="Published">Published</option>
            <option value="Draft">Draft</option>
            <option value="Expired">Expired</option>
          </select>

          <input
            type="date"
            className="a-search-input"
            style={{ minWidth: '150px' }}
            value={filterDate}
            onChange={(e) => setFilterDate(e.target.value)}
          />

          <button className="filter-btn-submit" onClick={fetchAnnouncements}>Filter</button>
          <button className="clear-btn-submit" onClick={handleClearFilters}>Clear</button>
        </div>

        {/* Announcements Table */}
        <div className="ann-table-card">
          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
              <Loader2 size={32} className="spin-icon" style={{ margin: '0 auto 0.75rem auto', color: '#1E3A8A' }} />
              <div>Loading announcements from server...</div>
            </div>
          ) : announcements.length > 0 ? (
            <table className="ann-table">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Audience</th>
                  <th>Target Class</th>
                  <th>Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {announcements.map((a) => (
                  <tr key={a._id}>
                    <td className="a-title-cell">
                      <div style={{ fontWeight: 800, color: '#1E3A8A' }}>{a.title}</div>
                      <div style={{ fontSize: '0.8rem', color: '#666', marginTop: '2px', lineClamp: 1, textOverflow: 'ellipsis', overflow: 'hidden', maxWidth: '300px' }}>
                        {a.content || a.message}
                      </div>
                    </td>
                    <td>
                      <span
                        style={{
                          display: 'inline-block',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: a.audience === 'Public Website' ? '#FEF3C7' : a.audience === 'Students' ? '#DBEAFE' : '#F3E8FF',
                          color: a.audience === 'Public Website' ? '#B45309' : a.audience === 'Students' ? '#1E40AF' : '#6B21A8'
                        }}
                      >
                        {a.audience || 'Students'}
                      </span>
                    </td>
                    <td style={{ fontWeight: 700, fontSize: '0.85rem' }}>
                      {isTargetClassRequired(a.audience) ? (a.targetClass || 'All Students') : '-'}
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>
                      {new Date(a.announcementDate).toLocaleDateString('en-GB')}
                    </td>
                    <td>
                      <span className={['Published', 'Active'].includes(a.status) ? 'badge-published' : 'badge-draft'}>
                        {a.status}
                      </span>
                    </td>
                    <td>
                      <div className="action-buttons-group">
                        <button className="btn-act-view" onClick={() => handleOpenViewModal(a)}>
                          View
                        </button>
                        <button className="btn-act-edit" onClick={() => handleOpenEditModal(a)}>
                          Edit
                        </button>
                        <button className="btn-act-delete" onClick={() => handleOpenDeleteModal(a)}>
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="empty-state-box" style={{ padding: '3rem', textAlign: 'center' }}>
              <Megaphone size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
              <div className="empty-state-text">No announcements found matching criteria.</div>
            </div>
          )}
        </div>

        {/* CREATE / EDIT ANNOUNCEMENT MODAL */}
        {(activeAction === 'create' || activeAction === 'edit') && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.65)'
            }}
            onClick={handleCloseModal}
          >
            <div
              className="action-modal-card"
              style={{
                width: 'min(650px, 92vw)',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '1.5rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2DBD0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#1E3A8A', fontWeight: 800, margin: 0 }}>
                  {activeAction === 'edit' ? 'Edit Announcement' : 'Create New Announcement'}
                </h3>
                <X size={20} style={{ cursor: 'pointer' }} onClick={handleCloseModal} />
              </div>

              {formError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.6rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 700 }}>
                  {formError}
                </div>
              )}

              <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Unit Test Schedule Announcement"
                    className="search-input-field"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '4px', border: '1px solid #C4C4C4', fontSize: '0.9rem' }}
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: isTargetClassRequired(formState.audience) ? '1fr 1fr' : '1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Send To (Audience) *</label>
                    <select
                      className="a-select-filter"
                      style={{ width: '100%', padding: '0.55rem 0.85rem' }}
                      value={formState.audience}
                      onChange={(e) => {
                        const newAud = e.target.value;
                        const reqClass = isTargetClassRequired(newAud);
                        setFormState(prev => ({
                          ...prev,
                          audience: newAud,
                          targetClass: reqClass ? (prev.targetClass || 'All Students') : ''
                        }));
                      }}
                    >
                      {AUDIENCE_OPTIONS.map(aud => (
                        <option key={aud} value={aud}>{aud}</option>
                      ))}
                    </select>
                  </div>

                  {isTargetClassRequired(formState.audience) && (
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Target Class *</label>
                      <select
                        className="a-select-filter"
                        style={{ width: '100%', padding: '0.55rem 0.85rem' }}
                        value={formState.targetClass || 'All Students'}
                        onChange={(e) => setFormState({ ...formState, targetClass: e.target.value })}
                      >
                        {CLASS_OPTIONS.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Content / Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write announcement message..."
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '4px', border: '1px solid #C4C4C4', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                    value={formState.content}
                    onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Publish Date *</label>
                    <input
                      type="date"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '4px', border: '1px solid #C4C4C4', fontSize: '0.9rem' }}
                      value={formState.announcementDate}
                      onChange={(e) => setFormState({ ...formState, announcementDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Expiry Date (Optional)</label>
                    <input
                      type="date"
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '4px', border: '1px solid #C4C4C4', fontSize: '0.9rem' }}
                      value={formState.expiryDate}
                      onChange={(e) => setFormState({ ...formState, expiryDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Status *</label>
                    <select
                      className="a-select-filter"
                      style={{ width: '100%', padding: '0.55rem 0.85rem' }}
                      value={formState.status}
                      onChange={(e) => setFormState({ ...formState, status: e.target.value })}
                    >
                      <option value="Published">Published</option>
                      <option value="Draft">Draft</option>
                      <option value="Expired">Expired</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Attachment URL (Optional)</label>
                  <input
                    type="text"
                    placeholder="https://example.com/file.pdf"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '4px', border: '1px solid #C4C4C4', fontSize: '0.9rem' }}
                    value={formState.attachment}
                    onChange={(e) => setFormState({ ...formState, attachment: e.target.value })}
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                  <button type="button" className="clear-btn-submit" onClick={handleCloseModal} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="add-schedule-btn" style={{ padding: '0.55rem 1.75rem' }} disabled={isSubmitting}>
                    {isSubmitting ? (
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                        <Loader2 size={16} className="spin-icon" /> Saving...
                      </span>
                    ) : activeAction === 'edit' ? (
                      'Update Announcement'
                    ) : (
                      'Create Announcement'
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW ANNOUNCEMENT MODAL */}
        {activeAction === 'view' && selectedAnnouncement && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.65)'
            }}
            onClick={handleCloseModal}
          >
            <div
              className="action-modal-card"
              style={{
                width: 'min(650px, 92vw)',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '1.5rem'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2DBD0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.35rem', color: '#1E3A8A', fontWeight: 800, margin: 0 }}>
                  {selectedAnnouncement.title}
                </h3>
                <X size={20} style={{ cursor: 'pointer' }} onClick={handleCloseModal} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <span className={['Published', 'Active'].includes(selectedAnnouncement.status) ? 'badge-published' : 'badge-draft'}>
                  Status: {selectedAnnouncement.status}
                </span>
                <span style={{ background: '#E2E8F0', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 700, color: '#334155' }}>
                  Audience: {selectedAnnouncement.audience || 'Students'}
                </span>
                {isTargetClassRequired(selectedAnnouncement.audience) ? (
                  <span style={{ background: '#FEF3C7', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 700, color: '#92400E' }}>
                    Target Class: {selectedAnnouncement.targetClass || 'All Students'}
                  </span>
                ) : (
                  <span style={{ background: '#F3F4F6', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 700, color: '#6B7280' }}>
                    No class target
                  </span>
                )}
                <span style={{ color: '#666', fontWeight: 700, alignSelf: 'center' }}>
                  Date: {new Date(selectedAnnouncement.announcementDate).toLocaleDateString('en-GB')}
                </span>
              </div>

              <div style={{ background: '#F8F5EC', padding: '1.25rem', borderRadius: '6px', border: '1px solid #E2DBD0', fontSize: '0.95rem', lineHeight: 1.6, color: '#171717', marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
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
                <button className="btn-act-view" onClick={handleCloseModal} style={{ padding: '0.5rem 1.5rem' }}>
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* DELETE CONFIRMATION MODAL */}
        {activeAction === 'delete' && selectedAnnouncement && (
          <div
            className="modal-overlay"
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: 'rgba(0, 0, 0, 0.65)'
            }}
            onClick={handleCloseModal}
          >
            <div
              className="action-modal-card"
              style={{
                width: 'min(420px, 92vw)',
                maxHeight: '90vh',
                overflowY: 'auto',
                background: '#FFFFFF',
                borderRadius: '8px',
                padding: '1.5rem',
                textAlign: 'center'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <Trash2 size={42} color="#EF4444" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.2rem', color: '#171717', fontWeight: 800, margin: '0 0 0.5rem 0' }}>
                Delete Announcement?
              </h3>
              <p style={{ fontSize: '0.9rem', color: '#666', margin: '0 0 1.5rem 0' }}>
                Are you sure you want to delete "<strong>{selectedAnnouncement.title}</strong>"?
              </p>

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
                <button className="clear-btn-submit" onClick={handleCloseModal} disabled={isSubmitting}>
                  Cancel
                </button>
                <button className="btn-act-delete" onClick={handleDeleteConfirm} style={{ padding: '0.55rem 1.5rem', fontSize: '0.9rem' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default Announcements;

