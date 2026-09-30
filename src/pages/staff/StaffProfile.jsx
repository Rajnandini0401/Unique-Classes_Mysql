import React, { useEffect, useContext } from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import { AuthContext } from '../../context/AuthContext';
import { getPhotoUrl } from '../../utils/photoUtils';
import { User, Mail, Phone, MapPin, Award, Shield, CheckCircle2, Briefcase, FileText, Loader2 } from 'lucide-react';
import '../../styles/teacher/teacher-pages.css';

const StaffProfile = () => {
  const { user, staffProfile, fetchStaffProfile } = useContext(AuthContext) || {};

  useEffect(() => {
    fetchStaffProfile();
  }, [fetchStaffProfile]);

  const profile = staffProfile || {
    name: user?.staffName || user?.name || 'Loading Staff Profile...',
    staff_id: user?.staffBusinessId || '',
    responsibility: 'Office Staff',
    education: '',
    mobile: '',
    address: '',
    status: 'Active'
  };

  const emailVal = user?.email || (profile.staff_id ? `${profile.staff_id.toLowerCase()}@staff.uniqueclasses.com` : 'staff@uniqueclasses.com');
  const avatarSrc = getPhotoUrl(profile.photo, 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&q=80&w=400');

  return (
    <StaffLayout>
      <div className="teacher-page-container">
        {/* Banner */}
        <div className="teacher-welcome-banner">
          <div className="teacher-welcome-text">
            <h2>Staff Profile 👤</h2>
            <p>View your official staff details, job responsibilities, and system access permissions.</p>
          </div>
        </div>

        {/* Profile Card */}
        <div className="teacher-card-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap', paddingBottom: '1.5rem', borderBottom: '1px solid var(--border-light)' }}>
            <img
              src={avatarSrc}
              alt={profile.name}
              style={{ width: '96px', height: '96px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #D4AF37', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
                <h3 style={{ margin: 0, color: '#171717', fontSize: '1.4rem', fontWeight: 900 }}>{profile.name}</h3>
                <span className="badge badge-dark" style={{ fontSize: '0.75rem', background: '#1E3A8A', color: '#FFF' }}>
                  ID: {profile.staff_id || profile.staffId}
                </span>
              </div>
              <p style={{ margin: '0 0 0.5rem 0', color: '#475569', fontWeight: 700, fontSize: '0.95rem' }}>
                {profile.responsibility || 'Academic Counselor & Administrative Staff'}
              </p>
              <span className="teacher-badge-pill" style={{ background: '#10B981', color: '#FFFFFF' }}>
                <CheckCircle2 size={12} style={{ display: 'inline', marginRight: '4px' }} /> {profile.status || 'Active Staff'}
              </span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem', marginTop: '1.5rem' }}>
            <div className="teacher-form-group">
              <label>Staff ID</label>
              <div className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800, color: '#1E3A8A' }}>
                <Award size={16} color="#D4AF37" /> {profile.staff_id || profile.staffId || '-'}
              </div>
            </div>

            <div className="teacher-form-group">
              <label>Mobile Number</label>
              <div className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Phone size={16} color="#D4AF37" /> {profile.mobile || '-'}
              </div>
            </div>

            <div className="teacher-form-group">
              <label>Educational Qualification</label>
              <div className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Briefcase size={16} color="#D4AF37" /> {profile.education || '-'}
              </div>
            </div>

            <div className="teacher-form-group">
              <label>Email Address</label>
              <div className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Mail size={16} color="#D4AF37" /> {emailVal || '-'}
              </div>
            </div>

            <div className="teacher-form-group" style={{ gridColumn: 'span 2' }}>
              <label>Residential Address</label>
              <div className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <MapPin size={16} color="#D4AF37" /> {profile.address || '-'}
              </div>
            </div>

            <div className="teacher-form-group" style={{ gridColumn: 'span 2' }}>
              <label>Job Responsibilities & Assignments</label>
              <div className="teacher-info-val" style={{ background: '#F8FAFC', padding: '0.85rem', borderRadius: '6px', border: '1px solid #E2E8F0', lineHeight: 1.5, color: '#1E293B', fontWeight: 600 }}>
                <FileText size={16} color="#D4AF37" style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                {profile.responsibility || '-'}
              </div>
            </div>

            <div className="teacher-form-group" style={{ gridColumn: 'span 2' }}>
              <label>System Permission Role</label>
              <div className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E3A8A', fontWeight: 700 }}>
                <Shield size={16} color="#D4AF37" /> Office Staff Access (Admission, Attendance, Tests, Student Roster)
              </div>
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffProfile;
