import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import TeacherLayout from '../../layouts/TeacherLayout';
import TeacherStatCard from '../../components/teacher/TeacherStatCard';
import TeacherModal from '../../components/teacher/TeacherModal';
import { getAuthenticatedTeacherProfileAPI, getAttendanceStudentsAPI, getBatchesAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import {
  BookOpen,
  Users,
  FileCheck2,
  Calendar,
  Clock,
  ArrowRight,
  Eye,
  UserCheck,
  RotateCw,
  AlertCircle
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

const TeacherDashboard = () => {
  const navigate = useNavigate();
  const { user, teacherProfile: contextProfile } = useContext(AuthContext) || {};

  const [teacher, setTeacher] = useState(null);
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalStudentsCount, setTotalStudentsCount] = useState(0);

  const [selectedClass, setSelectedClass] = useState(null);
  const [isClassModalOpen, setIsClassModalOpen] = useState(false);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await getAuthenticatedTeacherProfileAPI();
      if (res && res.success && res.teacher) {
        const t = res.teacher;
        setTeacher(t);

        // Fetch student count across assigned classes
        let countSum = 0;
        if (Array.isArray(t.classes) && t.classes.length > 0) {
          for (const clsName of t.classes) {
            try {
              const stdRes = await getAttendanceStudentsAPI({ standard: clsName });
              if (stdRes && stdRes.students) {
                countSum += stdRes.students.length;
              }
            } catch (e) {
              console.warn('Dashboard: student fetch notice for standard', clsName, e);
            }
          }
        }
        setTotalStudentsCount(countSum);
      } else if (contextProfile) {
        setTeacher(contextProfile);
      }

      // Fetch teacher's real batch timetable
      try {
        const batchRes = await getBatchesAPI();
        if (batchRes && batchRes.success) {
          setBatches(batchRes.batches || []);
        }
      } catch (bErr) {
        console.warn('Dashboard: batch fetch notice:', bErr.message);
      }

    } catch (err) {
      console.error('Teacher Dashboard Fetch Error:', err);
      if (contextProfile) {
        setTeacher(contextProfile);
      } else {
        setError(err.message || 'Unable to load dashboard data.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleOpenClassModal = (cls) => {
    setSelectedClass(cls);
    setIsClassModalOpen(true);
  };

  const activeTeacher = teacher || contextProfile;
  const classesList = activeTeacher?.classes || [];
  const subjectsList = activeTeacher?.subjects || [];
  const permissionsList = activeTeacher?.permissions || [];

  // Compute today's day of week string (e.g. 'Monday', 'Saturday', 'Sunday')
  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayDayName = daysOfWeek[new Date().getDay()];
  const isWeekendToday = todayDayName === 'Saturday' || todayDayName === 'Sunday';

  // Real Batches mapping for Today's Schedule
  const todayRealBatches = batches.filter(b => {
    if (b.schedulePattern === todayDayName) return true;
    if (b.schedulePattern === 'Monday-Friday' && !isWeekendToday) return true;
    return false;
  });

  const todaySchedule = batches.length > 0
    ? todayRealBatches.map(b => ({
        id: b._id || b.id,
        time: `${formatTime12Hour(b.startTime)} - ${formatTime12Hour(b.endTime)}`,
        className: b.standard,
        standard: b.standard,
        subject: b.subject,
        type: b.scheduleType || 'Regular Class',
        status: 'Upcoming'
      }))
    : permissionsList.length > 0
      ? permissionsList.map((p, idx) => ({
          id: `sched-${idx}`,
          time: idx === 0 ? '05:00 AM - 06:00 AM' : (idx === 1 ? '06:00 AM - 07:00 AM' : '07:00 AM - 08:00 AM'),
          className: p.class_name,
          standard: p.class_name,
          subject: p.subject_name,
          type: 'Regular Batch',
          status: 'Upcoming'
        }))
      : classesList.map((cls, idx) => ({
          id: `sched-${idx}`,
          time: idx === 0 ? '05:00 AM - 06:00 AM' : (idx === 1 ? '06:00 AM - 07:00 AM' : '07:00 AM - 08:00 AM'),
          className: typeof cls === 'string' ? cls : cls.className,
          standard: typeof cls === 'string' ? cls : cls.className,
          subject: subjectsList[0] || 'Mathematics',
          type: 'Regular Batch',
          status: 'Upcoming'
        }));

  // Real Batches mapping for Weekly Schedule
  const monFriBatches = batches.filter(b => b.schedulePattern === 'Monday-Friday');
  const satBatches = batches.filter(b => b.schedulePattern === 'Saturday');
  const sunBatches = batches.filter(b => b.schedulePattern === 'Sunday');

  const weeklySchedule = {
    mondayToFriday: batches.length > 0
      ? monFriBatches.map(b => ({
          id: b._id || b.id,
          time: `${formatTime12Hour(b.startTime)} - ${formatTime12Hour(b.endTime)}`,
          className: b.standard,
          standard: b.standard,
          subject: b.subject,
          batchName: `${b.standard} ${b.scheduleType || 'Regular Batch'}`
        }))
      : todaySchedule.map(s => ({
          ...s,
          batchName: `${s.className} Regular Batch`
        })),

    saturday: batches.length > 0
      ? satBatches.map(b => ({
          id: b._id || b.id,
          time: `${formatTime12Hour(b.startTime)} - ${formatTime12Hour(b.endTime)}`,
          className: b.standard,
          standard: b.standard,
          subject: b.subject,
          batchName: `${b.standard} Saturday Session`
        }))
      : classesList.map((cls, idx) => ({
          id: `sat-${idx}`,
          time: '08:00 AM - 10:00 AM',
          className: typeof cls === 'string' ? cls : cls.className,
          standard: typeof cls === 'string' ? cls : cls.className,
          subject: subjectsList[0] || 'Mathematics',
          batchName: 'Saturday Workshop & Doubt Solving'
        })),

    sunday: batches.length > 0
      ? sunBatches.map(b => ({
          id: b._id || b.id,
          time: `${formatTime12Hour(b.startTime)} - ${formatTime12Hour(b.endTime)}`,
          className: b.standard,
          standard: b.standard,
          subject: b.subject,
          scheduleType: b.scheduleType,
          batchName: `${b.standard} ${b.scheduleType === 'Exam' ? 'Weekly Unit Assessment' : 'Sunday Class'}`
        }))
      : classesList.map((cls, idx) => ({
          id: `sun-${idx}`,
          time: '09:00 AM - 11:00 AM',
          className: typeof cls === 'string' ? cls : cls.className,
          standard: typeof cls === 'string' ? cls : cls.className,
          subject: subjectsList[0] || 'Mathematics',
          scheduleType: 'Exam',
          batchName: 'Weekly Unit Assessment'
        }))
  };

  const stats = {
    myClasses: classesList.length,
    myStudents: totalStudentsCount,
    testsCreated: 0,
    todaysClasses: todaySchedule.length
  };

  return (
    <TeacherLayout activePage="dashboard">
      <div className="teacher-page-container">
        {/* Loading State */}
        {loading && (
          <div className="teacher-card-panel" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
            <RotateCw size={32} color="#D4AF37" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
            <p style={{ marginTop: '1rem', color: '#555', fontWeight: 600 }}>Loading teacher metrics & class schedule...</p>
            <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Error State with Retry */}
        {!loading && error && (
          <div className="teacher-card-panel" style={{ textAlign: 'center', padding: '2.5rem 1.5rem', background: '#FEF2F2', border: '1px solid #FCA5A5' }}>
            <AlertCircle size={40} color="#DC2626" style={{ marginBottom: '0.75rem' }} />
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#991B1B' }}>Unable to load dashboard data.</h3>
            <p style={{ color: '#7F1D1D', fontSize: '0.9rem', marginBottom: '1.25rem' }}>{error}</p>
            <button
              className="teacher-btn teacher-btn-primary"
              onClick={fetchDashboardData}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
            >
              <RotateCw size={16} /> Retry
            </button>
          </div>
        )}

        {/* Dynamic Dashboard View when loaded */}
        {!loading && !error && activeTeacher && (
          <>
            {/* Welcome Banner */}
            <div className="teacher-welcome-banner">
              <div className="teacher-welcome-text">
                <h2>Welcome Back, {activeTeacher.name || activeTeacher.fullname || 'Teacher'}! 👋</h2>
                <p>Here is your daily schedule, assigned classes, and student performance overview.</p>
              </div>
              <div className="teacher-welcome-actions">
                <button
                  className="teacher-btn teacher-btn-primary"
                  onClick={() => navigate('/teacher/attendance')}
                >
                  <UserCheck size={16} />
                  <span>Mark Attendance</span>
                </button>
              </div>
            </div>

            {/* Statistics Cards Grid */}
            <div className="teacher-stats-grid">
              <TeacherStatCard
                title="My Assigned Classes"
                value={stats.myClasses !== undefined ? stats.myClasses : 0}
                subtitle="Active class allocations"
                icon={BookOpen}
                gradientAccent="linear-gradient(135deg, #D4AF37 0%, #AA7C11 100%)"
              />
              <TeacherStatCard
                title="My Total Students"
                value={stats.myStudents !== undefined ? stats.myStudents : 0}
                subtitle="Enrolled class roster"
                icon={Users}
                gradientAccent="linear-gradient(135deg, #3B82F6 0%, #1D4ED8 100%)"
              />
              <TeacherStatCard
                title="Tests Created"
                value={stats.testsCreated !== undefined ? stats.testsCreated : 0}
                subtitle="Recorded test assessments"
                icon={FileCheck2}
                gradientAccent="linear-gradient(135deg, #F59E0B 0%, #D97706 100%)"
              />
              <TeacherStatCard
                title="Today's Classes"
                value={stats.todaysClasses !== undefined ? stats.todaysClasses : 0}
                subtitle="Scheduled sessions today"
                icon={Calendar}
                gradientAccent="linear-gradient(135deg, #10B981 0%, #059669 100%)"
              />
            </div>

            {/* Today's Schedule Table */}
            <div className="teacher-card-panel">
              <div className="teacher-panel-header">
                <div className="teacher-panel-title-group">
                  <Clock size={22} color="#D4AF37" />
                  <div>
                    <h3 className="teacher-panel-title">Today's Schedule</h3>
                    <p className="teacher-panel-subtitle">Your upcoming and ongoing teaching sessions</p>
                  </div>
                </div>
                <button
                  className="teacher-btn teacher-btn-outline teacher-btn-sm"
                  onClick={() => {
                    const el = document.getElementById('weekly-schedule');
                    if (el) el.scrollIntoView({ behavior: 'smooth' });
                  }}
                >
                  <span>Full Weekly Schedule</span>
                  <ArrowRight size={14} />
                </button>
              </div>

              <div className="teacher-table-responsive">
                {todaySchedule.length > 0 ? (
                  <table className="teacher-table">
                    <thead>
                      <tr>
                        <th>Time</th>
                        <th>Class</th>
                        <th>Subject</th>
                        <th>Type / Room</th>
                        <th>Status</th>
                        <th style={{ textAlign: 'right' }}>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {todaySchedule.map((item, idx) => (
                        <tr key={item.id || idx}>
                          <td>
                            <span className="timetable-time-badge">{item.time}</span>
                          </td>
                          <td style={{ fontWeight: 700 }}>{item.className || item.standard}</td>
                          <td>{item.subject}</td>
                          <td>
                            <span className="teacher-badge scheduled">{item.type || 'Regular Class'}</span>
                          </td>
                          <td>
                            <span className={`teacher-badge ${item.status ? item.status.toLowerCase() : 'upcoming'}`}>
                              {item.status === 'Upcoming' && <Clock size={12} />}
                              {item.status || 'Upcoming'}
                            </span>
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            <button
                              className="teacher-btn teacher-btn-outline teacher-btn-sm"
                              onClick={() => {
                                const targetClass = item.standard || item.className;
                                const targetSubject = item.subject || 'Mathematics';
                                navigate(`/teacher/attendance?class=${encodeURIComponent(targetClass)}&subject=${encodeURIComponent(targetSubject)}`);
                              }}
                            >
                              <UserCheck size={14} />
                              <span>Attendance</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: '#666666' }}>
                    <Calendar size={36} color="#CCCCCC" style={{ marginBottom: '0.5rem' }} />
                    <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 600 }}>No classes scheduled for today.</p>
                  </div>
                )}
              </div>
            </div>

            {/* Quick Access Grid: Assigned Classes & Recent Tests */}
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
              {/* Assigned Classes Preview */}
              <div className="teacher-card-panel">
                <div className="teacher-panel-header">
                  <div className="teacher-panel-title-group">
                    <BookOpen size={20} color="#D4AF37" />
                    <h3 className="teacher-panel-title">My Assigned Classes</h3>
                  </div>
                  <button
                    className="teacher-btn teacher-btn-outline teacher-btn-sm"
                    onClick={() => navigate('/teacher/classes')}
                  >
                    View All
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  {(activeTeacher?.classes || []).map((clsName, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.85rem 1rem',
                        background: '#FAF7F0',
                        borderRadius: '10px',
                        border: '1px solid var(--border-light)'
                      }}
                    >
                      <div>
                        <h4 style={{ margin: 0, fontSize: '0.98rem', fontWeight: 700 }}>
                          {typeof clsName === 'string' ? (clsName.includes('Standard') ? clsName : `${clsName} Standard`) : clsName.className}
                        </h4>
                        <span style={{ fontSize: '0.82rem', color: '#666666' }}>
                          {Array.isArray(activeTeacher?.subjects) ? activeTeacher.subjects.join(', ') : (activeTeacher?.subjects || 'General')}
                        </span>
                      </div>
                      <button
                        className="teacher-btn teacher-btn-primary teacher-btn-sm"
                        onClick={() => navigate('/teacher/classes')}
                      >
                        <Eye size={14} /> View
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Tests Overview */}
              <div className="teacher-card-panel">
                <div className="teacher-panel-header">
                  <div className="teacher-panel-title-group">
                    <FileCheck2 size={20} color="#D4AF37" />
                    <h3 className="teacher-panel-title">Recent Tests</h3>
                  </div>
                  <button
                    className="teacher-btn teacher-btn-outline teacher-btn-sm"
                    onClick={() => navigate('/teacher/tests')}
                  >
                    View Tests
                  </button>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                  <p style={{ margin: 0, fontSize: '0.88rem', color: '#666666' }}>No recent tests recorded yet.</p>
                </div>
              </div>
            </div>

            {/* ==================================================
                DYNAMIC WEEKLY SCHEDULE SECTION
               ================================================== */}
            <div id="weekly-schedule" className="teacher-card-panel" style={{ marginTop: '1.5rem' }}>
              <div className="teacher-panel-header">
                <div className="teacher-panel-title-group">
                  <Calendar size={22} color="#D4AF37" />
                  <div>
                    <h3 className="teacher-panel-title">Weekly Schedule & Timetable</h3>
                    <p className="teacher-panel-subtitle">Complete weekly teaching schedule and examination sessions</p>
                  </div>
                </div>
                <span className="teacher-badge-pill" style={{ background: '#151515', color: '#F4C542' }}>
                  System Synced
                </span>
              </div>

              {/* Day Category Sections: MONDAY-FRIDAY, SATURDAY, SUNDAY */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem', marginTop: '1rem' }}>
                {/* 1. MONDAY TO FRIDAY */}
                <div style={{ background: '#FAF7F0', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '2px solid #D4AF37', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#171717' }}>
                      MONDAY TO FRIDAY
                    </h4>
                    <span className="teacher-badge scheduled" style={{ fontSize: '0.75rem' }}>Regular Classes</span>
                  </div>

                  {(weeklySchedule.mondayToFriday || []).length === 0 ? (
                    <p style={{ color: '#666666', fontSize: '0.88rem', margin: 0, textAlign: 'center', padding: '1.5rem 0' }}>
                      No regular classes scheduled for Monday-Friday.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {weeklySchedule.mondayToFriday.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '0.85rem 1rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#171717' }}>{item.className}</strong>
                            <span className="timetable-time-badge" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                              {item.time}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#555555' }}>
                            <span>Subject: <strong>{item.subject}</strong></span>
                            <span style={{ fontSize: '0.8rem', color: '#888888' }}>{item.batchName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 2. SATURDAY */}
                <div style={{ background: '#FAF7F0', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '2px solid #D4AF37', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#171717' }}>
                      SATURDAY
                    </h4>
                    <span className="teacher-badge-pill" style={{ background: '#151515', color: '#F4C542', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                      Saturday Timetable
                    </span>
                  </div>

                  {(weeklySchedule.saturday || []).length === 0 ? (
                    <p style={{ color: '#666666', fontSize: '0.88rem', margin: 0, textAlign: 'center', padding: '1.5rem 0' }}>
                      No classes scheduled for Saturday.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {weeklySchedule.saturday.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '0.85rem 1rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#171717' }}>{item.className}</strong>
                            <span className="timetable-time-badge" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                              {item.time}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#555555' }}>
                            <span>Subject: <strong>{item.subject}</strong></span>
                            <span style={{ fontSize: '0.8rem', color: '#888888' }}>{item.batchName}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 3. SUNDAY (Including Exams / Tests) */}
                <div style={{ background: '#FAF7F0', border: '1px solid var(--border-light)', borderRadius: '12px', padding: '1.25rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '2px solid #EF4444', paddingBottom: '0.5rem' }}>
                    <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: '#171717' }}>
                      SUNDAY
                    </h4>
                    <span className="teacher-badge-pill" style={{ background: '#FEF2F2', color: '#991B1B', border: '1px solid #FCA5A5', fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                      Sunday & Exams
                    </span>
                  </div>

                  {(weeklySchedule.sunday || []).length === 0 ? (
                    <p style={{ color: '#666666', fontSize: '0.88rem', margin: 0, textAlign: 'center', padding: '1.5rem 0' }}>
                      No Sunday classes or tests scheduled.
                    </p>
                  ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      {weeklySchedule.sunday.map((item) => (
                        <div
                          key={item.id}
                          style={{
                            background: '#FFFFFF',
                            border: item.scheduleType === 'Exam' ? '1px solid #FCA5A5' : '1px solid #E5E7EB',
                            borderRadius: '8px',
                            padding: '0.85rem 1rem',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.03)'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.35rem' }}>
                            <strong style={{ fontSize: '0.95rem', color: '#171717' }}>{item.className}</strong>
                            <span className="timetable-time-badge" style={{ fontSize: '0.8rem', padding: '0.2rem 0.5rem' }}>
                              {item.time}
                            </span>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.85rem', color: '#555555' }}>
                            <span>Subject: <strong>{item.subject}</strong></span>
                            {item.scheduleType === 'Exam' ? (
                              <span className="teacher-badge-pill" style={{ background: '#DC2626', color: '#FFFFFF', fontSize: '0.72rem', padding: '0.15rem 0.5rem', fontWeight: 800 }}>
                                EXAM
                              </span>
                            ) : (
                              <span style={{ fontSize: '0.8rem', color: '#888888' }}>{item.batchName}</span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Centered Modal for View Class */}
      {selectedClass && (
        <TeacherModal
          isOpen={isClassModalOpen}
          onClose={() => setIsClassModalOpen(false)}
          title={`Class Details - ${selectedClass.className}`}
          maxWidth="550px"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div className="teacher-form-group">
              <label>Standard & Class</label>
              <div className="teacher-info-val">{selectedClass.className}</div>
            </div>
            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="teacher-form-group">
                <label>Subject</label>
                <div className="teacher-info-val">{selectedClass.subject || teacher?.subject}</div>
              </div>
              <div className="teacher-form-group">
                <label>Enrolled Students</label>
                <div className="teacher-info-val">{selectedClass.studentsCount || stats.myStudents} Students</div>
              </div>
            </div>
            <div className="teacher-modal-actions">
              <button
                className="teacher-btn-cancel"
                onClick={() => setIsClassModalOpen(false)}
              >
                Close
              </button>
              <button
                className="teacher-btn-submit"
                onClick={() => {
                  setIsClassModalOpen(false);
                  navigate('/teacher/students');
                }}
              >
                <Users size={16} /> View Roster
              </button>
            </div>
          </div>
        </TeacherModal>
      )}
    </TeacherLayout>
  );
};

export default TeacherDashboard;
