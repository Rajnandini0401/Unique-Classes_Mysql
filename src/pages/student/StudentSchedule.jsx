import React, { useState, useEffect, useCallback } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import {
  Clock,
  Calendar,
  User,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Sparkles,
  Filter
} from 'lucide-react';
import { getCurrentStudentProfileAPI, getBatchesAPI } from '../../services/api';
import { normalizeSubject } from '../../config/academicConstants';

const DAY_TABS = [
  { key: 'Today', label: "Today's Schedule" },
  { key: 'Monday', label: 'Monday' },
  { key: 'Tuesday', label: 'Tuesday' },
  { key: 'Wednesday', label: 'Wednesday' },
  { key: 'Thursday', label: 'Thursday' },
  { key: 'Friday', label: 'Friday' },
  { key: 'Saturday', label: 'Saturday' },
  { key: 'Sunday', label: 'Sunday' }
];

const StudentSchedule = () => {
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [activeTab, setActiveTab] = useState('Today');

  const fetchScheduleData = useCallback(async () => {
    setLoadingStudent(true);
    setLoading(true);
    setErrorMsg('');

    try {
      const savedStudentId = localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');
      const meRes = await getCurrentStudentProfileAPI(savedStudentId || undefined);

      if (meRes.success && meRes.student) {
        const stdDoc = meRes.student;
        setStudent(stdDoc);

        // Fetch all batches for student's standard from MongoDB
        const batchRes = await getBatchesAPI({ standard: stdDoc.standard });
        if (batchRes.success && Array.isArray(batchRes.batches)) {
          setBatches(batchRes.batches);
        } else {
          setBatches([]);
        }
      } else {
        setErrorMsg('Unable to locate active student profile.');
      }
    } catch (err) {
      console.error('Error fetching student schedule:', err);
      setErrorMsg('Failed to load class schedule from MongoDB server.');
    } finally {
      setLoadingStudent(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchScheduleData();
  }, [fetchScheduleData]);

  if (loadingStudent || loading) {
    return (
      <StudentLayout>
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ color: '#1E3A8A', fontWeight: 800 }}>Loading My Schedule...</div>
        </div>
      </StudentLayout>
    );
  }

  if (errorMsg || !student) {
    return (
      <StudentLayout>
        <div className="student-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <AlertCircle size={48} color="#DC2626" style={{ margin: '0 auto 0.5rem auto' }} />
          <h3 style={{ color: '#1E293B', margin: 0 }}>{errorMsg || 'Student Record Not Found'}</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.3rem' }}>Please verify student account or contact admin.</p>
        </div>
      </StudentLayout>
    );
  }

  // Student registered subjects array
  const sSubjects = (Array.isArray(student.subjects) && student.subjects.length > 0 ? student.subjects : ['Math', 'Science', 'English']).map(s => normalizeSubject(s).toLowerCase());

  // Helper to convert 24h string to 12h string ("05:00" -> "05:00 AM")
  const formatTime12Hour = (timeStr) => {
    if (!timeStr) return '';
    const trimmed = String(timeStr).trim();
    if (/am|pm/i.test(trimmed)) return trimmed;
    const parts = trimmed.split(':');
    if (parts.length < 2) return trimmed;
    let hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (isNaN(hours)) return trimmed;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const formattedH = String(hours).padStart(2, '0');
    return `${formattedH}:${minutes} ${ampm}`;
  };

  // Sorting minutes helper
  const getSortMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const trimmed = String(timeStr).trim();
    let hours = 0;
    let minutes = 0;
    if (/am|pm/i.test(trimmed)) {
      const isPM = /pm/i.test(trimmed);
      const clean = trimmed.replace(/am|pm/gi, '').trim();
      const parts = clean.split(':');
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
      if (isPM && hours < 12) hours += 12;
      if (!isPM && hours === 12) hours = 0;
    } else {
      const parts = trimmed.split(':');
      hours = parseInt(parts[0], 10) || 0;
      minutes = parseInt(parts[1], 10) || 0;
    }
    return hours * 60 + minutes;
  };

  // Determine current day of week
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const todayName = dayNames[new Date().getDay()];
  const selectedDayName = activeTab === 'Today' ? todayName : activeTab;
  const isWeekend = ['Saturday', 'Sunday'].includes(selectedDayName);

  // Filter batches matching student class, subjects, and day
  const filteredSchedule = batches.filter((b) => {
    if (b.status === 'Inactive') return false;

    // Check subject match
    if (b.subject) {
      const normBSub = normalizeSubject(b.subject).toLowerCase();
      if (!sSubjects.includes(normBSub)) return false;
    }

    // Check day pattern match
    const pat = b.schedulePattern || 'Monday-Friday';
    if (pat === 'Monday-Friday') {
      return !isWeekend;
    } else if (pat === 'Saturday') {
      return selectedDayName === 'Saturday';
    } else if (pat === 'Sunday') {
      return selectedDayName === 'Sunday';
    } else if (pat === selectedDayName || b.day === selectedDayName) {
      return true;
    }

    return true;
  });

  // Sort schedule by start time
  filteredSchedule.sort((a, b) => getSortMinutes(a.startTime) - getSortMinutes(b.startTime));

  return (
    <StudentLayout student={student}>
      <div style={{ maxWidth: '960px', margin: '0 auto' }}>

        {/* PAGE TITLE */}
        <div className="student-card" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)', color: '#FFFFFF', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                TIMETABLE & LECTURE SCHEDULE
              </div>
              <h2 style={{ margin: '0.2rem 0 0', color: '#FFFFFF', fontSize: '1.3rem', fontWeight: 900 }}>
                My Class Schedule
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                Class {student.standard} • Enrolled Subjects: {student.subjects?.join(', ')}
              </p>
            </div>

            <div style={{ background: 'rgba(255,255,255,0.15)', padding: '0.4rem 0.85rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 800 }}>
              📅 Today: {todayName}
            </div>
          </div>
        </div>

        {/* DAY SELECTOR TABS */}
        <div
          style={{
            display: 'flex',
            gap: '0.4rem',
            overflowX: 'auto',
            paddingBottom: '0.5rem',
            marginBottom: '1rem',
            scrollbarWidth: 'thin'
          }}
        >
          {DAY_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                style={{
                  padding: '0.45rem 0.9rem',
                  fontSize: '0.82rem',
                  fontWeight: 800,
                  borderRadius: '8px',
                  border: isActive ? '1px solid #1E3A8A' : '1px solid #E2E8F0',
                  background: isActive ? '#1E3A8A' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#334155',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* SCHEDULE LIST */}
        <div className="student-card">
          <div className="student-card-title">
            <h3>
              <Clock size={18} color="#1E3A8A" />
              {activeTab === 'Today' ? `Today's Schedule (${todayName})` : `${activeTab} Schedule`}
            </h3>
          </div>

          {filteredSchedule.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {filteredSchedule.map((b, idx) => {
                const startTimeFmt = formatTime12Hour(b.startTime);
                const endTimeFmt = formatTime12Hour(b.endTime);
                const teacherName = b.teacher ? b.teacher.name : (b.teacherName || 'Assigned Faculty');

                return (
                  <div
                    key={b._id || idx}
                    style={{
                      background: '#F8FAFC',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      padding: '0.9rem 1.1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                      <div
                        style={{
                          background: '#DBEAFE',
                          color: '#1E3A8A',
                          borderRadius: '8px',
                          padding: '0.5rem 0.75rem',
                          fontWeight: 900,
                          fontSize: '0.85rem',
                          textAlign: 'center',
                          minWidth: '130px'
                        }}
                      >
                        <Clock size={13} style={{ verticalAlign: 'middle', marginRight: '4px' }} />
                        {startTimeFmt} - {endTimeFmt}
                      </div>

                      <div>
                        <div style={{ fontWeight: 900, fontSize: '0.98rem', color: '#0F172A' }}>
                          {normalizeSubject(b.subject)}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
                          <User size={13} color="#1E3A8A" /> Faculty: <strong style={{ color: '#334155' }}>{teacherName}</strong>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center' }}>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '4px',
                          background: b.scheduleType === 'Exam' ? '#FEF2F2' : '#ECFDF5',
                          color: b.scheduleType === 'Exam' ? '#DC2626' : '#059669'
                        }}
                      >
                        {b.scheduleType || 'Regular Class'}
                      </span>
                      <span style={{ fontSize: '0.72rem', fontWeight: 800, background: '#F1F5F9', color: '#475569', padding: '0.2rem 0.55rem', borderRadius: '4px' }}>
                        {b.schedulePattern || 'Monday-Friday'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div style={{ fontSize: '0.88rem', color: '#64748B', padding: '1.5rem 0', textAlign: 'center' }}>
              No classes scheduled for {selectedDayName}. Enjoy your study break!
            </div>
          )}
        </div>

      </div>
    </StudentLayout>
  );
};

export default StudentSchedule;
