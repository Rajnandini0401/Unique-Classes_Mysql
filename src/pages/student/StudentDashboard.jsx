import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import StudentLayout from '../../layouts/StudentLayout';
import {
  UserCheck,
  Award,
  IndianRupee,
  Calendar,
  Clock,
  Megaphone,
  Trophy,
  User,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Paperclip,
  Eye,
  X,
  FileText,
  Flame,
  Filter
} from 'lucide-react';
import {
  getStudentsAPI,
  getStudentByIdAPI,
  getStudentDashboardAPI,
  getAttendanceHistoryAPI,
  getStudentAttendanceStreakAPI,
  getStudentAssignmentsAPI,
  getStudentResultsAPI,
  getClassLeaderboardAPI,
  getFeeByStudentAPI,
  getBatchesAPI,
  getAnnouncementsAPI
} from '../../services/api';
import { getStudentAcademicSubjects } from '../../utils/subjectUtils';
import { getStudentPhotoUrl, handleImageError } from '../../utils/photoUtils';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const StudentDashboard = () => {
  const navigate = useNavigate();

  // Primary Student Identity
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  // Month & Year for Attendance Activity Graph
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1); // 1-12
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [subjectFilter, setSubjectFilter] = useState('All'); // Subject Filter for Graph

  // 1. Attendance Activity Grid & Summary
  const [activityGrid, setActivityGrid] = useState({
    subjects: ['Math', 'Science', 'English'],
    daysInMonth: 30,
    gridMap: {}, // { "Math": { 1: "Present", 2: "Absent" } }
    presentCount: 0,
    absentCount: 0,
    unrecordedCount: 0,
    overallPct: '--'
  });
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [activeCellTooltip, setActiveCellTooltip] = useState(null);

  // 2. Attendance Streak State
  const [streakData, setStreakData] = useState({ currentStreak: 0, longestStreak: 0 });
  const [loadingStreak, setLoadingStreak] = useState(false);

  // 3. Assignments State (Latest & Pending)
  const [assignments, setAssignments] = useState([]);
  const [loadingAssignments, setLoadingAssignments] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // 4. Test Results & Avg Marks
  const [testResults, setTestResults] = useState([]);
  const [avgMarksPct, setAvgMarksPct] = useState('--');
  const [loadingResults, setLoadingResults] = useState(false);

  // 5. Subject-wise Leaderboards State
  const [subjectLeaderboards, setSubjectLeaderboards] = useState([]);
  const [loadingLeaderboard, setLoadingLeaderboard] = useState(false);

  // 6. Fee Summary State
  const [feeData, setFeeData] = useState({ totalFee: '--', paidFee: '--', remainingFee: '--' });
  const [loadingFee, setLoadingFee] = useState(false);

  // 7. Today's Schedule State
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loadingSchedule, setLoadingSchedule] = useState(false);

  // 8. Latest Announcement State
  const [latestAnnouncement, setLatestAnnouncement] = useState(null);
  const [loadingAnnouncement, setLoadingAnnouncement] = useState(false);

  // Fetch All Dynamic Dashboard Modules from MongoDB via Unified Student Dashboard API
  const loadDashboardData = useCallback(async (m, y) => {
    setLoadingStudent(true);
    setLoadingActivity(true);
    setLoadingStreak(true);
    setLoadingAssignments(true);
    setLoadingResults(true);
    setLoadingLeaderboard(true);
    setLoadingFee(true);
    setLoadingSchedule(true);
    setLoadingAnnouncement(true);

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryStudentId = searchParams.get('studentId') || searchParams.get('id');
      if (queryStudentId) {
        localStorage.setItem('studentId', queryStudentId);
        localStorage.setItem('currentStudentId', queryStudentId);
      }
      const savedStudentId = queryStudentId || localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
      const res = await getStudentDashboardAPI({
        studentId: savedStudentId || undefined,
        month: m,
        year: y
      });

      if (res.success && res.student) {
        setStudent(res.student);

        if (res.attendance) {
          setActivityGrid({
            subjects: res.attendance.subjects || ['Math', 'Science', 'English'],
            daysInMonth: res.attendance.daysInMonth || 30,
            gridMap: res.attendance.gridMap || {},
            presentCount: res.attendance.presentCount || 0,
            absentCount: res.attendance.absentCount || 0,
            unrecordedCount: res.attendance.unrecordedCount || 0,
            overallPct: res.attendance.overallPct || '--'
          });
        }

        if (res.streak) {
          setStreakData({
            currentStreak: res.streak.currentStreak || 0,
            longestStreak: res.streak.longestStreak || 0
          });
        }

        if (Array.isArray(res.assignments)) {
          setAssignments(res.assignments);
        }

        if (Array.isArray(res.testResults)) {
          setTestResults(res.testResults);
        }
        setAvgMarksPct(res.avgMarksPct || '--');

        if (res.fee) {
          setFeeData(res.fee);
        }

        if (Array.isArray(res.todaySchedule)) {
          setTodaySchedule(res.todaySchedule);
        }

        if (res.latestAnnouncement) {
          setLatestAnnouncement(res.latestAnnouncement);
        } else {
          setLatestAnnouncement(null);
        }

        if (Array.isArray(res.subjectLeaderboards)) {
          setSubjectLeaderboards(res.subjectLeaderboards);
        } else if (Array.isArray(res.leaderboard)) {
          setSubjectLeaderboards(res.leaderboard);
        } else {
          setSubjectLeaderboards([]);
        }
      }
    } catch (err) {
      console.error('Error loading dynamic student dashboard:', err);
    } finally {
      setLoadingStudent(false);
      setLoadingActivity(false);
      setLoadingStreak(false);
      setLoadingAssignments(false);
      setLoadingResults(false);
      setLoadingLeaderboard(false);
      setLoadingFee(false);
      setLoadingSchedule(false);
      setLoadingAnnouncement(false);
    }
  }, []);

  useEffect(() => {
    loadDashboardData(selectedMonth, selectedYear);
  }, [selectedMonth, selectedYear, loadDashboardData]);

  // Month Selector Handlers
  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear(prev => prev - 1);
    } else {
      setSelectedMonth(prev => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear(prev => prev + 1);
    } else {
      setSelectedMonth(prev => prev + 1);
    }
  };

  if (loadingStudent) {
    return (
      <StudentLayout>
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ color: '#1E3A8A', fontWeight: 800 }}>Loading Student Portal...</div>
        </div>
      </StudentLayout>
    );
  }

  if (!student) {
    return (
      <StudentLayout>
        <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <User size={48} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
          <h3 style={{ color: '#1E293B', margin: 0 }}>No Active Student Record Found</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.3rem' }}>Please register a student or contact admin.</p>
        </div>
      </StudentLayout>
    );
  }

  // Filter subjects shown on the monthly grid
  const displaySubjects = subjectFilter === 'All'
    ? activityGrid.subjects
    : activityGrid.subjects.filter(s => s.toLowerCase() === subjectFilter.toLowerCase());

  const pendingCount = assignments.filter(a => a.status === 'Pending' || a.status === 'Due Soon').length;
  const latest3Assignments = assignments.slice(0, 3);
  const nextAssignment = assignments.find(a => a.status === 'Pending' || a.status === 'Due Soon') || assignments[0];

  return (
    <StudentLayout student={student}>
      {/* 1. HEADER (Handled by StudentLayout Header) */}

      {/* 2. WELCOME / STUDENT PROFILE SECTION */}
      <div className="student-welcome-card">
        <div className="student-welcome-photo" style={{ position: 'relative', overflow: 'hidden' }}>
          {getStudentPhotoUrl(student.photo) ? (
            <>
              <img
                src={getStudentPhotoUrl(student.photo)}
                alt={student.name}
                onError={(e) => handleImageError(e, '')}
                style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
              />
              <div
                className="photo-fallback"
                style={{ display: 'none', width: '100%', height: '100%', background: '#1E3A8A', color: '#FFFFFF', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.3rem', borderRadius: '50%' }}
              >
                {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
              </div>
            </>
          ) : (
            <div style={{ width: '100%', height: '100%', background: '#1E3A8A', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 900, fontSize: '1.3rem', borderRadius: '50%' }}>
              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
            </div>
          )}
        </div>

        <div className="student-welcome-info">
          <h2>Welcome back, {student.name.split(' ')[0]} 👋</h2>
          <div className="student-welcome-badges">
            <span className="student-badge">{student.standard} Standard</span>
            <span className="student-badge">Roll No. {student.rollNo || '-'}</span>
            <span className="student-badge">ID: {student.studentId || '-'}</span>
          </div>
        </div>
      </div>

      {/* 3. THREE COMPACT SUMMARY CARDS (ATTENDANCE, AVG MARKS, FEE BALANCE) */}
      <div className="student-metrics-grid">
        <div className="student-metric-card">
          <div className="student-metric-icon" style={{ background: '#ECFDF5', color: '#10B981' }}>
            <UserCheck size={16} />
          </div>
          <div className="student-metric-label">Overall Attendance</div>
          <div className="student-metric-val" style={{ color: '#059669' }}>
            {loadingActivity ? '...' : activityGrid.overallPct}
          </div>
        </div>

        <div className="student-metric-card">
          <div className="student-metric-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
            <Award size={16} />
          </div>
          <div className="student-metric-label">Avg Marks</div>
          <div className="student-metric-val" style={{ color: '#D97706' }}>
            {loadingResults ? '...' : avgMarksPct}
          </div>
        </div>

        <div className="student-metric-card" onClick={() => navigate('/student/fees')} style={{ cursor: 'pointer' }}>
          <div className="student-metric-icon" style={{ background: '#EFF6FF', color: '#1E3A8A' }}>
            <IndianRupee size={16} />
          </div>
          <div className="student-metric-label">Fee Balance</div>
          <div className="student-metric-val" style={{ color: '#1E3A8A' }}>
            {loadingFee ? '...' : feeData.remainingFee}
          </div>
        </div>
      </div>

      {/* 4. 📊 MONTHLY ATTENDANCE SECTION (SUMMARY + STREAK + MONTHLY GRAPH + FILTERS) */}
      <div className="student-card">
        {/* Title and Controls */}
        <div className="student-card-title" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <h3>
            <Calendar size={18} color="#1E3A8A" /> 📊 Monthly Attendance
          </h3>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            {/* Subject Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.2rem 0.5rem' }}>
              <Filter size={13} color="#64748B" />
              <select
                value={subjectFilter}
                onChange={(e) => setSubjectFilter(e.target.value)}
                style={{ border: 'none', background: 'transparent', fontSize: '0.78rem', fontWeight: 800, color: '#1E3A8A', cursor: 'pointer', outline: 'none' }}
              >
                <option value="All">All Subjects</option>
                {(student ? getStudentAcademicSubjects(student) : []).map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>
            </div>

            {/* Month Navigator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', padding: '0.2rem 0.4rem' }}>
              <button
                onClick={handlePrevMonth}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                title="Previous Month"
              >
                <ChevronLeft size={16} color="#334155" />
              </button>
              <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1E3A8A', minWidth: '105px', textAlign: 'center' }}>
                {MONTH_NAMES[selectedMonth - 1]} {selectedYear}
              </span>
              <button
                onClick={handleNextMonth}
                style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: '2px', display: 'flex', alignItems: 'center' }}
                title="Next Month"
              >
                <ChevronRight size={16} color="#334155" />
              </button>
            </div>
          </div>
        </div>

        {/* ATTENDANCE SUMMARY + 🔥 ATTENDANCE STREAK HEADER */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '0.75rem', marginBottom: '1rem' }}>
          {/* Summary Counts */}
          <div style={{ display: 'flex', justifyContent: 'space-around', background: '#F8FAFC', padding: '0.65rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.8rem', fontWeight: 800, textAlign: 'center' }}>
            <div>Present: <span style={{ color: '#059669' }}>{activityGrid.presentCount}</span></div>
            <div>Absent: <span style={{ color: '#DC2626' }}>{activityGrid.absentCount}</span></div>
            <div>Overall: <span style={{ color: '#1E3A8A' }}>{activityGrid.overallPct}</span></div>
          </div>

          {/* Attendance Streak Badge */}
          <div style={{ background: 'linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)', border: '1px solid #FDBA74', borderRadius: '10px', padding: '0.65rem 0.85rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.3rem' }}>🔥</span>
              <div>
                <div style={{ fontSize: '0.78rem', fontWeight: 900, color: '#9A3412' }}>Attendance Streak</div>
                <div style={{ fontSize: '0.7rem', color: '#C2410C', fontWeight: 700 }}>Keep attending daily classes!</div>
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#EA580C' }}>
                {loadingStreak ? '...' : `${streakData.currentStreak} Days`}
              </div>
              <div style={{ fontSize: '0.68rem', color: '#9A3412', fontWeight: 700 }}>
                Best: {streakData.longestStreak} Days
              </div>
            </div>
          </div>
        </div>

        {/* MONTHLY ATTENDANCE ACTIVITY GRAPH (CONTRIBUTION GRID) */}
        {loadingActivity ? (
          <div style={{ padding: '1.5rem', textAlign: 'center', fontSize: '0.85rem', color: '#64748B' }}>
            <Loader2 size={24} className="spin-icon" style={{ margin: '0 auto 0.4rem auto' }} />
            <div>Loading monthly attendance...</div>
          </div>
        ) : (
          <div>
            <div className="activity-grid-container">
              <table className="activity-grid-table">
                <thead>
                  <tr>
                    <th className="activity-grid-td-subj" style={{ background: '#FFFFFF' }}>Subject</th>
                    {Array.from({ length: activityGrid.daysInMonth }, (_, i) => i + 1).map(d => (
                      <th key={d} className="activity-grid-th-date">{d}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {displaySubjects.map(subj => (
                    <tr key={subj}>
                      <td className="activity-grid-td-subj">{subj}</td>
                      {Array.from({ length: activityGrid.daysInMonth }, (_, i) => i + 1).map(d => {
                        const status = activityGrid.gridMap[subj] ? activityGrid.gridMap[subj][d] : null;
                        const isHolidayOrClosed = status === 'Holiday' || status === 'Closed';
                        const cellClass = status === 'Present' ? 'p' : status === 'Absent' ? 'a' : (isHolidayOrClosed ? 'h' : 'u');
                        const statusText = status === 'Present' ? 'Present' : status === 'Absent' ? 'Absent' : (status === 'Holiday' ? 'Holiday / No Class' : (status === 'Closed' ? 'Tuition Closed' : 'Not Recorded'));

                        return (
                          <td key={d} style={{ padding: 0 }}>
                            <div
                              className={`activity-grid-cell ${cellClass}`}
                              style={{
                                background: status === 'Present' ? '#10B981' : status === 'Absent' ? '#EF4444' : (isHolidayOrClosed ? '#3B82F6' : '#CBD5E1')
                              }}
                              onClick={() => setActiveCellTooltip({
                                date: `${String(d).padStart(2, '0')} ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear}`,
                                subject: subj,
                                status: statusText
                              })}
                              title={`${String(d).padStart(2, '0')} ${MONTH_NAMES[selectedMonth - 1]} ${selectedYear} - ${subj}: ${statusText}`}
                            />
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Interactive Cell Modal / Banner if clicked */}
            {activeCellTooltip && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '0.5rem 0.75rem', marginTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '0.78rem', fontWeight: 800, color: '#1E3A8A' }}>
                  🗓 {activeCellTooltip.date} • <strong>{activeCellTooltip.subject}</strong>: <span style={{ color: activeCellTooltip.status === 'Present' ? '#059669' : activeCellTooltip.status === 'Absent' ? '#DC2626' : (activeCellTooltip.status.includes('Holiday') || activeCellTooltip.status.includes('Closed') ? '#2563EB' : '#64748B') }}>{activeCellTooltip.status}</span>
                </span>
                <button
                  onClick={() => setActiveCellTooltip(null)}
                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  <X size={14} color="#64748B" />
                </button>
              </div>
            )}

            {/* Graph Legend */}
            <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, flexWrap: 'wrap' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#10B981', display: 'inline-block' }} /> 🟩 Present
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#EF4444', display: 'inline-block' }} /> 🟥 Absent
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3B82F6', display: 'inline-block' }} /> 🟦 Holiday / Closed
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#CBD5E1', display: 'inline-block' }} /> ⬜ Not Recorded
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 5. 🏆 SUBJECT-WISE CLASS LEADERBOARDS */}
      <div style={{ marginBottom: '1.5rem' }}>
        {/* Section Main Title */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <h3 style={{ margin: 0, color: '#1E3A8A', fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Trophy size={22} color="#D4AF37" /> 🏆 Subject Leaderboards
          </h3>
          <span style={{ fontSize: '0.8rem', fontWeight: 800, color: '#64748B', background: '#F1F5F9', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid #CBD5E1' }}>
            {student.standard} Standard • Latest Exam Ranks
          </span>
        </div>

        {loadingLeaderboard ? (
          <div style={{ background: '#0B132B', borderRadius: '16px', padding: '2rem', textAlign: 'center', color: '#94A3B8', fontStyle: 'italic', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
            <Loader2 size={28} className="spin-icon" style={{ margin: '0 auto 0.5rem auto' }} color="#F4C542" />
            <div>Loading subject leaderboards...</div>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.15rem' }}>
            {(() => {
              const displayLeaderboards = subjectLeaderboards.length > 0
                ? subjectLeaderboards
                : (student ? getStudentAcademicSubjects(student) : ['Mathematics', 'Science', 'English']).map(subj => ({
                    subject: subj,
                    hasExam: false,
                    top3: [],
                    studentRank: null
                  }));

              return displayLeaderboards.map((item, index) => {
                const hasExam = item.hasExam && Array.isArray(item.top3) && item.top3.length > 0;

                return (
                  <div
                    key={item.subject || index}
                    style={{
                      background: 'linear-gradient(135deg, #0B132B 0%, #1C2541 50%, #0F172A 100%)',
                      color: '#FFFFFF',
                      borderRadius: '16px',
                      padding: '1.2rem 1.1rem',
                      border: '1px solid rgba(212, 175, 55, 0.45)',
                      boxShadow: '0 10px 25px rgba(11, 19, 43, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08)',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between'
                    }}
                  >
                    <div>
                      {/* Card Header */}
                      <div style={{ borderBottom: '1px solid rgba(255, 255, 255, 0.12)', paddingBottom: '0.75rem', marginBottom: '0.85rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                          <h4 style={{ margin: 0, color: '#F4C542', fontSize: '1.05rem', fontWeight: 900, letterSpacing: '0.5px' }}>
                            {item.subject} Leaderboard
                          </h4>
                          <span style={{ background: 'rgba(212, 175, 55, 0.15)', border: '1px solid rgba(212, 175, 55, 0.3)', padding: '0.15rem 0.5rem', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 800, color: '#F4C542' }}>
                            Rankings
                          </span>
                        </div>

                        {/* Exam Subtitle */}
                        {item.hasExam ? (
                          <div style={{ fontSize: '0.72rem', color: '#CBD5E1', fontWeight: 700, marginTop: '0.35rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap' }}>
                            <span>
                              📝 Test: <strong>{item.testTitle || item.subject}</strong>
                            </span>
                            <span style={{ color: '#94A3B8' }}>
                              {item.testDate ? new Date(item.testDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }) : ''} • Max: {item.totalMarks} Marks
                            </span>
                          </div>
                        ) : (
                          <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontStyle: 'italic', marginTop: '0.35rem' }}>
                            No conducted exam found for this subject
                          </div>
                        )}
                      </div>

                      {/* Ranking Rows */}
                      {!hasExam ? (
                        <div style={{ fontSize: '0.8rem', color: '#94A3B8', textAlign: 'center', padding: '1.25rem 0.5rem', background: 'rgba(255, 255, 255, 0.02)', borderRadius: '10px', border: '1px solid rgba(255, 255, 255, 0.04)' }}>
                          Leaderboard will update after scheduled test results for {item.subject} are entered.
                        </div>
                      ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
                          {/* Top 3 Ranks */}
                          {item.top3.map((rkItem, idx) => {
                            const medal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : '🥉';
                            const isMe = String(rkItem.studentDbId || rkItem.studentId) === String(student._id || student.id) || String(rkItem.studentId) === String(student.studentId);
                            const rawPct = typeof rkItem.percentage === 'number' ? rkItem.percentage : parseFloat(rkItem.percentage || 0);
                            const displayPct = isNaN(rawPct) ? '0%' : `${Number(rawPct.toFixed(1))}%`;
                            const clampedPct = isNaN(rawPct) ? 0 : Math.min(100, Math.max(0, rawPct));
                            const itemPhotoUrl = getStudentPhotoUrl(rkItem.photo);

                            return (
                              <div
                                key={rkItem.studentDbId || rkItem.studentId || idx}
                                style={{
                                  background: isMe ? 'rgba(212, 175, 55, 0.18)' : 'rgba(255, 255, 255, 0.04)',
                                  border: isMe ? '1px solid rgba(212, 175, 55, 0.55)' : '1px solid rgba(255, 255, 255, 0.07)',
                                  borderRadius: '10px',
                                  padding: '0.55rem 0.75rem',
                                  display: 'flex',
                                  flexDirection: 'column',
                                  gap: '0.3rem',
                                  boxShadow: isMe ? '0 0 12px rgba(212, 175, 55, 0.22)' : 'none'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                    <span style={{ fontSize: '1.15rem', lineHeight: 1, flexShrink: 0 }}>{medal}</span>

                                    {/* Student Avatar */}
                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: isMe ? '2px solid #F4C542' : '1px solid rgba(255, 255, 255, 0.25)', background: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                      {itemPhotoUrl ? (
                                        <img
                                          src={itemPhotoUrl}
                                          alt={rkItem.name}
                                          onError={(e) => handleImageError(e, '')}
                                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                        />
                                      ) : (
                                        <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem' }}>
                                          {rkItem.name ? rkItem.name.charAt(0).toUpperCase() : 'S'}
                                        </span>
                                      )}
                                    </div>

                                    <span style={{ fontWeight: 800, fontSize: '0.83rem', color: isMe ? '#F4C542' : '#F8FAFC', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                      {rkItem.name}
                                    </span>
                                    {isMe && (
                                      <span style={{ background: '#D4AF37', color: '#0B132B', fontSize: '0.6rem', fontWeight: 900, padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                        YOU
                                      </span>
                                    )}
                                  </div>

                                  <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.4rem' }}>
                                    <span style={{ fontWeight: 900, fontSize: '0.85rem', color: isMe ? '#F4C542' : '#F1F5F9' }}>
                                      {rkItem.marksObtained}/{item.totalMarks}
                                    </span>
                                    <span style={{ fontSize: '0.7rem', color: '#94A3B8', marginLeft: '0.3rem', fontWeight: 700 }}>
                                      ({displayPct})
                                    </span>
                                  </div>
                                </div>

                                {/* Progress Bar */}
                                <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                  <div
                                    style={{
                                      width: `${clampedPct}%`,
                                      height: '100%',
                                      background: isMe ? 'linear-gradient(90deg, #F59E0B 0%, #F4C542 100%)' : 'linear-gradient(90deg, #3B82F6 0%, #60A5FA 100%)',
                                      borderRadius: '3px',
                                      transition: 'width 0.5s ease'
                                    }}
                                  />
                                </div>
                              </div>
                            );
                          })}

                          {/* Logged-in Student Row if Rank > 3 */}
                          {item.studentRank && item.studentRank.rank > 3 && (
                            <>
                              <div style={{ textAlign: 'center', color: '#94A3B8', fontSize: '0.75rem', fontWeight: 800, margin: '0.1rem 0' }}>
                                • • •
                              </div>
                              {(() => {
                                const myRankItem = item.studentRank;
                                const rawPct = typeof myRankItem.percentage === 'number' ? myRankItem.percentage : parseFloat(myRankItem.percentage || 0);
                                const displayPct = isNaN(rawPct) ? '0%' : `${Number(rawPct.toFixed(1))}%`;
                                const clampedPct = isNaN(rawPct) ? 0 : Math.min(100, Math.max(0, rawPct));
                                const myPhotoUrl = getStudentPhotoUrl(student.photo || myRankItem.photo);

                                return (
                                  <div
                                    style={{
                                      background: 'rgba(212, 175, 55, 0.18)',
                                      border: '1px solid rgba(212, 175, 55, 0.55)',
                                      borderRadius: '10px',
                                      padding: '0.55rem 0.75rem',
                                      display: 'flex',
                                      flexDirection: 'column',
                                      gap: '0.3rem',
                                      boxShadow: '0 0 12px rgba(212, 175, 55, 0.22)'
                                    }}
                                  >
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', minWidth: 0 }}>
                                        <span style={{ fontSize: '0.8rem', fontWeight: 900, color: '#F4C542', flexShrink: 0, minWidth: '24px' }}>
                                          #{myRankItem.rank}
                                        </span>
                                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', overflow: 'hidden', border: '2px solid #F4C542', background: '#1E3A8A', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                          {myPhotoUrl ? (
                                            <img
                                              src={myPhotoUrl}
                                              alt={student.name}
                                              onError={(e) => handleImageError(e, '')}
                                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            />
                                          ) : (
                                            <span style={{ color: '#FFFFFF', fontWeight: 800, fontSize: '0.75rem' }}>
                                              {student.name ? student.name.charAt(0).toUpperCase() : 'S'}
                                            </span>
                                          )}
                                        </div>
                                        <span style={{ fontWeight: 900, fontSize: '0.83rem', color: '#F4C542', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                          {student.name}
                                        </span>
                                        <span style={{ background: '#D4AF37', color: '#0B132B', fontSize: '0.6rem', fontWeight: 900, padding: '0.1rem 0.4rem', borderRadius: '4px', textTransform: 'uppercase', letterSpacing: '0.5px', flexShrink: 0 }}>
                                          YOU
                                        </span>
                                      </div>

                                      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '0.4rem' }}>
                                        <span style={{ fontWeight: 900, fontSize: '0.85rem', color: '#F4C542' }}>
                                          {myRankItem.marksObtained}/{item.totalMarks}
                                        </span>
                                        <span style={{ fontSize: '0.7rem', color: '#FCD34D', marginLeft: '0.3rem', fontWeight: 700 }}>
                                          ({displayPct})
                                        </span>
                                      </div>
                                    </div>

                                    {/* Progress Bar */}
                                    <div style={{ width: '100%', height: '5px', background: 'rgba(255, 255, 255, 0.1)', borderRadius: '3px', overflow: 'hidden' }}>
                                      <div
                                        style={{
                                          width: `${clampedPct}%`,
                                          height: '100%',
                                          background: 'linear-gradient(90deg, #F59E0B 0%, #F4C542 100%)',
                                          borderRadius: '3px',
                                          transition: 'width 0.5s ease'
                                        }}
                                      />
                                    </div>
                                  </div>
                                );
                              })()}
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              });
            })()}
          </div>
        )}
      </div>

      {/* 6. 📚 LATEST ASSIGNMENTS SECTION */}
      <div className="student-card">
        <div className="student-card-title">
          <h3>
            <FileText size={18} color="#1E3A8A" /> 📚 Latest Assignments
          </h3>
          <Link to="/student/assignments" className="student-link-btn">
            View All <ChevronRight size={14} />
          </Link>
        </div>

        {loadingAssignments ? (
          <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic', padding: '1rem 0' }}>Loading assignments...</div>
        ) : nextAssignment ? (
          <div>
            {(() => {
              const dueFormatted = new Date(nextAssignment.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              const isOverdue = nextAssignment.status === 'Overdue';
              const isDueSoon = nextAssignment.status === 'Due Soon';

              return (
                <div
                  style={{
                    background: '#F8FAFC',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    padding: '0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ fontSize: '0.72rem', fontWeight: 900, color: '#1E3A8A', background: '#DBEAFE', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                        {nextAssignment.subject}
                      </span>
                      <span style={{
                        fontSize: '0.7rem',
                        fontWeight: 800,
                        padding: '0.15rem 0.45rem',
                        borderRadius: '4px',
                        background: isOverdue ? '#FEF2F2' : isDueSoon ? '#FFFBEB' : '#ECFDF5',
                        color: isOverdue ? '#DC2626' : isDueSoon ? '#D97706' : '#059669'
                      }}>
                        {nextAssignment.status || 'Active'}
                      </span>
                    </div>

                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.9rem', marginBottom: '0.3rem' }}>
                      {nextAssignment.title}
                    </div>

                    <div style={{ fontSize: '0.78rem', color: '#64748B', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Calendar size={13} color="#1E3A8A" /> Due: <strong style={{ color: '#1E293B' }}>{dueFormatted}</strong>
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedAssignment(nextAssignment)}
                    style={{
                      width: '100%',
                      padding: '0.45rem',
                      background: '#1E3A8A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      fontWeight: 800,
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.3rem',
                      marginTop: '0.4rem'
                    }}
                  >
                    <Eye size={14} /> Open Assignment
                  </button>
                </div>
              );
            })()}
          </div>
        ) : (
          <div style={{ fontSize: '0.85rem', color: '#64748B', padding: '0.75rem 0' }}>📚 No upcoming assignments</div>
        )}
      </div>

      {/* RESPONSIVE 2-COLUMN GRID FOR LAPTOPS (STACKS ON MOBILE) */}
      <div className="student-dashboard-grid-2col">
        {/* 7. 📝 RECENT TEST RESULTS */}
        <div className="student-card" style={{ marginBottom: 0 }}>
          <div className="student-card-title">
            <h3>
              <Award size={18} color="#D97706" /> Recent Test Results
            </h3>
            <Link to="/student/tests" className="student-link-btn">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {loadingResults ? (
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>Loading test results...</div>
          ) : testResults.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              {testResults.slice(0, 3).map((resItem, idx) => (
                <div
                  key={resItem._id || idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.6rem 0.8rem',
                    background: '#F8FAFC',
                    borderRadius: '8px',
                    border: '1px solid #E2E8F0'
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '0.85rem' }}>
                      {resItem.testName || resItem.subject || 'Subject Test'}
                    </div>
                    <div style={{ fontSize: '0.72rem', color: '#64748B', fontWeight: 600 }}>
                      {resItem.subject}
                    </div>
                  </div>

                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontWeight: 900, color: '#1E3A8A', fontSize: '0.9rem' }}>
                      {resItem.marksObtained} / {resItem.totalMarks}
                    </div>
                    {resItem.percentage !== undefined && (
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, color: resItem.percentage >= 75 ? '#059669' : '#D97706' }}>
                        {resItem.percentage}%
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>No test results available.</div>
          )}
        </div>

        {/* 8. 📅 TODAY'S SCHEDULE */}
        <div className="student-card" style={{ marginBottom: 0 }}>
          <div className="student-card-title">
            <h3>
              <Clock size={18} color="#1E3A8A" /> Today's Schedule
            </h3>
            <Link to="/student/schedule" className="student-link-btn">
              View Full <ChevronRight size={14} />
            </Link>
          </div>

          {loadingSchedule ? (
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>Loading schedule...</div>
          ) : todaySchedule.length > 0 ? (
            <div>
              {todaySchedule.map((b, idx) => (
                <div key={b._id || idx} className="student-schedule-item">
                  <div className="student-schedule-time">
                    {b.timeDisplay || `${b.startTime || '05:00 AM'} - ${b.endTime || '06:00 AM'}`}
                  </div>
                  <div className="student-schedule-subject" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.25rem' }}>
                    <span>{b.subject} {b.batchName ? `(${b.batchName})` : ''}</span>
                    {(b.teacherName || b.teacher?.name) && (
                      <span style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
                        {b.teacherName || b.teacher?.name}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>No classes scheduled today.</div>
          )}
        </div>
      </div>

      {/* RESPONSIVE 2-COLUMN GRID FOR LAPTOPS (FEE SUMMARY & ANNOUNCEMENT) */}
      <div className="student-dashboard-grid-2col" style={{ marginTop: '1.1rem' }}>
        {/* 9. 💰 FEE SUMMARY (VIEW-ONLY!) */}
        <div className="student-card" style={{ marginBottom: 0 }}>
          <div className="student-card-title">
            <h3>
              <IndianRupee size={18} color="#1E3A8A" /> My Fees
            </h3>
            <Link to="/student/fees" className="student-link-btn">
              View Fees <ChevronRight size={14} />
            </Link>
          </div>

          {loadingFee ? (
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>Loading fee details...</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.45rem', textAlign: 'center' }}>
              <div style={{ background: '#F8FAFC', padding: '0.6rem 0.4rem', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B' }}>TOTAL FEES</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#0F172A', marginTop: '2px' }}>{feeData.totalFee}</div>
              </div>

              <div style={{ background: '#ECFDF5', padding: '0.6rem 0.4rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#065F46' }}>PAID</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#059669', marginTop: '2px' }}>{feeData.paidFee}</div>
              </div>

              <div style={{ background: '#FEF2F2', padding: '0.6rem 0.4rem', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#991B1B' }}>BALANCE</div>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: '#DC2626', marginTop: '2px' }}>{feeData.remainingFee}</div>
              </div>
            </div>
          )}
        </div>

        {/* 10. 📢 LATEST ANNOUNCEMENT */}
        <div className="student-card" style={{ marginBottom: 0 }}>
          <div className="student-card-title">
            <h3>
              <Megaphone size={18} color="#1E3A8A" /> Latest Announcement
            </h3>
            <Link to="/student/announcements" className="student-link-btn">
              View All <ChevronRight size={14} />
            </Link>
          </div>

          {loadingAnnouncement ? (
            <div style={{ fontSize: '0.85rem', color: '#64748B', fontStyle: 'italic' }}>Loading announcement...</div>
          ) : latestAnnouncement ? (
            <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', padding: '0.75rem', borderRadius: '8px' }}>
              <strong style={{ fontSize: '0.88rem', color: '#92400E', display: 'block' }}>
                📢 {latestAnnouncement.title}
              </strong>
              <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.8rem', color: '#78350F' }}>
                {latestAnnouncement.content || latestAnnouncement.description}
              </p>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#64748B' }}>No recent announcements.</div>
          )}
        </div>
      </div>

      {/* STUDENT ASSIGNMENT QUICK DETAIL MODAL */}
      {selectedAssignment && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(15, 23, 42, 0.75)',
            backdropFilter: 'blur(3px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setSelectedAssignment(null)}
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: '16px',
              maxWidth: '600px',
              width: '100%',
              padding: '1.5rem',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.15)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
              <div>
                <span style={{ background: '#EFF6FF', color: '#1E3A8A', fontWeight: 900, fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                  {selectedAssignment.subject} • {selectedAssignment.standard} Standard
                </span>
                <h3 style={{ margin: '0.3rem 0 0 0', color: '#0F172A', fontWeight: 900, fontSize: '1.25rem' }}>
                  📚 {selectedAssignment.title}
                </h3>
              </div>
              <button onClick={() => setSelectedAssignment(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={18} color="#64748B" />
              </button>
            </div>

            <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1rem', fontSize: '0.82rem', color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
              <div>Teacher: <strong style={{ color: '#0F172A' }}>{selectedAssignment.teacher || 'Unique Classes Faculty'}</strong></div>
              <div>Posted: <strong style={{ color: '#0F172A' }}>{new Date(selectedAssignment.postedDate || selectedAssignment.createdAt).toLocaleDateString('en-GB')}</strong></div>
              <div>Due Date: <strong style={{ color: '#1E3A8A' }}>{new Date(selectedAssignment.dueDate).toLocaleDateString('en-GB')}</strong></div>
            </div>

            {selectedAssignment.description && (
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', color: '#1E3A8A', fontSize: '0.92rem', fontWeight: 800 }}>Description:</h4>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>{selectedAssignment.description}</p>
              </div>
            )}

            {selectedAssignment.attachmentUrl && (
              <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                <h4 style={{ margin: '0 0 0.75rem 0', color: '#1E3A8A', fontSize: '0.95rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Paperclip size={16} /> Attachment ({selectedAssignment.attachmentType})
                </h4>

                {selectedAssignment.attachmentType === 'Image' ? (
                  <div style={{ textAlign: 'center', background: '#F8FAFC', padding: '0.75rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <img src={selectedAssignment.attachmentUrl} alt={selectedAssignment.title} style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', objectFit: 'contain' }} />
                  </div>
                ) : (
                  <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E3A8A', fontWeight: 800, fontSize: '0.9rem' }}>
                      <Paperclip size={20} /> PDF Document
                    </div>
                    <a
                      href={selectedAssignment.attachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ background: '#1E3A8A', color: '#FFFFFF', padding: '0.6rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                    >
                      Open PDF In Browser
                    </a>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </StudentLayout>
  );
};

export default StudentDashboard;
