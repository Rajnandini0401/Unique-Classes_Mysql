import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../layouts/TeacherLayout';
import TeacherModal from '../../components/teacher/TeacherModal';
import { AuthContext } from '../../context/AuthContext';
import {
  getAuthenticatedTeacherProfileAPI,
  getAttendanceStudentsAPI,
  getBatchesAPI,
  getStudentResultsAPI,
  getStudentByIdAPI
} from '../../services/api';
import { getStudentPhotoUrl, handleImageError } from '../../utils/photoUtils';
import {
  BookOpen,
  Users,
  Clock,
  Eye,
  UserCheck,
  Calendar,
  Sparkles,
  RotateCw,
  AlertCircle,
  CheckCircle2,
  Award,
  Search,
  User,
  Phone,
  MapPin,
  HelpCircle,
  BarChart2
} from 'lucide-react';
import '../../styles/teacher/teacher-pages.css';

// Helper to convert 24-hour time string ("19:00" or "05:00") to 12-hour AM/PM ("7:00 PM" or "5:00 AM")
const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

const MyClasses = () => {
  const navigate = useNavigate();
  const { teacherProfile: contextProfile } = useContext(AuthContext) || {};

  // Class Cards State
  const [classesList, setClassesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // View Class Modal State
  const [selectedClass, setSelectedClass] = useState(null);
  const [modalStudents, setModalStudents] = useState([]);
  const [loadingModalStudents, setLoadingModalStudents] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Student Profile Modal State
  const [profileStudent, setProfileStudent] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // 1. Fetch ALL allocated classes & subjects for authenticated teacher
  const fetchTeacherClasses = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      let allocPairs = [];
      let teacherInfo = null;

      const profileRes = await getAuthenticatedTeacherProfileAPI();
      if (profileRes && profileRes.success && profileRes.teacher) {
        teacherInfo = profileRes.teacher;
      } else if (contextProfile) {
        teacherInfo = contextProfile;
      }

      if (teacherInfo) {
        if (Array.isArray(teacherInfo.permissions) && teacherInfo.permissions.length > 0) {
          allocPairs = teacherInfo.permissions.map(p => ({
            standard: p.class_name,
            subject: p.subject_name
          }));
        } else if (Array.isArray(teacherInfo.classes) && teacherInfo.classes.length > 0) {
          const classes = teacherInfo.classes;
          const subjects = Array.isArray(teacherInfo.subjects) && teacherInfo.subjects.length > 0
            ? teacherInfo.subjects
            : ['General'];

          classes.forEach(cls => {
            subjects.forEach(subj => {
              allocPairs.push({ standard: cls, subject: subj });
            });
          });
        }
      }

      let teacherBatches = [];
      try {
        const batchRes = await getBatchesAPI({});
        if (batchRes && batchRes.batches) {
          teacherBatches = batchRes.batches;
        }
      } catch (e) {
        console.warn('MyClasses: Batch schedule fetch notice', e);
      }

      const classCardsData = await Promise.all(
        allocPairs.map(async (pair) => {
          const clsName = pair.standard;
          const subjName = pair.subject;
          let count = 0;
          try {
            const stdRes = await getAttendanceStudentsAPI({ standard: clsName, subject: subjName });
            if (stdRes && stdRes.students) {
              count = stdRes.students.length;
            }
          } catch (e) {
            console.warn(`MyClasses: Student count fetch notice for ${clsName} ${subjName}`, e);
          }

          const matchingBatches = teacherBatches.filter(b => b.standard === clsName && (b.subject.toLowerCase() === subjName.toLowerCase() || ((subjName === 'Math' || subjName === 'Mathematics') && b.subject.toLowerCase().startsWith('math'))));
          
          let timeDisplay = 'Flexible / Not Set';
          let daysDisplay = 'Monday - Friday';

          if (matchingBatches.length === 1) {
            const b = matchingBatches[0];
            timeDisplay = `${formatTime12Hour(b.startTime)} - ${formatTime12Hour(b.endTime)}`;
            daysDisplay = b.schedulePattern || 'Monday - Friday';
          } else if (matchingBatches.length > 1) {
            timeDisplay = matchingBatches.map(b => `${formatTime12Hour(b.startTime)}-${formatTime12Hour(b.endTime)} (${b.schedulePattern === 'Monday-Friday' ? 'M-F' : b.schedulePattern})`).join(' | ');
            daysDisplay = [...new Set(matchingBatches.map(b => b.schedulePattern))].join(' & ');
          }

          return {
            id: `cls-${clsName}-${subjName}`,
            className: clsName.includes('Standard') ? clsName : `${clsName} Standard`,
            standardRaw: clsName,
            subject: subjName,
            studentsCount: count,
            batchTime: timeDisplay,
            schedulePattern: daysDisplay,
            academicYear: '2026-2027'
          };
        })
      );

      setClassesList(classCardsData);
    } catch (err) {
      console.error('MyClasses Fetch Error:', err);
      setErrorMsg(err.message || 'Unable to load class allocations from database.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeacherClasses();
  }, []);

  // 2. Handle Opening View Class Modal with Performance Categorization
  const handleViewClass = async (cls) => {
    setSelectedClass(cls);
    setIsModalOpen(true);
    setLoadingModalStudents(true);
    setSearchTerm('');
    setErrorMsg('');

    try {
      // Fetch active students for this standard from MySQL database
      const stdRes = await getAttendanceStudentsAPI({ standard: cls.standardRaw, subject: cls.subject });
      const classStudents = stdRes.students || [];

      // Fetch dynamic test performance for each student from MongoDB Result model
      const enrichedStudents = await Promise.all(
        classStudents.map(async (student) => {
          try {
            const resData = await getStudentResultsAPI(student._id);
            const results = resData.results || [];

            if (results.length === 0) {
              return {
                ...student,
                testsCount: 0,
                totalObtained: 0,
                totalMax: 0,
                percentage: null,
                category: 'NO_MARKS',
                resultsHistory: []
              };
            }

            const totalObtained = results.reduce((sum, r) => sum + (r.marksObtained || 0), 0);
            const totalMax = results.reduce((sum, r) => sum + (r.totalMarks || 100), 0);
            const percentage = totalMax > 0 ? parseFloat(((totalObtained / totalMax) * 100).toFixed(1)) : 0;

            let category = 'LOW';
            if (percentage >= 75) {
              category = 'HIGH';
            } else if (percentage >= 40) {
              category = 'MEDIUM';
            } else {
              category = 'LOW';
            }

            return {
              ...student,
              testsCount: results.length,
              totalObtained,
              totalMax,
              percentage,
              category,
              resultsHistory: results
            };
          } catch (e) {
            return {
              ...student,
              testsCount: 0,
              totalObtained: 0,
              totalMax: 0,
              percentage: null,
              category: 'NO_MARKS',
              resultsHistory: []
            };
          }
        })
      );

      setModalStudents(enrichedStudents);
    } catch (err) {
      console.error('View Class Students Fetch Error:', err);
      setErrorMsg(err.message || 'Unable to load student performance data.');
      setModalStudents([]);
    } finally {
      setLoadingModalStudents(false);
    }
  };

  // 3. Open Centered Student Profile Modal
  const handleOpenProfile = async (student) => {
    try {
      const res = await getStudentByIdAPI(student._id);
      if (res && res.success && res.student) {
        setProfileStudent({
          ...res.student,
          ...student // preserve calculated academic performance fields
        });
      } else {
        setProfileStudent(student);
      }
    } catch (e) {
      setProfileStudent(student);
    }
    setIsProfileModalOpen(true);
  };

  // Filter students based on search term
  const filteredStudents = modalStudents.filter((std) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = std.name && std.name.toLowerCase().includes(term);
    const rollMatch = std.rollNo && String(std.rollNo).toLowerCase().includes(term);
    const idMatch = std.studentId && std.studentId.toLowerCase().includes(term);
    return nameMatch || rollMatch || idMatch;
  });

  // Categorize students
  const highStudents = filteredStudents.filter((s) => s.category === 'HIGH');
  const mediumStudents = filteredStudents.filter((s) => s.category === 'MEDIUM');
  const lowStudents = filteredStudents.filter((s) => s.category === 'LOW');
  const noMarksStudents = filteredStudents.filter((s) => s.category === 'NO_MARKS');

  return (
    <TeacherLayout activePage="classes">
      <div className="teacher-page-container">
        {/* Page Header */}
        <div className="teacher-welcome-banner">
          <div className="teacher-welcome-text">
            <h2>My Assigned Classes 📚</h2>
            <p>Overview of academic classes, subject allocations, student strength, and performance analysis.</p>
          </div>
          <div className="teacher-welcome-actions">
            <span className="teacher-badge-pill" style={{ background: 'rgba(212,175,55,0.2)', color: '#F4C542', border: '1px solid #D4AF37' }}>
              {classesList.length} Active Allocated Classes
            </span>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="teacher-card-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <RotateCw size={32} color="#D4AF37" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: '#555', fontWeight: 600 }}>Loading allocated classes...</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error State */}
        {!loading && errorMsg && (
          <div className="teacher-card-panel" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <AlertCircle size={40} color="#DC2626" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#991B1B' }}>Unable to load class allocations.</h3>
            <p style={{ color: '#7F1D1D', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{errorMsg}</p>
            <button
              className="teacher-btn teacher-btn-primary"
              onClick={fetchTeacherClasses}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RotateCw size={16} /> Retry
            </button>
          </div>
        )}

        {/* Empty Classes State */}
        {!loading && !errorMsg && classesList.length === 0 && (
          <div className="teacher-card-panel" style={{ textAlign: 'center', padding: '3.5rem 1.5rem', color: '#666' }}>
            <BookOpen size={40} color="#CCCCCC" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#171717' }}>No classes assigned</h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: '#777' }}>There are currently no classes allocated to this teacher in MongoDB.</p>
          </div>
        )}

        {/* Classes Cards Grid */}
        {!loading && !errorMsg && classesList.length > 0 && (
          <div className="teacher-classes-grid">
            {classesList.map((cls) => (
              <div key={cls.id} className="teacher-class-card">
                <div className="teacher-class-card-header">
                  <div className="teacher-class-title-box">
                    <h3 className="teacher-class-name">{cls.className}</h3>
                    <span className="teacher-class-subject">{cls.subject}</span>
                  </div>
                  <span className="teacher-class-badge">{cls.academicYear}</span>
                </div>

                <div className="teacher-class-details">
                  <div className="teacher-class-detail-item">
                    <Users size={16} />
                    <span><strong>Students:</strong> {cls.studentsCount} Enrolled</span>
                  </div>
                  <div className="teacher-class-detail-item">
                    <Clock size={16} />
                    <span><strong>Batch Time:</strong> {cls.batchTime}</span>
                  </div>
                  <div className="teacher-class-detail-item">
                    <Calendar size={16} />
                    <span><strong>Schedule:</strong> {cls.schedulePattern}</span>
                  </div>
                </div>

                <div className="teacher-class-action-bar">
                  <button
                    className="teacher-btn teacher-btn-primary"
                    onClick={() => handleViewClass(cls)}
                    style={{ width: '100%' }}
                  >
                    <Eye size={16} />
                    <span>View Class</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ==================================================
            1. CENTERED MODAL FOR VIEW CLASS (Performance Columns)
           ================================================== */}
        {selectedClass && (
          <TeacherModal
            isOpen={isModalOpen}
            onClose={() => setIsModalOpen(false)}
            title={`Class Performance View - ${selectedClass.className}`}
            maxWidth="920px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Header Info Banner */}
              <div
                style={{
                  background: '#FAF7F0',
                  padding: '1rem 1.25rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-light)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '1rem'
                }}
              >
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#171717' }}>{selectedClass.className}</h3>
                  <span style={{ color: 'var(--color-metallic-gold)', fontWeight: 700, fontSize: '0.92rem' }}>
                    Subject: {selectedClass.subject}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  {/* Search Input */}
                  <div style={{ position: 'relative' }}>
                    <Search size={15} color="#888" style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                      type="text"
                      placeholder="Search student..."
                      className="teacher-input"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      style={{ paddingLeft: '2rem', height: '36px', fontSize: '0.85rem', width: '180px' }}
                    />
                  </div>
                  <span className="teacher-badge-pill" style={{ background: '#151515', color: '#F4C542' }}>
                    {modalStudents.length} Students
                  </span>
                </div>
              </div>

              {/* Loading State */}
              {loadingModalStudents ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#777' }}>
                  <RotateCw size={24} color="#D4AF37" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                  <p style={{ marginTop: '0.75rem', fontWeight: 600 }}>Analyzing student performance from MongoDB test marks...</p>
                </div>
              ) : modalStudents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#666' }}>
                  <Users size={36} color="#CCCCCC" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ fontWeight: 700, fontSize: '1rem', margin: 0 }}>No students found for this class.</p>
                </div>
              ) : (
                <>
                  {/* 3 PERFORMANCE COLUMNS: HIGH, MEDIUM, LOW */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.25rem' }}>
                    {/* HIGH COLUMN (>= 75%) */}
                    <div style={{ background: '#FAF7F0', border: '1px solid #10B981', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '2px solid #10B981', paddingBottom: '0.4rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#065F46' }}>HIGH</h4>
                        <span style={{ background: '#D1FAE5', color: '#065F46', fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '12px', fontWeight: 700 }}>
                          ≥ 75% ({highStudents.length})
                        </span>
                      </div>

                      {highStudents.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: '#888888', fontStyle: 'italic', textAlign: 'center', margin: '1rem 0' }}>
                          No students in High category
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {highStudents.map((std) => (
                            <div
                              key={std._id}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #A7F3D0',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleOpenProfile(std)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span
                                  style={{ fontWeight: 800, fontSize: '0.92rem', color: '#171717', textDecoration: 'underline' }}
                                  onClick={(e) => { e.stopPropagation(); handleOpenProfile(std); }}
                                >
                                  {std.name}
                                </span>
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#059669' }}>
                                  {std.percentage}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666666' }}>
                                <span
                                  style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}
                                  onClick={(e) => { e.stopPropagation(); handleOpenProfile(std); }}
                                >
                                  {std.studentId || 'N/A'}
                                </span>
                                <span>Roll: {std.rollNo || 'N/A'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* MEDIUM COLUMN (40% - 74%) */}
                    <div style={{ background: '#FAF7F0', border: '1px solid #F59E0B', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '2px solid #F59E0B', paddingBottom: '0.4rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#92400E' }}>MEDIUM</h4>
                        <span style={{ background: '#FEF3C7', color: '#92400E', fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '12px', fontWeight: 700 }}>
                          40% - 74% ({mediumStudents.length})
                        </span>
                      </div>

                      {mediumStudents.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: '#888888', fontStyle: 'italic', textAlign: 'center', margin: '1rem 0' }}>
                          No students in Medium category
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {mediumStudents.map((std) => (
                            <div
                              key={std._id}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #FDE68A',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleOpenProfile(std)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span
                                  style={{ fontWeight: 800, fontSize: '0.92rem', color: '#171717', textDecoration: 'underline' }}
                                  onClick={(e) => { e.stopPropagation(); handleOpenProfile(std); }}
                                >
                                  {std.name}
                                </span>
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#D97706' }}>
                                  {std.percentage}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666666' }}>
                                <span
                                  style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}
                                  onClick={(e) => { e.stopPropagation(); handleOpenProfile(std); }}
                                >
                                  {std.studentId || 'N/A'}
                                </span>
                                <span>Roll: {std.rollNo || 'N/A'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* LOW COLUMN (< 40%) */}
                    <div style={{ background: '#FAF7F0', border: '1px solid #EF4444', borderRadius: '12px', padding: '1rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', borderBottom: '2px solid #EF4444', paddingBottom: '0.4rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#991B1B' }}>LOW</h4>
                        <span style={{ background: '#FEE2E2', color: '#991B1B', fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '12px', fontWeight: 700 }}>
                          &lt; 40% ({lowStudents.length})
                        </span>
                      </div>

                      {lowStudents.length === 0 ? (
                        <p style={{ fontSize: '0.85rem', color: '#888888', fontStyle: 'italic', textAlign: 'center', margin: '1rem 0' }}>
                          No students in Low category
                        </p>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                          {lowStudents.map((std) => (
                            <div
                              key={std._id}
                              style={{
                                background: '#FFFFFF',
                                border: '1px solid #FCA5A5',
                                borderRadius: '8px',
                                padding: '0.75rem',
                                cursor: 'pointer'
                              }}
                              onClick={() => handleOpenProfile(std)}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                <span
                                  style={{ fontWeight: 800, fontSize: '0.92rem', color: '#171717', textDecoration: 'underline' }}
                                  onClick={(e) => { e.stopPropagation(); handleOpenProfile(std); }}
                                >
                                  {std.name}
                                </span>
                                <span style={{ fontWeight: 800, fontSize: '0.88rem', color: '#DC2626' }}>
                                  {std.percentage}%
                                </span>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666666' }}>
                                <span
                                  style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}
                                  onClick={(e) => { e.stopPropagation(); handleOpenProfile(std); }}
                                >
                                  {std.studentId || 'N/A'}
                                </span>
                                <span>Roll: {std.rollNo || 'N/A'}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* NOT EVALUATED / NO MARKS SECTION */}
                  {noMarksStudents.length > 0 && (
                    <div style={{ background: '#FAF7F0', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '1rem', marginTop: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem', borderBottom: '2px solid #64748B', paddingBottom: '0.4rem' }}>
                        <h4 style={{ margin: 0, fontSize: '0.95rem', fontWeight: 800, color: '#334155' }}>
                          NOT EVALUATED / NO MARKS
                        </h4>
                        <span style={{ background: '#E2E8F0', color: '#334155', fontSize: '0.75rem', padding: '0.15rem 0.55rem', borderRadius: '12px', fontWeight: 700 }}>
                          {noMarksStudents.length} Students
                        </span>
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.65rem' }}>
                        {noMarksStudents.map((std) => (
                          <div
                            key={std._id}
                            style={{
                              background: '#FFFFFF',
                              border: '1px solid #E2E8F0',
                              borderRadius: '8px',
                              padding: '0.75rem',
                              cursor: 'pointer'
                            }}
                            onClick={() => handleOpenProfile(std)}
                          >
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                              <span
                                style={{ fontWeight: 800, fontSize: '0.92rem', color: '#171717', textDecoration: 'underline' }}
                                onClick={(e) => { e.stopPropagation(); handleOpenProfile(std); }}
                              >
                                {std.name}
                              </span>
                              <span style={{ fontSize: '0.8rem', color: '#64748B', fontWeight: 600 }}>
                                No Marks
                              </span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: '#666666' }}>
                              <span
                                style={{ color: '#2563EB', fontWeight: 600, textDecoration: 'underline' }}
                                onClick={(e) => { e.stopPropagation(); handleOpenProfile(std); }}
                              >
                                {std.studentId || 'N/A'}
                              </span>
                              <span>Roll: {std.rollNo || 'N/A'}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}

              <div className="teacher-modal-actions">
                <button
                  className="teacher-btn-cancel"
                  onClick={() => setIsModalOpen(false)}
                >
                  Close
                </button>

                <button
                  className="teacher-btn teacher-btn-outline"
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate(`/teacher/attendance?class=${encodeURIComponent(selectedClass.standardRaw)}&subject=${encodeURIComponent(selectedClass.subject)}`);
                  }}
                >
                  <UserCheck size={16} /> Mark Attendance
                </button>

                <button
                  className="teacher-btn-submit"
                  onClick={() => {
                    setIsModalOpen(false);
                    navigate('/teacher/tests');
                  }}
                >
                  <Award size={16} /> Manage Tests & Marks
                </button>
              </div>
            </div>
          </TeacherModal>
        )}

        {/* ==================================================
            2. CENTERED MODAL FOR STUDENT PROFILE
           ================================================== */}
        {profileStudent && (
          <TeacherModal
            isOpen={isProfileModalOpen}
            onClose={() => setIsProfileModalOpen(false)}
            title={`Student Profile - ${profileStudent.name}`}
            maxWidth="580px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {/* Profile Card Header */}
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
                    width: '64px',
                    height: '64px',
                    borderRadius: '50%',
                    background: '#151515',
                    color: '#F4C542',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    fontWeight: 800,
                    border: '2px solid #D4AF37',
                    flexShrink: 0
                  }}
                >
                  {getStudentPhotoUrl(profileStudent.photo) ? (
                    <img
                      src={getStudentPhotoUrl(profileStudent.photo)}
                      alt={profileStudent.name}
                      onError={(e) => handleImageError(e, '')}
                      style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    profileStudent.name ? profileStudent.name.charAt(0).toUpperCase() : 'S'
                  )}
                </div>

                <div style={{ flex: 1 }}>
                  <h3 style={{ margin: 0, fontSize: '1.25rem', color: '#171717' }}>{profileStudent.name}</h3>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '0.25rem' }}>
                    <span style={{ fontWeight: 700, color: '#2563EB', fontSize: '0.88rem' }}>
                      ID: {profileStudent.studentId || 'N/A'}
                    </span>
                    <span style={{ color: '#888' }}>•</span>
                    <span style={{ fontWeight: 700, color: '#555555', fontSize: '0.88rem' }}>
                      Roll No: {profileStudent.rollNo || 'N/A'}
                    </span>
                  </div>
                </div>

                {profileStudent.category && (
                  <span
                    className="teacher-badge-pill"
                    style={{
                      background:
                        profileStudent.category === 'HIGH' ? '#D1FAE5' :
                        profileStudent.category === 'MEDIUM' ? '#FEF3C7' :
                        profileStudent.category === 'LOW' ? '#FEE2E2' : '#E2E8F0',
                      color:
                        profileStudent.category === 'HIGH' ? '#065F46' :
                        profileStudent.category === 'MEDIUM' ? '#92400E' :
                        profileStudent.category === 'LOW' ? '#991B1B' : '#334155',
                      fontWeight: 800
                    }}
                  >
                    {profileStudent.category}
                  </span>
                )}
              </div>

              {/* Personal Details Grid */}
              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="teacher-form-group">
                  <label>Class / Standard</label>
                  <div className="teacher-info-val">{profileStudent.standard || selectedClass?.className}</div>
                </div>

                <div className="teacher-form-group">
                  <label>Mobile / Contact</label>
                  <div className="teacher-info-val">{profileStudent.mobile || 'N/A'}</div>
                </div>

                <div className="teacher-form-group">
                  <label>Parent Mobile / WhatsApp</label>
                  <div className="teacher-info-val">{profileStudent.parentMobile || profileStudent.mobile || 'N/A'}</div>
                </div>

                <div className="teacher-form-group">
                  <label>Medium</label>
                  <div className="teacher-info-val">{profileStudent.medium || 'Semi-English'}</div>
                </div>
              </div>

              {/* Academic Performance Metrics */}
              <div
                style={{
                  background: '#FFFFFF',
                  border: '1px solid #E5E7EB',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <div>
                  <span style={{ fontSize: '0.8rem', color: '#666666', display: 'block', fontWeight: 600 }}>
                    TESTS ATTEMPTED
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#171717' }}>
                    {profileStudent.testsCount !== undefined ? profileStudent.testsCount : 0} Tests
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: '#666666', display: 'block', fontWeight: 600 }}>
                    TOTAL SCORED
                  </span>
                  <strong style={{ fontSize: '1.1rem', color: '#B8860B' }}>
                    {profileStudent.totalObtained || 0} / {profileStudent.totalMax || 0}
                  </strong>
                </div>

                <div>
                  <span style={{ fontSize: '0.8rem', color: '#666666', display: 'block', fontWeight: 600 }}>
                    OVERALL PERCENTAGE
                  </span>
                  <strong style={{ fontSize: '1.2rem', color: '#10B981' }}>
                    {profileStudent.percentage !== null && profileStudent.percentage !== undefined ? `${profileStudent.percentage}%` : 'N/A'}
                  </strong>
                </div>
              </div>

              <div className="teacher-modal-actions">
                <button
                  className="teacher-btn-cancel"
                  onClick={() => setIsProfileModalOpen(false)}
                >
                  Close Profile
                </button>
              </div>
            </div>
          </TeacherModal>
        )}
      </div>
    </TeacherLayout>
  );
};

export default MyClasses;
