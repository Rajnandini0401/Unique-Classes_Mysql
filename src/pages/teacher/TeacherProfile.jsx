import React, { useState, useEffect, useContext } from 'react';
import TeacherLayout from '../../layouts/TeacherLayout';
import TeacherModal from '../../components/teacher/TeacherModal';
import { getAuthenticatedTeacherProfileAPI, updateTeacherAPI } from '../../services/api';
import { getTeacherPhotoUrl, handleImageError } from '../../utils/photoUtils';
import { AuthContext } from '../../context/AuthContext';
import {
  User,
  Mail,
  Phone,
  BookOpen,
  GraduationCap,
  Calendar,
  Award,
  Edit,
  Save,
  ShieldCheck,
  RotateCw
} from 'lucide-react';
import '../../styles/teacher/teacher-pages.css';

const TeacherProfile = () => {
  const { teacherProfile: contextProfile } = useContext(AuthContext) || {};
  const [profile, setProfile] = useState({
    teacher_id: '',
    name: '',
    title: 'Faculty',
    photo: '',
    email: '',
    phone: '',
    subject: '',
    classes: [],
    permissions: [],
    education: '',
    experience: 'Teaching Faculty',
    joiningDate: '',
    bio: ''
  });
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState(profile);
  const [teacherDbId, setTeacherDbId] = useState('');

  const fetchProfile = async () => {
    setLoading(true);
    try {
      const res = await getAuthenticatedTeacherProfileAPI();
      if (res && res.success && res.teacher) {
        const t = res.teacher;
        setTeacherDbId(t.id || t._id);
        const photoVal = t.photo || '';
        setProfile({
          teacher_id: t.teacher_id || '',
          name: t.name || t.fullname || '',
          title: 'Faculty',
          photo: photoVal,
          email: t.email || '',
          phone: t.mobile || t.phone || '',
          subject: Array.isArray(t.subjects) ? t.subjects.join(', ') : (t.subjects || ''),
          classes: Array.isArray(t.classes) ? t.classes : [],
          permissions: Array.isArray(t.permissions) ? t.permissions : [],
          education: t.education || t.qualification || '',
          experience: 'Teaching Faculty',
          joiningDate: t.created_at || t.createdAt ? new Date(t.created_at || t.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' }) : '',
          bio: `Educator at Unique Classes, Nilanga.`
        });
      } else if (contextProfile) {
        setProfile({
          teacher_id: contextProfile.teacher_id || '',
          name: contextProfile.name || '',
          title: 'Faculty',
          photo: contextProfile.photo || '',
          email: contextProfile.email || '',
          phone: contextProfile.mobile || '',
          subject: Array.isArray(contextProfile.subjects) ? contextProfile.subjects.join(', ') : '',
          classes: contextProfile.classes || [],
          permissions: contextProfile.permissions || [],
          education: contextProfile.education || '',
          experience: 'Teaching Faculty',
          joiningDate: '',
          bio: `Educator at Unique Classes, Nilanga.`
        });
      }
    } catch (err) {
      console.warn('TeacherProfile: Failed to load teacher info', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleOpenEditModal = () => {
    setEditForm(profile);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      if (teacherDbId) {
        await updateTeacherAPI(teacherDbId, {
          name: editForm.name,
          email: editForm.email,
          mobile: editForm.phone,
          education: editForm.education
        });
      }
      setProfile(editForm);
    } catch (err) {
      console.error('Failed to update teacher profile', err);
      setProfile(editForm);
    } finally {
      setIsEditModalOpen(false);
    }
  };

  return (
    <TeacherLayout>
      <div className="teacher-page-container">
        {loading ? (
          <div className="teacher-card-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <RotateCw size={32} color="#D4AF37" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: '#555', fontWeight: 600 }}>Loading teacher profile details...</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        ) : (
          <div className="teacher-profile-card">
            <div className="teacher-profile-header-bg" />

            <div className="teacher-profile-body">
              <div className="teacher-profile-top-row">
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '1.5rem', flexWrap: 'wrap' }}>
                  <div className="teacher-profile-photo-wrapper">
                    <img
                      src={getTeacherPhotoUrl(profile.photo)}
                      alt={profile.name}
                      className="teacher-profile-photo"
                      onLoad={(e) => { e.target.style.display = 'block'; }}
                      onError={handleImageError}
                    />
                  </div>
                  <div>
                    <h2 style={{ fontFamily: 'Outfit', fontSize: '1.8rem', fontWeight: 800, margin: '0 0 0.2rem 0', color: '#171717' }}>
                      {profile.name}
                    </h2>
                    <span style={{ fontSize: '0.98rem', fontWeight: 700, color: 'var(--color-metallic-gold)' }}>
                      {profile.teacher_id ? `ID: ${profile.teacher_id} • ` : ''}{profile.subject}
                    </span>
                  </div>
                </div>

                <button
                  className="teacher-btn teacher-btn-primary"
                  onClick={handleOpenEditModal}
                  style={{ padding: '0.75rem 1.5rem' }}
                >
                  <Edit size={16} />
                  <span>Edit Profile</span>
                </button>
              </div>

              {/* Profile Bio */}
              <div style={{ background: '#FAF7F0', padding: '1.25rem', borderRadius: '12px', border: '1px solid var(--border-light)', marginTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', fontSize: '0.92rem', color: '#777777', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  Professional Biography
                </h4>
                <p style={{ margin: 0, color: '#374151', lineHeight: '1.5', fontSize: '0.95rem' }}>
                  {profile.bio}
                </p>
              </div>

              {/* Profile Details Grid */}
              <div className="teacher-profile-details-grid" style={{ marginTop: '1.5rem' }}>
                <div className="teacher-profile-info-item">
                  <span className="teacher-info-label">Teacher Business ID</span>
                  <span className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#2563EB' }}>
                    <ShieldCheck size={16} color="#2563EB" /> {profile.teacher_id || 'N/A'}
                  </span>
                </div>

                <div className="teacher-profile-info-item">
                  <span className="teacher-info-label">Full Name</span>
                  <span className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <User size={16} color="#D4AF37" /> {profile.name}
                  </span>
                </div>

                <div className="teacher-profile-info-item">
                  <span className="teacher-info-label">Email Address</span>
                  <span className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Mail size={16} color="#D4AF37" /> {profile.email}
                  </span>
                </div>

                <div className="teacher-profile-info-item">
                  <span className="teacher-info-label">Mobile Number</span>
                  <span className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Phone size={16} color="#D4AF37" /> {profile.phone}
                  </span>
                </div>

                <div className="teacher-profile-info-item">
                  <span className="teacher-info-label">Teaching Subject(s)</span>
                  <span className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <BookOpen size={16} color="#D4AF37" /> {profile.subject || 'N/A'}
                  </span>
                </div>

                <div className="teacher-profile-info-item">
                  <span className="teacher-info-label">Academic Qualifications</span>
                  <span className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <GraduationCap size={16} color="#D4AF37" /> {profile.education || 'N/A'}
                  </span>
                </div>

                <div className="teacher-profile-info-item" style={{ gridColumn: 'span 2' }}>
                  <span className="teacher-info-label">Assigned Class & Subject Permissions</span>
                  <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                    {profile.permissions && profile.permissions.length > 0 ? (
                      profile.permissions.map((perm, idx) => (
                        <span key={idx} className="teacher-badge-pill" style={{ background: '#151515', color: '#F4C542', fontSize: '0.85rem', padding: '0.3rem 0.75rem' }}>
                          {perm.class_name} Standard - {perm.subject_name}
                        </span>
                      ))
                    ) : (
                      profile.classes.map((cls, idx) => (
                        <span key={idx} className="teacher-badge-pill" style={{ background: '#151515', color: '#F4C542' }}>
                          {cls} Standard
                        </span>
                      ))
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ==================================================
          EDIT PROFILE CENTERED FIXED MODAL (Portal)
         ================================================== */}
      <TeacherModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Teacher Profile Information"
        maxWidth="600px"
      >
        <form onSubmit={handleEditSubmit}>
          <div className="teacher-form-group">
            <label>Full Name *</label>
            <input
              type="text"
              required
              className="teacher-form-input"
              value={editForm.name}
              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
            />
          </div>

          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="teacher-form-group">
              <label>Email Address *</label>
              <input
                type="email"
                required
                className="teacher-form-input"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
              />
            </div>
            <div className="teacher-form-group">
              <label>Mobile Number *</label>
              <input
                type="text"
                required
                className="teacher-form-input"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="teacher-form-group">
              <label>Subject Specialization</label>
              <input
                type="text"
                className="teacher-form-input"
                value={editForm.subject}
                onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
              />
            </div>
            <div className="teacher-form-group">
              <label>Education Qualifications</label>
              <input
                type="text"
                className="teacher-form-input"
                value={editForm.education}
                onChange={(e) => setEditForm({ ...editForm, education: e.target.value })}
              />
            </div>
          </div>

          <div className="teacher-form-group">
            <label>Biography / Summary</label>
            <textarea
              rows="3"
              className="teacher-form-textarea"
              value={editForm.bio}
              onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
            />
          </div>

          <div className="teacher-modal-actions">
            <button
              type="button"
              className="teacher-btn-cancel"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button type="submit" className="teacher-btn-submit">
              <Save size={16} /> Save Profile Changes
            </button>
          </div>
        </form>
      </TeacherModal>
    </TeacherLayout>
  );
};

export default TeacherProfile;
