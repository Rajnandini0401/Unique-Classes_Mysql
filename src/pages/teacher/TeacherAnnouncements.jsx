import React, { useState, useEffect, useCallback, useContext } from 'react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { AuthContext } from '../../context/AuthContext';
import {
  Megaphone,
  Plus,
  Search,
  Filter,
  Eye,
  Edit2,
  Trash2,
  X,
  Calendar,
  AlertCircle,
  Loader2,
  Paperclip,
  Users,
  Lock
} from 'lucide-react';
import {
  getAnnouncementsAPI,
  createAnnouncementAPI,
  updateAnnouncementAPI,
  deleteAnnouncementAPI,
  getTeacherByIdAPI,
  getAuthenticatedTeacherProfileAPI,
  getTeacherAllocationsAPI
} from '../../services/api';
import { getActiveTeacherId } from '../../config/teacherConfig';
import AnnouncementCard from '../../components/common/AnnouncementCard';

const TeacherAnnouncements = () => {
  const { teacherProfile: contextProfile, user } = useContext(AuthContext) || {};
  const activeTeacherDbId = contextProfile?.id || contextProfile?._id || user?.teacher_id;
  const teacherId = activeTeacherDbId;

  const [announcements, setAnnouncements] = useState([]);
  const [teacherProfile, setTeacherProfile] = useState(null);
  const [assignedClasses, setAssignedClasses] = useState(['All Students']);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');

  // Modals & Action State
  const [activeAction, setActiveAction] = useState(null);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);

  // Form State for Teacher Create / Edit
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

  // Load Teacher Profile & Classes
  const fetchTeacherData = useCallback(async () => {
    try {
      let tClasses = [];
      let profile = null;

      try {
        const profRes = await getAuthenticatedTeacherProfileAPI();
        if (profRes && profRes.success && profRes.teacher) {
          profile = profRes.teacher;
          setTeacherProfile(profile);
          if (Array.isArray(profile.permissions) && profile.permissions.length > 0) {
            tClasses = [...new Set(profile.permissions.map(p => p.class_name))];
          } else if (Array.isArray(profile.classes)) {
            tClasses = profile.classes;
          }
        }
      } catch (pErr) {
        console.warn('Profile fetch notice:', pErr);
      }

      if (tClasses.length === 0 && teacherId) {
        const allocRes = await getTeacherAllocationsAPI(teacherId);
        if (allocRes && allocRes.success && Array.isArray(allocRes.classes)) {
          tClasses = allocRes.classes;
        } else {
          const res = await getTeacherByIdAPI(teacherId);
          if (res.success && res.teacher) {
            profile = res.teacher;
            setTeacherProfile(profile);
            tClasses = res.teacher.classes || [];
          }
        }
      }

      const uniqueClasses = Array.from(new Set(['All Students', ...tClasses]));
      setAssignedClasses(uniqueClasses);
    } catch (err) {
      console.warn('Teacher profile fetch notice:', err);
    }
  }, [teacherId]);

  // Fetch Announcements
  const fetchAnnouncements = useCallback(async () => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getAnnouncementsAPI({
        role: 'Teacher',
        teacherId
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
  }, [teacherId]);

  useEffect(() => {
    fetchTeacherData();
    fetchAnnouncements();
  }, [fetchTeacherData, fetchAnnouncements]);

  const handleCloseModal = () => {
    setActiveAction(null);
    setSelectedAnnouncement(null);
    setFormError('');
  };

  const handleOpenCreateModal = () => {
    setSelectedAnnouncement(null);
    setFormState({
      title: '',
      content: '',
      audience: 'Students',
      targetClass: assignedClasses.length > 1 ? assignedClasses[1] : 'All Students',
      targetSubject: '',
      announcementDate: new Date().toISOString().split('T')[0],
      expiryDate: '',
      attachment: '',
      status: 'Published'
    });
    setFormError('');
    setActiveAction('create');
  };

  const checkIsMine = useCallback((ann) => {
    if (!ann) return false;
    const currentTeacherDbId = teacherProfile?.id;
    const currentTeacherCode = teacherProfile?.teacher_id;
    const currentTeacherName = teacherProfile?.name ? teacherProfile.name.toLowerCase() : '';

    const creatorRole = (ann.createdByRole || '').toLowerCase();
    const isTeacherRole = creatorRole === 'teacher';

    const creatorId = ann.createdBy ? String(ann.createdBy) : null;
    const creatorName = ann.createdByName ? ann.createdByName.toLowerCase() : '';

    const matchesId = creatorId && (
      creatorId === String(currentTeacherDbId) ||
      creatorId === String(currentTeacherCode) ||
      creatorId === String(teacherId)
    );

    const matchesName = currentTeacherName && creatorName && creatorName.includes(currentTeacherName.split(' ')[0]);

    if (matchesId || matchesName) {
      return true;
    }

    if (isTeacherRole) {
      return true;
    }

    return false;
  }, [teacherProfile, teacherId]);

  const handleOpenViewModal = (ann) => {
    setSelectedAnnouncement(ann);
    setActiveAction('view');
  };

  const handleOpenEditModal = (ann) => {
    if (!checkIsMine(ann)) {
      setApiError('Forbidden: Teachers cannot edit Admin announcements.');
      return;
    }
    setSelectedAnnouncement(ann);
    setFormState({
      title: ann.title || '',
      content: ann.content || ann.message || '',
      audience: 'Students',
      targetClass: ann.targetClass || 'All Students',
      targetSubject: ann.targetSubject || '',
      announcementDate: ann.announcementDate ? new Date(ann.announcementDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      expiryDate: ann.expiryDate ? new Date(ann.expiryDate).toISOString().split('T')[0] : '',
      attachment: ann.attachment || '',
      status: ann.status || 'Published'
    });
    setFormError('');
    setActiveAction('edit');
  };

  const handleOpenDeleteModal = (ann) => {
    if (!checkIsMine(ann)) {
      setApiError('Forbidden: Teachers cannot delete Admin announcements.');
      return;
    }
    setSelectedAnnouncement(ann);
    setActiveAction('delete');
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formState.title || !formState.title.trim()) {
      setFormError('Please enter announcement title.');
      return;
    }
    if (!formState.content || !formState.content.trim()) {
      setFormError('Please enter announcement content.');
      return;
    }

    setIsSubmitting(true);
    try {
      if (activeAction === 'edit' && selectedAnnouncement) {
        const res = await updateAnnouncementAPI(
          selectedAnnouncement._id,
          { ...formState, createdByRole: 'Teacher', createdBy: teacherId },
          'Teacher',
          teacherId
        );
        if (res.success) {
          handleCloseModal();
          fetchAnnouncements();
        } else {
          setFormError(res.message || 'Failed to update announcement.');
        }
      } else if (activeAction === 'create') {
        const res = await createAnnouncementAPI(
          {
            ...formState,
            audience: 'Students',
            createdByRole: 'Teacher',
            createdBy: teacherId,
            createdByName: teacherProfile ? teacherProfile.name : 'Teacher'
          },
          'Teacher',
          teacherId
        );
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

  const handleDeleteConfirm = async () => {
    if (!selectedAnnouncement) return;
    setIsSubmitting(true);
    try {
      const res = await deleteAnnouncementAPI(selectedAnnouncement._id, 'Teacher', teacherId);
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
    <TeacherLayout>
      <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {/* Header Bar */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '0.75rem' }}>
          <div>
            <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E3A8A', margin: 0 }}>
              Class & Student Announcements
            </h2>
            <p style={{ fontSize: '0.85rem', color: '#64748B', margin: '2px 0 0 0' }}>
              Publish notices directly to your assigned student classes.
            </p>
          </div>

          <button className="add-schedule-btn" onClick={handleOpenCreateModal}>
            <Plus size={18} /> Post Student Announcement
          </button>
        </div>

        {apiError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Announcement Grid */}
        <div style={{ background: '#FFFFFF', borderRadius: '12px', border: '1px solid #E2DBD0', padding: '1.25rem', boxShadow: '0 4px 14px rgba(0, 0, 0, 0.04)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Megaphone size={18} color="#1E3A8A" />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E3A8A', margin: 0 }}>
              Notice Board
            </h3>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#666' }}>
              <Loader2 size={32} className="spin-icon" style={{ margin: '0 auto 0.75rem auto', color: '#1E3A8A' }} />
              <div>Loading announcements...</div>
            </div>
          ) : announcements.length > 0 ? (
            <div className="announcements-grid">
              {announcements.map((a) => {
                const isMine = checkIsMine(a);
                return (
                  <AnnouncementCard
                    key={a._id}
                    announcement={a}
                    role="Teacher"
                    isMine={isMine}
                    onView={(ann) => handleOpenViewModal(ann)}
                    onEdit={isMine ? (ann) => handleOpenEditModal(ann) : null}
                    onDelete={isMine ? (ann) => handleOpenDeleteModal(ann) : null}
                  />
                );
              })}
            </div>
          ) : (
            <div className="empty-state-box" style={{ padding: '3rem', textAlign: 'center' }}>
              <Megaphone size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
              <div className="empty-state-text">No announcements posted yet.</div>
            </div>
          )}
        </div>

        {/* CREATE / EDIT MODAL */}
        {(activeAction === 'create' || activeAction === 'edit') && (
          <div
            className="modal-overlay"
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.65)' }}
            onClick={handleCloseModal}
          >
            <div
              className="action-modal-card"
              style={{ width: 'min(620px, 92vw)', maxHeight: '90vh', overflowY: 'auto', background: '#FFFFFF', borderRadius: '8px', padding: '1.5rem' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #E2DBD0', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#1E3A8A', fontWeight: 800, margin: 0 }}>
                  {activeAction === 'edit' ? 'Edit Student Announcement' : 'Post Student Announcement'}
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
                    placeholder="e.g. Mathematics Chapter 4 Homework Notice"
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '4px', border: '1px solid #C4C4C4', fontSize: '0.9rem' }}
                    value={formState.title}
                    onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Audience (Fixed)</label>
                    <div style={{ padding: '0.55rem 0.85rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '4px', fontSize: '0.9rem', fontWeight: 800, color: '#334155', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Lock size={14} color="#64748B" /> Students Only
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Target Class *</label>
                    <select
                      style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '4px', border: '1px solid #C4C4C4', fontSize: '0.9rem', background: '#FFF' }}
                      value={formState.targetClass}
                      onChange={(e) => setFormState({ ...formState, targetClass: e.target.value })}
                    >
                      {assignedClasses.map(cls => (
                        <option key={cls} value={cls}>{cls}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Announcement Message *</label>
                  <textarea
                    required
                    rows={4}
                    placeholder="Write detailed announcement message for students..."
                    style={{ width: '100%', padding: '0.55rem 0.85rem', borderRadius: '4px', border: '1px solid #C4C4C4', fontSize: '0.9rem', fontFamily: 'inherit', resize: 'vertical' }}
                    value={formState.content}
                    onChange={(e) => setFormState({ ...formState, content: e.target.value })}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
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
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.75rem' }}>
                  <button type="button" className="clear-btn-submit" onClick={handleCloseModal} disabled={isSubmitting}>
                    Cancel
                  </button>
                  <button type="submit" className="add-schedule-btn" style={{ padding: '0.55rem 1.75rem' }} disabled={isSubmitting}>
                    {isSubmitting ? 'Saving...' : activeAction === 'edit' ? 'Update Announcement' : 'Post Announcement'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW MODAL */}
        {activeAction === 'view' && selectedAnnouncement && (
          <div
            className="modal-overlay"
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.65)' }}
            onClick={handleCloseModal}
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
                <X size={20} style={{ cursor: 'pointer' }} onClick={handleCloseModal} />
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem', fontSize: '0.85rem', flexWrap: 'wrap' }}>
                <span style={{ background: '#DBEAFE', padding: '0.15rem 0.6rem', borderRadius: '4px', fontWeight: 700, color: '#1E40AF' }}>
                  Target Class: {selectedAnnouncement.targetClass || 'All Students'}
                </span>
                <span style={{ color: '#666', fontWeight: 700, alignSelf: 'center' }}>
                  Date: {new Date(selectedAnnouncement.announcementDate).toLocaleDateString('en-GB')}
                </span>
              </div>

              <div style={{ background: '#F8FAFC', padding: '1.25rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.95rem', lineHeight: 1.6, color: '#171717', marginBottom: '1.25rem', whiteSpace: 'pre-line' }}>
                {selectedAnnouncement.content || selectedAnnouncement.message}
              </div>

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
            style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0, 0, 0, 0.65)' }}
            onClick={handleCloseModal}
          >
            <div
              className="action-modal-card"
              style={{ width: 'min(400px, 92vw)', background: '#FFFFFF', borderRadius: '8px', padding: '1.5rem', textAlign: 'center' }}
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
                <button className="btn-act-delete" onClick={handleDeleteConfirm} style={{ padding: '0.55rem 1.5rem' }} disabled={isSubmitting}>
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherAnnouncements;
