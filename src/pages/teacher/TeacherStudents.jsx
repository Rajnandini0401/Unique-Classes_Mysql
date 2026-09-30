import React, { useState, useEffect, useCallback, useContext } from 'react';
import TeacherLayout from '../../layouts/TeacherLayout';
import TeacherModal from '../../components/teacher/TeacherModal';
import { AuthContext } from '../../context/AuthContext';
import {
  getAuthenticatedTeacherProfileAPI,
  getAttendanceStudentsAPI,
  getStudentsAPI,
  getStudentByIdAPI
} from '../../services/api';
import { getStudentPhotoUrl, handleImageError } from '../../utils/photoUtils';
import {
  Search,
  Users,
  Eye,
  Phone,
  UserCheck,
  Award,
  RotateCw,
  AlertCircle,
  UserX,
  GraduationCap,
  Building,
  Calendar,
  MapPin,
  FileText
} from 'lucide-react';
import '../../styles/teacher/teacher-pages.css';

const TeacherStudents = () => {
  const { teacherProfile: contextProfile } = useContext(AuthContext) || {};
  const [teacher, setTeacher] = useState(contextProfile || null);

  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [allocatedClasses, setAllocatedClasses] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loadingStudentDetail, setLoadingStudentDetail] = useState(false);

  // Fetch teacher profile & allocated classes on mount
  useEffect(() => {
    const fetchProfileAndAllocations = async () => {
      try {
        let tProfile = teacher;
        if (!tProfile) {
          const res = await getAuthenticatedTeacherProfileAPI();
          if (res && res.success && res.teacher) {
            tProfile = res.teacher;
            setTeacher(tProfile);
          }
        }

        if (tProfile) {
          let classes = [];
          if (Array.isArray(tProfile.classes) && tProfile.classes.length > 0) {
            classes = tProfile.classes;
          } else if (Array.isArray(tProfile.permissions) && tProfile.permissions.length > 0) {
            classes = [...new Set(tProfile.permissions.map(p => p.class_name).filter(Boolean))];
          }
          setAllocatedClasses(classes);
        }
      } catch (err) {
        console.warn('TeacherStudents: Profile allocation fetch notice', err);
      }
    };
    fetchProfileAndAllocations();
  }, [teacher]);

  // Fetch real students from MySQL Database with teacher (Class + Subject) scoping
  const fetchStudents = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await getAttendanceStudentsAPI({
        teacherId: teacher?.id || teacher?._id || undefined,
        standard: classFilter !== 'All' ? classFilter : undefined,
        search: searchTerm
      });
      if (res && res.success) {
        setStudents(res.students || []);
      } else {
        setErrorMsg('Unable to load student directory.');
      }
    } catch (err) {
      console.error('Fetch Students Error:', err);
      setErrorMsg('Unable to load student directory from database.');
    } finally {
      setLoading(false);
    }
  }, [classFilter, searchTerm]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  // Open detailed student information modal
  const handleOpenStudentModal = async (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
    setLoadingStudentDetail(true);

    try {
      const targetId = student.id || student._id;
      if (targetId) {
        const res = await getStudentByIdAPI(targetId);
        if (res && res.success && res.student) {
          setSelectedStudent({
            ...student,
            ...res.student
          });
        }
      }
    } catch (e) {
      console.warn('Student detail fetch notice:', e);
    } finally {
      setLoadingStudentDetail(false);
    }
  };

  return (
    <TeacherLayout activePage="students">
      <div className="teacher-page-container">
        {/* Header */}
        <div className="teacher-welcome-banner">
          <div className="teacher-welcome-text">
            <h2>Student Directory 👨‍🎓</h2>
            <p>Access live student roster, roll numbers, and parent contact details directly from database.</p>
          </div>
          <div className="teacher-welcome-actions">
            <span className="teacher-badge-pill" style={{ background: 'rgba(212,175,55,0.2)', color: '#F4C542', border: '1px solid #D4AF37' }}>
              {students.length} Enrolled Students
            </span>
          </div>
        </div>

        {/* Search & Class Filter Bar */}
        <div className="teacher-card-panel">
          <div className="teacher-search-bar" style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '1.25rem' }}>
            <div className="teacher-search-input-wrapper" style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
              <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#888' }} />
              <input
                type="text"
                className="teacher-search-input"
                placeholder="Search student by name, ID, roll no, or mobile..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ paddingLeft: '2.4rem', width: '100%', height: '40px', borderRadius: '6px', border: '1px solid #D1D5DB', boxSizing: 'border-box' }}
              />
            </div>

            <select
              className="teacher-select-filter"
              value={classFilter}
              onChange={(e) => setClassFilter(e.target.value)}
              style={{ height: '40px', padding: '0 1rem', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#FFF', fontWeight: 700 }}
            >
              <option value="All">All Assigned Classes</option>
              {allocatedClasses.map((cls) => (
                <option key={cls} value={cls}>{cls} Standard</option>
              ))}
            </select>
          </div>

          {/* Loading State */}
          {loading && (
            <div style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
              <RotateCw size={32} color="#D4AF37" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '0.85rem', color: '#666', fontWeight: 600 }}>Loading student directory from database...</p>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          )}

          {/* Error State */}
          {!loading && errorMsg && (
            <div style={{ textAlign: 'center', padding: '2rem', color: '#DC2626' }}>
              <AlertCircle size={32} style={{ marginBottom: '0.5rem' }} />
              <p>{errorMsg}</p>
              <button className="teacher-btn teacher-btn-primary teacher-btn-sm" onClick={fetchStudents}>
                <RotateCw size={14} /> Retry
              </button>
            </div>
          )}

          {/* Students Table */}
          {!loading && !errorMsg && (
            <div className="teacher-table-responsive">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Photo</th>
                    <th>Roll No</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Class / Standard</th>
                    <th>Mobile Number</th>
                    <th>Parent Contact</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((std) => {
                    const photoUrl = getStudentPhotoUrl(std.photo);
                    const displayName = std.fullname || std.name || std.full_name || std.student_name || 'Student';
                    const displayId = std.studentId || std.student_id || std.studentCode || std.student_code || 'N/A';
                    const displayRoll = std.rollNo || std.roll_no || 'N/A';
                    const displayStandard = std.standard || std.className || '10th';
                    const displayMobile = std.mobile || std.phone || 'N/A';
                    const displayParentMobile = std.parentMobile || std.parent_phone || std.whatsapp_number || std.mobile || std.phone || 'N/A';

                    return (
                      <tr key={std.id || std._id || displayId}>
                        <td>
                          <div style={{ width: '36px', height: '36px', borderRadius: '50%', background: '#151515', color: '#F4C542', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.85rem', overflow: 'hidden', border: '1px solid #D4AF37' }}>
                            {photoUrl ? (
                              <img src={photoUrl} alt={displayName} onError={handleImageError} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                            ) : (
                              displayName.charAt(0).toUpperCase()
                            )}
                          </div>
                        </td>
                        <td style={{ fontWeight: 800, color: '#171717' }}>{displayRoll}</td>
                        <td style={{ fontWeight: 800, color: '#1D4ED8' }}>{displayId}</td>
                        <td style={{ fontWeight: 700, color: '#171717' }}>{displayName}</td>
                        <td>
                          <span className="teacher-badge scheduled">{displayStandard.includes('Standard') ? displayStandard : `${displayStandard} Standard`}</span>
                        </td>
                        <td>{displayMobile}</td>
                        <td>{displayParentMobile}</td>
                        <td style={{ textAlign: 'center' }}>
                          <button
                            className="teacher-btn teacher-btn-outline teacher-btn-sm"
                            onClick={() => handleOpenStudentModal(std)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                          >
                            <Eye size={14} /> Details
                          </button>
                        </td>
                      </tr>
                    );
                  })}

                  {students.length === 0 && (
                    <tr>
                      <td colSpan="8" style={{ textAlign: 'center', padding: '3rem', color: '#777777' }}>
                        <UserX size={36} color="#CCCCCC" style={{ marginBottom: '0.5rem' }} />
                        <div style={{ fontWeight: 600, fontSize: '0.95rem' }}>No enrolled students found in database matching your search.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Centered Modal for Student Information */}
        {selectedStudent && (
          <TeacherModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Student Details - ${selectedStudent.fullname || selectedStudent.name}`}
            maxWidth="620px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Header Banner */}
              <div
                style={{
                  background: '#FAF7F0',
                  padding: '1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '1.25rem'
                }}
              >
                <div
                  style={{
                    width: '68px',
                    height: '68px',
                    borderRadius: '50%',
                    background: '#151515',
                    color: '#F4C542',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.6rem',
                    fontWeight: 800,
                    border: '2px solid #D4AF37',
                    overflow: 'hidden',
                    flexShrink: 0
                  }}
                >
                  {getStudentPhotoUrl(selectedStudent.photo) ? (
                    <img
                      src={getStudentPhotoUrl(selectedStudent.photo)}
                      alt={selectedStudent.name}
                      onError={(e) => handleImageError(e, '')}
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    />
                  ) : (
                    (selectedStudent.fullname || selectedStudent.name || 'S').charAt(0).toUpperCase()
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.3rem', color: '#171717' }}>
                    {selectedStudent.fullname || selectedStudent.name}
                  </h3>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.35rem', flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 800, color: '#1D4ED8', fontSize: '0.9rem' }}>
                      ID: {selectedStudent.studentId || selectedStudent.student_id || 'N/A'}
                    </span>
                    <span style={{ color: '#888' }}>•</span>
                    <span style={{ fontWeight: 800, color: '#171717', fontSize: '0.9rem' }}>
                      Roll No: {selectedStudent.rollNo || selectedStudent.roll_no || 'N/A'}
                    </span>
                  </div>
                </div>

                <span
                  className="teacher-badge-pill"
                  style={{ background: '#ECFDF5', color: '#065F46', border: '1px solid #10B981', fontWeight: 800 }}
                >
                  {selectedStudent.status || 'Active'}
                </span>
              </div>

              {/* Student Demographics Grid */}
              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="teacher-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#666' }}>Standard / Class</label>
                  <div className="teacher-info-val" style={{ fontWeight: 700 }}>
                    {selectedStudent.standard || selectedStudent.className || '10th Standard'}
                  </div>
                </div>

                <div className="teacher-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#666' }}>Medium</label>
                  <div className="teacher-info-val" style={{ fontWeight: 700 }}>
                    {selectedStudent.medium || 'Semi-English'}
                  </div>
                </div>

                <div className="teacher-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#666' }}>Student Mobile</label>
                  <div className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    <Phone size={14} color="#D4AF37" /> {selectedStudent.mobile || 'N/A'}
                  </div>
                </div>

                <div className="teacher-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#666' }}>Parent Mobile / WhatsApp</label>
                  <div className="teacher-info-val" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 700 }}>
                    <Phone size={14} color="#D4AF37" /> {selectedStudent.parentMobile || selectedStudent.whatsapp_number || selectedStudent.mobile || 'N/A'}
                  </div>
                </div>

                <div className="teacher-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#666' }}>School Name</label>
                  <div className="teacher-info-val" style={{ fontWeight: 700 }}>
                    {selectedStudent.schoolName || selectedStudent.school_name || 'N/A'}
                  </div>
                </div>

                <div className="teacher-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#666' }}>Date of Birth</label>
                  <div className="teacher-info-val" style={{ fontWeight: 700 }}>
                    {selectedStudent.dateOfBirth || selectedStudent.date_of_birth ? new Date(selectedStudent.dateOfBirth || selectedStudent.date_of_birth).toLocaleDateString() : 'N/A'}
                  </div>
                </div>
              </div>

              {/* Address Box */}
              {selectedStudent.address && (
                <div className="teacher-form-group">
                  <label style={{ fontSize: '0.82rem', fontWeight: 700, color: '#666' }}>Residential Address</label>
                  <div className="teacher-info-val" style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', fontWeight: 600 }}>
                    <MapPin size={16} color="#D4AF37" style={{ marginTop: '2px', flexShrink: 0 }} />
                    <span>{selectedStudent.address}</span>
                  </div>
                </div>
              )}

              {/* Modal Actions */}
              <div className="teacher-modal-actions" style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button
                  className="teacher-btn teacher-btn-primary"
                  onClick={() => setIsModalOpen(false)}
                  style={{ minWidth: '120px' }}
                >
                  Close
                </button>
              </div>
            </div>
          </TeacherModal>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherStudents;
