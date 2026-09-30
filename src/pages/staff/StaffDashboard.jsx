import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import StaffLayout from '../../layouts/StaffLayout';
import {
  Users,
  UserCheck,
  FileCheck2,
  UserPlus,
  Clock,
  IndianRupee,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Send,
  Calendar,
  BookOpen,
  Activity,
  XCircle
} from 'lucide-react';
import { getStudentsAPI, getTestsAPI, getAttendanceAPI, getBatchesAPI } from '../../services/api';
import '../../styles/teacher/teacher-pages.css';

const StaffDashboard = () => {
  const navigate = useNavigate();
  const { user, staffProfile } = useContext(AuthContext) || {};
  const staffDisplayName = staffProfile?.name || user?.staffName || user?.name || 'Staff';

  // Data States
  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [todayAttendance, setTodayAttendance] = useState([]);
  const [todayBatches, setTodayBatches] = useState([]);

  // Loading States for independent section rendering
  const [loadingStudents, setLoadingStudents] = useState(true);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingAttendance, setLoadingAttendance] = useState(true);
  const [loadingBatches, setLoadingBatches] = useState(true);

  // Error States
  const [errorStudents, setErrorStudents] = useState('');
  const [errorTests, setErrorTests] = useState('');
  const [errorAttendance, setErrorAttendance] = useState('');
  const [errorBatches, setErrorBatches] = useState('');

  const todayStr = new Date().toISOString().split('T')[0];

  useEffect(() => {
    // 1. Fetch Students
    const fetchStudents = async () => {
      setLoadingStudents(true);
      setErrorStudents('');
      try {
        const res = await getStudentsAPI();
        if (res && res.students) {
          setStudents(res.students);
        }
      } catch (err) {
        console.warn('Dashboard Students Error:', err);
        setErrorStudents('Failed to load students count from MongoDB.');
      } finally {
        setLoadingStudents(false);
      }
    };

    // 2. Fetch Tests
    const fetchTests = async () => {
      setLoadingTests(true);
      setErrorTests('');
      try {
        const res = await getTestsAPI();
        if (res && res.tests) {
          setTests(res.tests);
        }
      } catch (err) {
        console.warn('Dashboard Tests Error:', err);
        setErrorTests('Failed to load tests count from MongoDB.');
      } finally {
        setLoadingTests(false);
      }
    };

    // 3. Fetch Today's Attendance
    const fetchTodayAttendance = async () => {
      setLoadingAttendance(true);
      setErrorAttendance('');
      try {
        const res = await getAttendanceAPI({ date: todayStr });
        if (res && res.attendance) {
          setTodayAttendance(res.attendance);
        }
      } catch (err) {
        console.warn('Dashboard Attendance Error:', err);
        setErrorAttendance('Failed to load today\'s attendance from MongoDB.');
      } finally {
        setLoadingAttendance(false);
      }
    };

    // 4. Fetch Schedules / Batches
    const fetchBatches = async () => {
      setLoadingBatches(true);
      setErrorBatches('');
      try {
        const res = await getBatchesAPI();
        const allBatches = res && res.batches ? res.batches : [];

        // Match today's day of week
        const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' });
        const filtered = allBatches.filter((b) => {
          if (!b.schedulePattern) return true;
          if (b.schedulePattern === 'Monday-Friday') return !['Saturday', 'Sunday'].includes(dayName);
          return b.schedulePattern === dayName;
        });

        // Sort descending class order (12th -> 5th)
        const classOrder = { '12th': 12, '11th': 11, '10th': 10, '9th': 9, '8th': 8, '7th': 7, '6th': 6, '5th': 5 };
        filtered.sort((a, b) => (classOrder[b.standard] || 0) - (classOrder[a.standard] || 0));

        setTodayBatches(filtered);
      } catch (err) {
        console.warn('Dashboard Batches Error:', err);
        setErrorBatches('Failed to load today\'s schedule from MongoDB.');
      } finally {
        setLoadingBatches(false);
      }
    };

    fetchStudents();
    fetchTests();
    fetchTodayAttendance();
    fetchBatches();
  }, [todayStr]);

  // Derived Values
  // Active Standards calculation
  const activeStdsList = [...new Set(students.map((s) => s.standard).filter(Boolean))];
  const orderMap = { '5th': 5, '6th': 6, '7th': 7, '8th': 8, '9th': 9, '10th': 10, '11th': 11, '12th': 12 };
  activeStdsList.sort((a, b) => (orderMap[a] || 0) - (orderMap[b] || 0));

  let activeStdsText = 'None';
  if (activeStdsList.length > 0) {
    activeStdsText = activeStdsList.length === 1 ? activeStdsList[0] : `${activeStdsList[0]} - ${activeStdsList[activeStdsList.length - 1]}`;
  }

  // Attendance breakdown
  const todayPresentCount = todayAttendance.filter((a) => (a.status || '').toLowerCase() === 'present').length;
  const todayAbsentCount = todayAttendance.filter((a) => (a.status || '').toLowerCase() === 'absent').length;

  // WhatsApp breakdown
  const waSentCount = todayAttendance.filter((a) => (a.status || '').toLowerCase() === 'absent' && a.notificationSent).length;
  const waPendingCount = todayAttendance.filter((a) => (a.status || '').toLowerCase() === 'absent' && !a.notificationSent).length;

  // Recent Activity Generation from real MongoDB items
  const recentActivities = [];

  // Recent Admissions
  [...students]
    .sort((a, b) => new Date(b.createdAt || b.admissionDate || 0) - new Date(a.createdAt || a.admissionDate || 0))
    .slice(0, 3)
    .forEach((s) => {
      recentActivities.push({
        id: `std-${s._id}`,
        type: 'ADMISSION',
        title: 'New Admission',
        description: `New student registered: ${s.name} (${s.standard || 'Class'})`,
        time: s.createdAt || s.admissionDate,
        icon: UserPlus,
        color: '#D4AF37'
      });
    });

  // Recent Attendance Submissions
  const uniqueAttGroups = {};
  todayAttendance.forEach((att) => {
    const key = `${att.standard}-${att.subject}`;
    if (!uniqueAttGroups[key]) {
      uniqueAttGroups[key] = att;
    }
  });

  Object.values(uniqueAttGroups).forEach((att) => {
    recentActivities.push({
      id: `att-${att._id}`,
      type: 'ATTENDANCE',
      title: 'Attendance Submitted',
      description: `${att.standard} ${att.subject} attendance recorded in MongoDB`,
      time: att.createdAt || att.date,
      icon: UserCheck,
      color: '#10B981'
    });
  });

  // Recent Tests Created
  [...tests]
    .sort((a, b) => new Date(b.createdAt || b.date || 0) - new Date(a.createdAt || a.date || 0))
    .slice(0, 3)
    .forEach((t) => {
      recentActivities.push({
        id: `test-${t._id}`,
        type: 'TEST',
        title: 'Test Created',
        description: `${t.testName || 'Test'} created for ${t.className || t.standard} ${t.subject}`,
        time: t.createdAt || t.date,
        icon: FileCheck2,
        color: '#3B82F6'
      });
    });

  // Sort aggregated real activities by timestamp descending & take top 5
  recentActivities.sort((a, b) => new Date(b.time || 0) - new Date(a.time || 0));
  const topActivities = recentActivities.slice(0, 5);

  return (
    <StaffLayout>
      <div className="teacher-page-container">
        {/* Welcome Banner */}
        <div className="teacher-welcome-banner">
          <div className="teacher-welcome-text">
            <h2>Welcome back, {staffDisplayName}! 📋</h2>
            <p>Manage student admissions, monitor class attendance, track examinations, and send WhatsApp alerts.</p>
          </div>
          <div className="teacher-welcome-actions">
            <button
              className="teacher-btn teacher-btn-primary"
              onClick={() => navigate('/staff/admission')}
              style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem' }}
            >
              <UserPlus size={18} />
              <span>+ New Admission</span>
            </button>
          </div>
        </div>



        {/* 3. TODAY'S SCHEDULE SECTION */}
        <div className="teacher-card-panel" style={{ marginTop: '1.5rem' }}>
          <div className="teacher-panel-header">
            <div className="teacher-panel-title-group">
              <Clock size={22} color="#D4AF37" />
              <div>
                <h3 className="teacher-panel-title">Today's Schedule</h3>
                <p className="teacher-panel-subtitle">Classes and lectures configured in MongoDB for today</p>
              </div>
            </div>
          </div>

          <div style={{ padding: '0.5rem 0' }}>
            {loadingBatches ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#666' }}>
                <Loader2 size={24} color="#D4AF37" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '0.5rem', fontWeight: 600 }}>Loading today's schedule from MongoDB...</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : errorBatches ? (
              <div style={{ padding: '1rem', color: '#DC2626', background: '#FEF2F2', borderRadius: '8px', fontSize: '0.9rem' }}>
                <AlertCircle size={16} style={{ display: 'inline', marginRight: '0.4rem' }} />
                {errorBatches}
              </div>
            ) : todayBatches.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '2rem 1rem', color: '#666666' }}>
                <Clock size={36} color="#CCCCCC" style={{ marginBottom: '0.5rem' }} />
                <p style={{ margin: 0, fontWeight: 600, fontSize: '0.95rem', color: '#4B5563' }}>No schedule available for today.</p>
              </div>
            ) : (
              <div className="teacher-table-responsive">
                <table className="teacher-table">
                  <thead>
                    <tr>
                      <th>Time</th>
                      <th>Class</th>
                      <th>Subject</th>
                      <th>Type / Room</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {todayBatches.map((b) => (
                      <tr key={b._id}>
                        <td style={{ fontWeight: 800 }}>{b.startTime} - {b.endTime}</td>
                        <td style={{ fontWeight: 700, color: '#171717' }}>{b.standard} Standard</td>
                        <td>
                          <span style={{ background: '#FAF7F0', border: '1px solid #E5E7EB', padding: '0.2rem 0.6rem', borderRadius: '4px', fontWeight: 700, fontSize: '0.85rem' }}>
                            {b.subject}
                          </span>
                        </td>
                        <td style={{ color: '#666666', fontSize: '0.85rem' }}>{b.scheduleType || 'Regular Class'}</td>
                        <td>
                          <span style={{ background: '#ECFDF5', color: '#065F46', padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                            <CheckCircle2 size={13} /> Scheduled
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* 4. QUICK OPERATIONS */}
        <div className="teacher-card-panel" style={{ marginTop: '1.5rem' }}>
          <div className="teacher-panel-header">
            <div className="teacher-panel-title-group">
              <Sparkles size={22} color="#D4AF37" />
              <div>
                <h3 className="teacher-panel-title">Staff Quick Operations</h3>
                <p className="teacher-panel-subtitle">Access core management tools instantly</p>
              </div>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.25rem', padding: '1rem 0' }}>
            {/* 1. Mark Attendance */}
            <div
              onClick={() => navigate('/staff/attendance')}
              style={{
                background: '#FAF7F0',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <UserCheck size={28} color="#D4AF37" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#171717', fontSize: '1.05rem' }}>Mark Attendance</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Record class attendance and send WhatsApp alerts.</p>
            </div>

            {/* 2. Tests & Marks */}
            <div
              onClick={() => navigate('/staff/tests')}
              style={{
                background: '#FAF7F0',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <FileCheck2 size={28} color="#171717" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#171717', fontSize: '1.05rem' }}>Tests & Marks</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Create tests, enter student marks and notify absentees.</p>
            </div>

            {/* 3. New Admission */}
            <div
              onClick={() => navigate('/staff/admission')}
              style={{
                background: '#FAF7F0',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <UserPlus size={28} color="#D4AF37" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#171717', fontSize: '1.05rem' }}>New Admission</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Register new students.</p>
            </div>

            {/* 4. Batches & Timetable */}
            <div
              onClick={() => navigate('/staff/batches')}
              style={{
                background: '#FAF7F0',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Clock size={28} color="#D4AF37" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#171717', fontSize: '1.05rem' }}>Batches & Timetable</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Manage class schedules, timing and teacher allocations.</p>
            </div>

            {/* 5. Fees & Payments */}
            <div
              onClick={() => navigate('/staff/fees')}
              style={{
                background: '#FAF7F0',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <IndianRupee size={28} color="#D4AF37" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#171717', fontSize: '1.05rem' }}>Fees & Payments</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Record payments, view fee balances and generate receipts.</p>
            </div>

            {/* 4. All Students Directory */}
            <div
              onClick={() => navigate('/staff/students')}
              style={{
                background: '#FAF7F0',
                border: '1px solid var(--border-light)',
                borderRadius: '12px',
                padding: '1.25rem',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              <Users size={28} color="#171717" style={{ marginBottom: '0.75rem' }} />
              <h4 style={{ margin: '0 0 0.4rem 0', color: '#171717', fontSize: '1.05rem' }}>All Students Directory</h4>
              <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>View student roster and full profiles.</p>
            </div>
          </div>
        </div>

        {/* 5. RECENT ACTIVITY & 6. WHATSAPP SUMMARY (2 COLUMNS) */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginTop: '1.5rem' }}>
          {/* RECENT ACTIVITY */}
          <div className="teacher-card-panel">
            <div className="teacher-panel-header">
              <div className="teacher-panel-title-group">
                <Activity size={22} color="#D4AF37" />
                <div>
                  <h3 className="teacher-panel-title">Recent Activity</h3>
                  <p className="teacher-panel-subtitle">Real activity recorded in MongoDB</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '0.75rem 0' }}>
              {loadingStudents || loadingAttendance || loadingTests ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>
                  <Loader2 size={20} className="animate-spin" />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading recent activity...</p>
                </div>
              ) : topActivities.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#666666' }}>
                  <Activity size={32} color="#CCCCCC" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#4B5563' }}>No recent activity.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {topActivities.map((act) => {
                    const IconComp = act.icon;
                    return (
                      <div
                        key={act.id}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.75rem',
                          padding: '0.75rem 1rem',
                          background: '#FAF7F0',
                          borderRadius: '8px',
                          border: '1px solid #F3F4F6'
                        }}
                      >
                        <div
                          style={{
                            width: '36px',
                            height: '36px',
                            borderRadius: '50%',
                            background: '#FFFFFF',
                            border: '1px solid #E5E7EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexShrink: 0
                          }}
                        >
                          <IconComp size={18} color={act.color} />
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <h5 style={{ margin: 0, fontSize: '0.88rem', color: '#171717', fontWeight: 700 }}>{act.title}</h5>
                          <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.8rem', color: '#666', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {act.description}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 6. TODAY'S WHATSAPP SUMMARY */}
          <div className="teacher-card-panel">
            <div className="teacher-panel-header">
              <div className="teacher-panel-title-group">
                <Send size={22} color="#25D366" />
                <div>
                  <h3 className="teacher-panel-title">WhatsApp Notifications Today</h3>
                  <p className="teacher-panel-subtitle">Absent notifications status for today</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '1rem 0' }}>
              {loadingAttendance ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#666' }}>
                  <Loader2 size={20} className="animate-spin" />
                  <p style={{ marginTop: '0.5rem', fontSize: '0.85rem' }}>Loading WhatsApp data...</p>
                </div>
              ) : todayAttendance.length === 0 || todayAbsentCount === 0 ? (
                <div style={{ textAlign: 'center', padding: '1.5rem', color: '#666666' }}>
                  <Send size={32} color="#CCCCCC" style={{ marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.9rem', color: '#4B5563' }}>No WhatsApp notifications sent today.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                    <CheckCircle2 size={24} color="#059669" style={{ marginBottom: '0.3rem' }} />
                    <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#065F46', fontWeight: 800 }}>{waSentCount}</h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#047857', fontWeight: 700 }}>Sent Successfully</p>
                  </div>

                  <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', padding: '1rem', borderRadius: '10px', textAlign: 'center' }}>
                    <AlertCircle size={24} color="#DC2626" style={{ marginBottom: '0.3rem' }} />
                    <h4 style={{ margin: 0, fontSize: '1.5rem', color: '#991B1B', fontWeight: 800 }}>{waPendingCount}</h4>
                    <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8rem', color: '#B91C1C', fontWeight: 700 }}>Pending / Unnotified</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </StaffLayout>
  );
};

export default StaffDashboard;
