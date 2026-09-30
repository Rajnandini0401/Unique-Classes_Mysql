import React, { useState, useEffect } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import {
  User,
  Phone,
  Mail,
  MapPin,
  Calendar,
  BookOpen,
  GraduationCap,
  Award,
  ShieldCheck,
  Building,
  CheckCircle2,
  Clock,
  Sparkles,
  Loader2,
  AlertCircle
} from 'lucide-react';
import { getCurrentStudentProfileAPI } from '../../services/api';
import { getStudentPhotoUrl, handleImageError } from '../../utils/photoUtils';

const StudentProfile = () => {
  const [student, setStudent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const fetchStudentProfile = async () => {
      setLoading(true);
      setErrorMsg('');
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const queryStudentId = searchParams.get('studentId') || searchParams.get('id');
        if (queryStudentId) {
          localStorage.setItem('studentId', queryStudentId);
          localStorage.setItem('currentStudentId', queryStudentId);
        }
        const savedStudentId = queryStudentId || localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
        const res = await getCurrentStudentProfileAPI(savedStudentId || undefined);

        if (res.success && res.student) {
          setStudent(res.student);
        } else {
          setErrorMsg('Unable to locate active student profile.');
        }
      } catch (err) {
        console.error('Error fetching student profile:', err);
        setErrorMsg('Failed to load profile details from MongoDB server.');
      } finally {
        setLoading(false);
      }
    };

    fetchStudentProfile();
  }, []);

  if (loading) {
    return (
      <StudentLayout>
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ color: '#1E3A8A', fontWeight: 800 }}>Loading My Profile...</div>
        </div>
      </StudentLayout>
    );
  }

  if (errorMsg || !student) {
    return (
      <StudentLayout>
        <div className="student-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <AlertCircle size={48} color="#DC2626" style={{ margin: '0 auto 0.5rem auto' }} />
          <h3 style={{ color: '#1E293B', margin: 0 }}>{errorMsg || 'Student Profile Not Found'}</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.3rem' }}>Please verify login credentials or contact administration.</p>
        </div>
      </StudentLayout>
    );
  }

  const dobFormatted = student.dateOfBirth
    ? new Date(student.dateOfBirth).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '--';

  const admissionFormatted = student.admissionDate
    ? new Date(student.admissionDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
    : '--';

  const registeredSubjects = Array.isArray(student.subjects) && student.subjects.length > 0
    ? student.subjects
    : ['Math', 'Science', 'English'];

  return (
    <StudentLayout student={student}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* HERO PROFILE CARD */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
            color: '#FFFFFF',
            borderRadius: '16px',
            padding: '1.5rem',
            marginBottom: '1.25rem',
            boxShadow: '0 4px 20px rgba(30, 58, 138, 0.15)',
            display: 'flex',
            alignItems: 'center',
            gap: '1.25rem',
            flexWrap: 'wrap'
          }}
        >
          {/* Student Photo */}
          <div style={{ position: 'relative', width: '100px', height: '100px', borderRadius: '50%', border: '3px solid #D4AF37', overflow: 'hidden', background: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {getStudentPhotoUrl(student.photo) ? (
              <>
                <img
                  src={getStudentPhotoUrl(student.photo)}
                  alt={student.name}
                  style={{
                    width: '100%',
                    height: '100%',
                    borderRadius: '50%',
                    objectFit: 'cover'
                  }}
                  onError={(e) => handleImageError(e, '')}
                />
                <div
                  className="photo-fallback"
                  style={{ display: 'none', width: '100%', height: '100%', alignItems: 'center', justifyContent: 'center', color: '#FFFFFF', fontWeight: 900, fontSize: '2rem' }}
                >
                  {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                </div>
              </>
            ) : (
              <div style={{ color: '#FFFFFF', fontWeight: 900, fontSize: '2rem' }}>
                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
              </div>
            )}
            <span
              style={{
                position: 'absolute',
                bottom: 2,
                right: 2,
                background: '#059669',
                color: '#FFFFFF',
                fontSize: '0.65rem',
                fontWeight: 900,
                padding: '2px 6px',
                borderRadius: '10px',
                border: '1px solid #FFFFFF'
              }}
            >
              {student.status || 'Active'}
            </span>
          </div>

          {/* Core Info */}
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              OFFICIAL STUDENT RECORD
            </div>
            <h1 style={{ margin: '0.2rem 0 0.4rem 0', fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF' }}>
              {student.name}
            </h1>

            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', fontSize: '0.82rem', opacity: 0.95 }}>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                Class: <strong>{student.standard}</strong>
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                Roll No: <strong>{student.rollNo || '--'}</strong>
              </span>
              <span style={{ background: 'rgba(255,255,255,0.15)', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                ID: <strong>{student.studentId}</strong>
              </span>
            </div>
          </div>
        </div>

        {/* 2-COLUMN DETAILS GRID */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.1rem' }}>

          {/* 1. ACADEMIC INFORMATION */}
          <div className="student-card" style={{ marginBottom: 0 }}>
            <div className="student-card-title">
              <h3>
                <GraduationCap size={18} color="#1E3A8A" /> Academic Details
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Standard / Class</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{student.standard} Standard</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Medium</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{student.medium || 'Semi-English'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>School Name</span>
                <span style={{ fontWeight: 800, color: '#0F172A', textAlign: 'right', maxWidth: '180px' }}>{student.schoolName || '--'}</span>
              </div>

              {student.courseStream && (
                <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.4rem' }}>
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Course Stream</span>
                  <span style={{ fontWeight: 800, color: '#1E3A8A' }}>{student.courseStream}</span>
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Admission Date</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{admissionFormatted}</span>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '0.4rem' }}>Enrolled Subjects</span>
                <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {registeredSubjects.map((sub, i) => (
                    <span
                      key={i}
                      style={{
                        background: '#DBEAFE',
                        color: '#1E3A8A',
                        fontWeight: 800,
                        fontSize: '0.78rem',
                        padding: '0.2rem 0.6rem',
                        borderRadius: '6px'
                      }}
                    >
                      {sub}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* 2. PERSONAL & CONTACT INFORMATION */}
          <div className="student-card" style={{ marginBottom: 0 }}>
            <div className="student-card-title">
              <h3>
                <User size={18} color="#1E3A8A" /> Personal & Contact Info
              </h3>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', fontSize: '0.88rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Date of Birth</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{dobFormatted}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Student Mobile</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{student.mobile}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Parent / Guardian</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{student.parentName || '--'}</span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px dashed #E2E8F0', paddingBottom: '0.4rem' }}>
                <span style={{ color: '#64748B', fontWeight: 600 }}>Parent Mobile</span>
                <span style={{ fontWeight: 800, color: '#0F172A' }}>{student.parentMobile || '--'}</span>
              </div>

              <div>
                <span style={{ color: '#64748B', fontWeight: 600, display: 'block', marginBottom: '0.2rem' }}>Residential Address</span>
                <span style={{ fontWeight: 700, color: '#334155', fontSize: '0.84rem' }}>{student.address || 'Address not updated'}</span>
              </div>
            </div>
          </div>

        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentProfile;
