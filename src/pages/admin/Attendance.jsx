import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Calendar, CheckCircle2, XCircle, Users, Percent, Search, Save, RotateCcw, Filter, X, Loader2, Check, AlertCircle, User, Award, Lock, Unlock, Edit3, Clock } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import MonthlyAttendanceGrid from '../../components/common/MonthlyAttendanceGrid';
import {
  getStudentsAPI,
  getTeachersAPI,
  getAttendanceAPI,
  getAttendanceProgressAPI,
  getAttendanceHistoryAPI,
  markAttendanceAPI,
  getAttendanceStudentsAPI,
  getAssignedTeacherAPI,
  getSubjectsByClassAPI,
  checkAttendanceScheduleAPI
} from '../../services/api';
import '../../styles/admin/attendance.css';

const STANDARDS_LIST = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', 'Navodaya'];
const SUBJECTS_LIST = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology'];
const MONTHS_LIST = [
  { value: '1', label: 'January' },
  { value: '2', label: 'February' },
  { value: '3', label: 'March' },
  { value: '4', label: 'April' },
  { value: '5', label: 'May' },
  { value: '6', label: 'June' },
  { value: '7', label: 'July' },
  { value: '8', label: 'August' },
  { value: '9', label: 'September' },
  { value: '10', label: 'October' },
  { value: '11', label: 'November' },
  { value: '12', label: 'December' }
];

const formatTo12h = (tStr) => {
  if (!tStr || tStr === 'N/A') return '';
  if (tStr.includes('AM') || tStr.includes('PM')) return tStr;
  const parts = tStr.split(':');
  if (parts.length < 2) return tStr;
  let h = parseInt(parts[0], 10);
  const m = parts[1];
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12;
  if (h === 0) h = 12;
  return `${String(h).padStart(2, '0')}:${m} ${ampm}`;
};

const formatTo24h = (tStr) => {
  if (!tStr) return '';
  const trimmed = String(tStr).trim();
  if (!trimmed.includes('AM') && !trimmed.includes('PM')) {
    const parts = trimmed.split(':');
    if (parts.length >= 2) {
      const h = parseInt(parts[0], 10);
      const m = parseInt(parts[1], 10);
      if (!isNaN(h) && !isNaN(m)) {
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
      }
    }
    return trimmed;
  }
  const isPM = trimmed.toUpperCase().includes('PM');
  const clean = trimmed.toUpperCase().replace('AM', '').replace('PM', '').trim();
  const parts = clean.split(':');
  if (parts.length < 2) return trimmed;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return trimmed;
  if (isPM && hours < 12) hours += 12;
  if (!isPM && hours === 12) hours = 0;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
};

const Attendance = () => {
  // Main Tab State: 'mark' | 'history'
  const [activeTab, setActiveTab] = useState('mark');

  // Session Attendance Type Mode: 'ATTENDANCE' | 'HOLIDAY' | 'CLOSED'
  const [attendanceType, setAttendanceType] = useState('ATTENDANCE');

  // Common Selection & Filter States
  const [selectedStandard, setSelectedStandard] = useState('10th');
  const [availableSubjects, setAvailableSubjects] = useState(SUBJECTS_LIST);
  const [selectedSubject, setSelectedSubject] = useState('Mathematics');
  const [selectedTeacher, setSelectedTeacher] = useState('');
  const [selectedDate, setSelectedDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [hasValidSchedule, setHasValidSchedule] = useState(true);
  const [scheduleMessage, setScheduleMessage] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(String(new Date().getMonth() + 1));
  const [selectedYear, setSelectedYear] = useState(String(new Date().getFullYear()));
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch available subjects for selected standard from backend database
  useEffect(() => {
    const fetchSubjectsForClass = async () => {
      try {
        const res = await getSubjectsByClassAPI(selectedStandard);
        if (res && res.success && Array.isArray(res.subjects) && res.subjects.length > 0) {
          setAvailableSubjects(res.subjects);
          if (!res.subjects.includes(selectedSubject)) {
            setSelectedSubject(res.subjects[0]);
          }
        }
      } catch (err) {
        console.warn('Error fetching subjects for class:', err);
      }
    };
    fetchSubjectsForClass();
  }, [selectedStandard]);

  // Attendance Progress State
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressState, setProgressState] = useState({
    requiredSubjects: ['Mathematics', 'Science', 'English'],
    completedSubjects: [],
    pendingSubjects: ['Mathematics', 'Science', 'English'],
    completedCount: 0,
    totalRequired: 3,
    allCompleted: false
  });

  // Fetch real attendance progress from MongoDB
  const fetchAttendanceProgress = useCallback(async () => {
    setProgressLoading(true);
    try {
      const res = await getAttendanceProgressAPI({
        standard: selectedStandard,
        date: selectedDate
      });
      if (res && res.success) {
        setProgressState({
          requiredSubjects: res.requiredSubjects || ['Mathematics', 'Science', 'English'],
          completedSubjects: res.completedSubjects || [],
          pendingSubjects: res.pendingSubjects || [],
          completedCount: res.completedCount || 0,
          totalRequired: res.totalRequired || 3,
          allCompleted: res.allCompleted || false
        });
      }
    } catch (err) {
      console.warn('Progress fetch error:', err);
    } finally {
      setProgressLoading(false);
    }
  }, [selectedStandard, selectedDate]);

  useEffect(() => {
    fetchAttendanceProgress();
  }, [fetchAttendanceProgress]);

  // Data Lists & Lock State
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);
  const [attendanceMarks, setAttendanceMarks] = useState({}); // { studentId: 'Present' | 'Absent' }
  const [historyRecords, setHistoryRecords] = useState([]);
  const [monthlyGrid, setMonthlyGrid] = useState(null);
  const [hasSavedAttendance, setHasSavedAttendance] = useState(false);
  const [isLocked, setIsLocked] = useState(false);

  // UI Loading & Feedback
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [apiError, setApiError] = useState('');

  // SINGLE STATE FOR STUDENT ATTENDANCE DETAILS CENTERED MODAL
  const [selectedStudentForModal, setSelectedStudentForModal] = useState(null);
  const [studentModalRecords, setStudentModalRecords] = useState([]);
  const [modalLoading, setModalLoading] = useState(false);

  // Lock background body scrolling when student modal is active
  useEffect(() => {
    if (selectedStudentForModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [selectedStudentForModal]);

  // Toast message helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Auto-Assigned Teacher States
  const [assignedTeacherObj, setAssignedTeacherObj] = useState(null);
  const [assignedTeacherLoading, setAssignedTeacherLoading] = useState(false);
  const [assignedTeacherDisplay, setAssignedTeacherDisplay] = useState('Loading teacher...');
  const [historicalTeacherName, setHistoricalTeacherName] = useState('');

  // Fetch Auto-Assigned Teacher for selected Class + Subject from Batch / Teacher allocations
  const fetchAutoAssignedTeacher = useCallback(async (std, subj) => {
    setAssignedTeacherLoading(true);
    setAssignedTeacherObj(null);
    setAssignedTeacherDisplay('Loading teacher...');
    try {
      const res = await getAssignedTeacherAPI({ standard: std, subject: subj });
      if (res && res.success) {
        if (res.teacher) {
          setAssignedTeacherObj(res.teacher);
          setSelectedTeacher(res.teacher._id);
          setAssignedTeacherDisplay(res.teacher.name);
        } else if (res.multiple) {
          setAssignedTeacherObj(null);
          setSelectedTeacher('');
          setAssignedTeacherDisplay('Multiple Teachers Assigned');
        } else {
          setAssignedTeacherObj(null);
          setSelectedTeacher('');
          setAssignedTeacherDisplay('No Teacher Assigned');
        }
      } else {
        setAssignedTeacherObj(null);
        setSelectedTeacher('');
        setAssignedTeacherDisplay('No Teacher Assigned');
      }
    } catch (err) {
      console.warn('Auto teacher fetch notice:', err.message);
      setAssignedTeacherObj(null);
      setSelectedTeacher('');
      setAssignedTeacherDisplay('No Teacher Assigned');
    } finally {
      setAssignedTeacherLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAutoAssignedTeacher(selectedStandard, selectedSubject);
  }, [selectedStandard, selectedSubject, fetchAutoAssignedTeacher]);

  // 1. Fetch Teachers List for dropdown (background reference)
  useEffect(() => {
    const fetchTeachersList = async () => {
      try {
        const res = await getTeachersAPI();
        if (res.success && res.teachers) {
          setTeachers(res.teachers);
        }
      } catch (err) {
        console.warn('Teacher fetch for attendance notice:', err.message);
      }
    };
    fetchTeachersList();
  }, []);

  // 2. Fetch Students for selected standard & pre-fill existing attendance if saved
  const fetchStudentsAndExistingAttendance = useCallback(async (std, subj, teacherId, dateStr) => {
    setLoading(true);
    setApiError('');
    try {
      // Fetch real active students in standard & subject
      const stdRes = await getAttendanceStudentsAPI({ standard: std, subject: subj });
      const studentList = (stdRes && stdRes.success && stdRes.students) ? stdRes.students : [];
      setStudents(studentList);

      // Fetch existing saved attendance for date & subject
      const attRes = await getAttendanceAPI({ standard: std, date: dateStr, subject: subj });
      const existing = (attRes && attRes.success && attRes.records)
        ? attRes.records
        : ((attRes && attRes.attendance) ? attRes.attendance : []);
      const sessionObj = (attRes && attRes.success && attRes.session) ? attRes.session : null;

      const initialMarks = {};
      let isHoliday = false;
      let isClosed = false;

      if (sessionObj || existing.length > 0) {
        setHasSavedAttendance(true);
        setIsLocked(true); // Automatically lock saved attendance
        if (sessionObj?.teacherName || sessionObj?.teacherId) {
          if (sessionObj.teacherName) setHistoricalTeacherName(sessionObj.teacherName);
          if (sessionObj.teacherId) setSelectedTeacher(sessionObj.teacherId);
        }

        existing.forEach(a => {
          const sId = (a.student && typeof a.student === 'object')
            ? (a.student._id || a.student.id)
            : (a.studentId || a.student);
          if (sId) {
            initialMarks[sId] = a.status || 'Present';
            if (a.status === 'Holiday') isHoliday = true;
            if (a.status === 'Closed') isClosed = true;
          }
        });

        if (sessionObj?.attendanceType === 'HOLIDAY' || isHoliday) setAttendanceType('HOLIDAY');
        else if (sessionObj?.attendanceType === 'CLOSED' || isClosed) setAttendanceType('CLOSED');
        else setAttendanceType('ATTENDANCE');
      } else {
        setHasSavedAttendance(false);
        setIsLocked(false); // New attendance is unlocked
        setAttendanceType('ATTENDANCE');
        setHistoricalTeacherName('');
      }

      studentList.forEach(s => {
        const sId = s._id || s.id;
        if (!initialMarks[sId]) {
          initialMarks[sId] = 'Present';
        }
      });

      setAttendanceMarks(initialMarks);

      if (sessionObj) {
        setStartTime(formatTo12h(sessionObj.startTime || attRes.startTime || ''));
        setEndTime(formatTo12h(sessionObj.endTime || attRes.endTime || ''));
      } else {
        setStartTime('');
        setEndTime('');
      }
      setHasValidSchedule(true);
      setScheduleMessage('');
    } catch (err) {
      console.error('[Admin Attendance] Data fetch error:', err);
      setApiError(err.message || 'Unable to load students or attendance for marking.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 3. Fetch History Records for History Tab
  const fetchHistoryRecords = useCallback(async (std, subj, teacherId, monthVal, yearVal) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getAttendanceHistoryAPI({
        standard: std,
        subject: subj,
        teacher: teacherId,
        month: monthVal,
        year: yearVal
      });

      if (res && res.success) {
        setHistoryRecords(res.historyRecords || res.attendance || []);
        const y = parseInt(yearVal || new Date().getFullYear(), 10);
        const m = parseInt(monthVal || new Date().getMonth() + 1, 10);
        const daysInMonth = (isNaN(y) || isNaN(m)) ? 30 : new Date(y, m, 0).getDate();

        const formattedGridData = (res.gridData || []).map(g => ({
          student: {
            _id: g.studentId,
            id: g.studentId,
            name: g.name,
            rollNo: g.rollNo,
            studentId: g.studentCode
          },
          days: g.dailyStatus || {},
          presentCount: g.presentCount || 0,
          absentCount: g.absentCount || 0,
          pct: g.percentage || 0
        }));

        setMonthlyGrid({
          daysInMonth,
          recordedDaysCount: res.totalDays || 0,
          gridData: formattedGridData
        });
      }
    } catch (err) {
      console.error('[Admin Attendance] History fetch error:', err);
      setApiError('Unable to load attendance history.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Clear stale attendance state when Standard, Subject, Teacher, or Date changes
  useEffect(() => {
    setAttendanceMarks({});
    setHasSavedAttendance(false);
    setIsLocked(false);
    setStudents([]);
  }, [selectedStandard, selectedSubject, selectedTeacher, selectedDate]);

  // Window Focus Revalidation (Refetches fresh MongoDB attendance when Admin returns to browser tab)
  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === 'mark') {
        fetchStudentsAndExistingAttendance(selectedStandard, selectedSubject, selectedTeacher, selectedDate);
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTab, selectedStandard, selectedSubject, selectedTeacher, selectedDate, fetchStudentsAndExistingAttendance]);

  // Auto Trigger Fetch on Selection Change
  useEffect(() => {
    if (activeTab === 'mark') {
      fetchStudentsAndExistingAttendance(selectedStandard, selectedSubject, selectedTeacher, selectedDate);
    } else {
      fetchHistoryRecords(selectedStandard, selectedSubject, selectedTeacher, selectedMonth, selectedYear);
    }
  }, [activeTab, selectedStandard, selectedSubject, selectedTeacher, selectedDate, selectedMonth, selectedYear, fetchStudentsAndExistingAttendance, fetchHistoryRecords]);

  // Handle Mark Change
  const handleMarkStatusChange = (studentId, statusVal) => {
    if (isLocked) return; // Prevent change when locked
    setAttendanceMarks(prev => ({
      ...prev,
      [studentId]: statusVal
    }));
  };

  // Submit Mark Attendance to MySQL Backend (POST /api/attendance)
  const handleSaveAttendance = async () => {
    if (!selectedStandard || !selectedSubject || !selectedDate) {
      alert('Please select Class, Subject and Date.');
      return;
    }
    if (attendanceType === 'ATTENDANCE') {
      if (!startTime.trim() || !endTime.trim()) {
        alert('Please enter Start Time and End Time.');
        return;
      }
      if (students.length === 0) {
        alert('No students found for this Class and Subject.');
        return;
      }
    }

    setSaving(true);
    setApiError('');

    try {
      const attendancePayload = {
        standard: selectedStandard,
        subject: selectedSubject,
        teacher: selectedTeacher || null,
        teacherId: selectedTeacher || null,
        date: selectedDate,
        attendanceDate: selectedDate,
        startTime: attendanceType === 'ATTENDANCE' ? startTime.trim() : 'N/A',
        endTime: attendanceType === 'ATTENDANCE' ? endTime.trim() : 'N/A',
        attendanceType: attendanceType,
        userRole: 'admin',
        isAdmin: true,
        attendance: attendanceType === 'ATTENDANCE' ? students.map(s => {
          const sId = s._id || s.id;
          return {
            student: sId,
            studentId: sId,
            studentCode: s.studentId || s.student_id || `STU${sId}`,
            studentName: s.name || s.full_name || 'Student',
            rollNo: s.rollNo || s.roll_no || '',
            status: attendanceMarks[sId] || 'Present',
            attendanceType: attendanceType,
            startTime: startTime.trim(),
            endTime: endTime.trim()
          };
        }) : (attendanceType === 'HOLIDAY' ? students.map(s => {
          const sId = s._id || s.id;
          return {
            student: sId,
            studentId: sId,
            studentCode: s.studentId || s.student_id || `STU${sId}`,
            studentName: s.name || s.full_name || 'Student',
            rollNo: s.rollNo || s.roll_no || '',
            status: 'Holiday',
            attendanceType: 'HOLIDAY',
            startTime: 'N/A',
            endTime: 'N/A'
          };
        }) : [])
      };

      const res = await markAttendanceAPI(attendancePayload);

      if (res && res.success) {
        showToast(hasSavedAttendance ? 'Attendance updated and locked successfully.' : 'Daily attendance saved and locked successfully.');
        setHasSavedAttendance(true);
        setIsLocked(true); // Lock immediately after saving
        await fetchAttendanceProgress(); // Refresh progress card from database
        fetchHistoryRecords(selectedStandard, selectedSubject, selectedTeacher, selectedMonth, selectedYear);
      } else {
        setApiError(res.message || 'Attendance could not be saved. Please try again.');
      }
    } catch (err) {
      console.error('[Admin Attendance] Save error:', err);
      setApiError(err.message || 'Attendance could not be saved. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // Toggle Unlock Mode to allow editing saved attendance
  const handleUnlockAttendance = () => {
    setIsLocked(false);
    showToast('Attendance unlocked for editing. Click Update Attendance when finished.');
  };

  // OPEN CENTERED STUDENT ATTENDANCE DETAILS MODAL VIA REACT PORTAL
  const handleOpenStudentModal = async (studentItem) => {
    setSelectedStudentForModal(studentItem);
    setModalLoading(true);

    try {
      const sId = studentItem._id || studentItem.id;
      const res = await getAttendanceAPI({ standard: selectedStandard });
      const allRecords = (res.success && res.attendance) ? res.attendance : [];

      const filtered = allRecords.filter(a => {
        const studentObjId = (a.student && typeof a.student === 'object') ? (a.student._id || a.student.id) : a.student;
        return String(studentObjId) === String(sId);
      });

      setStudentModalRecords(filtered);
    } catch (err) {
      console.warn('Student modal records fetch notice:', err.message);
      setStudentModalRecords([]);
    } finally {
      setModalLoading(false);
    }
  };

  const handleCloseStudentModal = () => {
    setSelectedStudentForModal(null);
    setStudentModalRecords([]);
  };

  // Compute History Tab Summary Metrics
  const historyTotal = historyRecords.length;
  const historyPresent = historyRecords.filter(r => r.status === 'Present').length;
  const historyAbsent = historyRecords.filter(r => r.status === 'Absent').length;
  const historyPercentage = historyTotal > 0 ? ((historyPresent / historyTotal) * 100).toFixed(1) : '0';

  // Compute Student Modal Specific Metrics
  const modalTotal = studentModalRecords.length;
  const modalPresent = studentModalRecords.filter(r => r.status === 'Present').length;
  const modalAbsent = studentModalRecords.filter(r => r.status === 'Absent').length;
  const modalPercentage = modalTotal > 0 ? ((modalPresent / modalTotal) * 100).toFixed(1) : '0';

  // Filter students by search in Mark Tab
  const filteredStudents = students.filter(s => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (s.name && s.name.toLowerCase().includes(q)) ||
           (s.studentId && s.studentId.toLowerCase().includes(q)) ||
           (s.rollNo && String(s.rollNo).includes(q));
  });

  return (
    <AdminLayout>
      <div className="attendance-container">
        {/* Page Header Bar */}
        <div className="att-top-bar">
          <div>
            <h1 className="att-heading">Attendance Management</h1>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px', marginBottom: 0 }}>
              Mark daily class attendance, lock saved entries, and view monthly attendance history.
            </p>
          </div>
        </div>

        {/* Toast Banner */}
        {toastMessage && (
          <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <CheckCircle2 size={20} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* API Error Banner */}
        {apiError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
        )}

        {/* Attendance Navigation Tabs */}
        <div className="att-tab-nav">
          <button
            className={"att-tab-btn " + (activeTab === 'mark' ? 'active' : '')}
            onClick={() => setActiveTab('mark')}
          >
            Mark Daily Attendance
          </button>
          <button
            className={"att-tab-btn " + (activeTab === 'history' ? 'active' : '')}
            onClick={() => setActiveTab('history')}
          >
            Attendance History & Matrix
          </button>
        </div>

        {/* ==================================================
            TAB 1: MARK DAILY ATTENDANCE
            ================================================== */}
        {activeTab === 'mark' && (
          <div>
            {/* Mark Attendance Control Bar */}
            <div className="att-filter-card">
              <div className="att-field-group">
                <label>Class / Standard</label>
                <select
                  className="att-select-input"
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                >
                  {STANDARDS_LIST.map(std => (
                    <option key={std} value={std}>{std} Class</option>
                  ))}
                </select>
              </div>

              <div className="att-field-group">
                <label>Subject</label>
                <select
                  className="att-select-input"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  {availableSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>

              <div className="att-field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  Assigned Teacher <Lock size={12} color="#666" />
                </label>
                <div
                  className="att-select-input"
                  style={{
                    background: '#F3F4F6',
                    color: assignedTeacherLoading
                      ? '#6B7280'
                      : (hasSavedAttendance && historicalTeacherName
                          ? '#1E3A8A'
                          : (assignedTeacherObj ? '#1E3A8A' : '#DC2626')),
                    fontWeight: 800,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    borderRadius: '6px',
                    border: '1px solid #D1D5DB',
                    cursor: 'not-allowed',
                    minHeight: '38px',
                    fontSize: '0.9rem'
                  }}
                >
                  <span>
                    {assignedTeacherLoading
                      ? 'Loading teacher...'
                      : (hasSavedAttendance && historicalTeacherName
                          ? `${historicalTeacherName} (Saved)`
                          : (assignedTeacherObj
                              ? assignedTeacherObj.name
                              : assignedTeacherDisplay))}
                  </span>
                  <Lock size={14} color="#9CA3AF" />
                </div>
              </div>

              <div className="att-field-group">
                <label>Attendance Date</label>
                <input
                  type="date"
                  className="att-date-input"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </div>

              <div className="att-field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color="#1E3A8A" /> Start Time
                </label>
                <input
                  type="time"
                  className="att-date-input"
                  value={formatTo24h(startTime)}
                  onChange={(e) => setStartTime(formatTo12h(e.target.value))}
                  disabled={isLocked}
                  style={{ minHeight: '38px', padding: '0.4rem 0.6rem', fontSize: '0.9rem', fontWeight: 600, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                />
              </div>

              <div className="att-field-group">
                <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  <Clock size={13} color="#1E3A8A" /> End Time
                </label>
                <input
                  type="time"
                  className="att-date-input"
                  value={formatTo24h(endTime)}
                  onChange={(e) => setEndTime(formatTo12h(e.target.value))}
                  disabled={isLocked}
                  style={{ minHeight: '38px', padding: '0.4rem 0.6rem', fontSize: '0.9rem', fontWeight: 600, cursor: isLocked ? 'not-allowed' : 'pointer' }}
                />
              </div>

              {/* Session Mode Selector */}
              <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
                <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#444444', marginRight: '0.5rem' }}>SESSION MODE:</span>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setAttendanceType('ATTENDANCE')}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    border: attendanceType === 'ATTENDANCE' ? '2px solid #1E3A8A' : '1px solid #D1D5DB',
                    background: attendanceType === 'ATTENDANCE' ? '#EFF6FF' : '#FFFFFF',
                    color: attendanceType === 'ATTENDANCE' ? '#1E3A8A' : '#374151'
                  }}
                >
                  ✓ Class Attendance
                </button>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setAttendanceType('HOLIDAY')}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    border: attendanceType === 'HOLIDAY' ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                    background: attendanceType === 'HOLIDAY' ? '#EFF6FF' : '#FFFFFF',
                    color: attendanceType === 'HOLIDAY' ? '#1E40AF' : '#374151'
                  }}
                >
                  🏝 Mark Subject Holiday
                </button>
                <button
                  type="button"
                  disabled={isLocked}
                  onClick={() => setAttendanceType('CLOSED')}
                  style={{
                    padding: '0.45rem 0.9rem',
                    borderRadius: '6px',
                    fontWeight: 700,
                    fontSize: '0.84rem',
                    cursor: isLocked ? 'not-allowed' : 'pointer',
                    border: attendanceType === 'CLOSED' ? '2px solid #6B7280' : '1px solid #D1D5DB',
                    background: attendanceType === 'CLOSED' ? '#F3F4F6' : '#FFFFFF',
                    color: attendanceType === 'CLOSED' ? '#1F2937' : '#374151'
                  }}
                >
                  🚫 Mark Tuition Closed
                </button>
              </div>
            </div>

            {/* Unscheduled Class Alert Notice */}
            {!hasValidSchedule && (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1.5px solid #FCA5A5',
                  borderRadius: '10px',
                  padding: '0.85rem 1.1rem',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  color: '#991B1B',
                  fontWeight: 800,
                  fontSize: '0.88rem'
                }}
              >
                <AlertCircle size={22} style={{ color: '#DC2626', flexShrink: 0 }} />
                <span>{scheduleMessage || 'Attendance cannot be taken because no batch schedule is configured for this Class and Subject.'}</span>
              </div>
            )}

            {/* Compact Subject-Wise Attendance Progress Card */}
            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid #C9A227',
                borderRadius: '8px',
                padding: '1rem 1.25rem',
                marginBottom: '1.25rem',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                <strong style={{ fontSize: '0.92rem', color: '#171717', letterSpacing: '0.3px' }}>
                  Today's Attendance Progress ({selectedStandard} - {selectedDate ? new Date(selectedDate).toLocaleDateString('en-GB') : ''})
                </strong>
                <span
                  style={{
                    fontSize: '0.85rem',
                    fontWeight: 800,
                    padding: '0.2rem 0.75rem',
                    borderRadius: '99px',
                    background: progressState.allCompleted ? '#D1FAE5' : '#FEF3C7',
                    color: progressState.allCompleted ? '#065F46' : '#92400E'
                  }}
                >
                  {progressLoading ? 'Checking progress...' : `${progressState.completedCount} / ${progressState.totalRequired} Subjects Completed`}
                </span>
              </div>

              {progressLoading ? (
                <div style={{ fontSize: '0.85rem', color: '#666', fontStyle: 'italic' }}>
                  Checking attendance progress...
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
                    {progressState.requiredSubjects.map((sub) => {
                      const isDone = progressState.completedSubjects.includes(sub);
                      return (
                        <div
                          key={sub}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.4rem',
                            fontSize: '0.88rem',
                            fontWeight: 700,
                            color: isDone ? '#059669' : '#6B7280',
                            background: isDone ? '#ECFDF5' : '#F3F4F6',
                            border: isDone ? '1px solid #A7F3D0' : '1px solid #E5E7EB',
                            padding: '0.35rem 0.85rem',
                            borderRadius: '6px'
                          }}
                        >
                          {isDone ? <CheckCircle2 size={16} color="#059669" /> : <Clock size={16} color="#9CA3AF" />}
                          <span>{sub}</span>
                          <span style={{ fontSize: '0.75rem', fontWeight: 800, marginLeft: '0.2rem', color: isDone ? '#047857' : '#9CA3AF' }}>
                            {isDone ? 'Completed' : 'Pending'}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ fontSize: '0.82rem', color: progressState.allCompleted ? '#059669' : '#D97706', fontWeight: 600 }}>
                    {progressState.allCompleted ? (
                      '✓ All Subject Attendance Completed'
                    ) : (
                      `Complete attendance for all subjects (${progressState.pendingSubjects.join(', ')}) before sending WhatsApp notifications.`
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Lock Status Banner */}
            {hasSavedAttendance && (
              <div
                style={{
                  background: isLocked ? '#FFFBEB' : '#EFF6FF',
                  border: isLocked ? '1px solid #F59E0B' : '1px solid #3B82F6',
                  color: isLocked ? '#92400E' : '#1E40AF',
                  padding: '0.75rem 1.25rem',
                  borderRadius: '6px',
                  marginBottom: '1.25rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  fontWeight: 700,
                  fontSize: '0.9rem'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  {isLocked ? <Lock size={20} color="#D97706" /> : <Unlock size={20} color="#2563EB" />}
                  <span>
                    {isLocked ? (
                      <>
                        <strong>🔒 Saved & Locked:</strong> Attendance for <strong>{selectedStandard} Class ({selectedSubject})</strong> on <strong>{selectedDate}</strong> is saved & locked.
                      </>
                    ) : (
                      <>
                        <strong>🔓 Unlocked for Editing:</strong> You can now modify student attendance. Click <strong>Update Attendance</strong> to save changes.
                      </>
                    )}
                  </span>
                </div>

                {isLocked && (
                  <button
                    onClick={handleUnlockAttendance}
                    style={{
                      background: '#D97706',
                      color: '#FFF',
                      border: 'none',
                      padding: '0.4rem 0.9rem',
                      borderRadius: '4px',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '4px'
                    }}
                  >
                    <Edit3 size={14} /> Edit Attendance
                  </button>
                )}
              </div>
            )}

            {/* Student Attendance List Table */}
            <div className="att-table-card">
              <div className="att-table-toolbar">
                <div style={{ fontWeight: 800, color: '#1E3A8A', fontSize: '1.1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span>Student Attendance Sheet ({selectedStandard} Class - {selectedSubject})</span>
                  {hasSavedAttendance && (
                    <span
                      style={{
                        background: isLocked ? '#FEF3C7' : '#DBEAFE',
                        color: isLocked ? '#92400E' : '#1E40AF',
                        border: isLocked ? '1px solid #F59E0B' : '1px solid #3B82F6',
                        padding: '2px 8px',
                        borderRadius: '4px',
                        fontSize: '0.78rem',
                        fontWeight: 800
                      }}
                    >
                      {isLocked ? '🔒 Locked' : '✏️ Editing'}
                    </span>
                  )}
                </div>

                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search Student..."
                    className="att-search-input"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  <Search size={16} color="#666" style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }} />
                </div>
              </div>

              {loading ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                  <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div style={{ color: '#666', fontWeight: 600 }}>Loading students and attendance status...</div>
                </div>
              ) : filteredStudents.length > 0 ? (
                <>
                  <table className="att-table">
                    <thead>
                      <tr>
                        <th style={{ width: '80px' }}>Roll No</th>
                        <th>Student Name</th>
                        <th>Student ID</th>
                        <th style={{ textAlign: 'center' }}>Mark Attendance</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredStudents.map((student) => {
                        const sId = student._id || student.id;
                        const currentStatus = attendanceMarks[sId] || 'Present';

                        return (
                          <tr key={sId} style={{ opacity: isLocked ? 0.9 : 1 }}>
                            <td className="att-roll-cell">{student.rollNo || 'N/A'}</td>
                            <td className="att-name-cell">
                              <span
                                className="att-name-link"
                                onClick={() => handleOpenStudentModal(student)}
                                title="Click to view full attendance history in centered modal"
                              >
                                {student.name}
                              </span>
                            </td>
                            <td>{student.studentId || 'N/A'}</td>
                            <td style={{ textAlign: 'center' }}>
                              {attendanceType === 'HOLIDAY' ? (
                                <span style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                                  H Subject Holiday
                                </span>
                              ) : attendanceType === 'CLOSED' ? (
                                <span style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                                  − Tuition Closed
                                </span>
                              ) : (
                                <div className="att-radio-group">
                                  <label className={"att-radio-label present-radio " + (isLocked ? 'disabled-label' : '')} style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                    <input
                                      type="radio"
                                      name={"att_" + sId}
                                      value="Present"
                                      disabled={isLocked}
                                      checked={currentStatus === 'Present'}
                                      onChange={() => handleMarkStatusChange(sId, 'Present')}
                                    />
                                    Present
                                  </label>

                                  <label className={"att-radio-label absent-radio " + (isLocked ? 'disabled-label' : '')} style={{ cursor: isLocked ? 'not-allowed' : 'pointer' }}>
                                    <input
                                      type="radio"
                                      name={"att_" + sId}
                                      value="Absent"
                                      disabled={isLocked}
                                      checked={currentStatus === 'Absent'}
                                      onChange={() => handleMarkStatusChange(sId, 'Absent')}
                                    />
                                    Absent
                                  </label>
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  <div className="save-att-footer">
                    <span style={{ fontSize: '0.9rem', color: '#555', fontWeight: 600 }}>
                      Total Students: <strong>{filteredStudents.length}</strong>
                    </span>

                    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                      {isLocked ? (
                        <button
                          className="save-att-btn"
                          style={{ background: '#D97706', color: '#FFF', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                          onClick={handleUnlockAttendance}
                        >
                          <Edit3 size={16} /> Edit Attendance
                        </button>
                      ) : (
                        <button
                          className="save-att-btn"
                          onClick={handleSaveAttendance}
                          disabled={saving}
                        >
                          {saving ? (hasSavedAttendance ? 'Updating...' : 'Saving...') : (hasSavedAttendance ? 'Update Attendance' : 'Save Attendance')}
                        </button>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                  <Users size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div style={{ color: '#666', fontWeight: 600, fontSize: '0.95rem' }}>No student records found for {selectedStandard} Class in MongoDB.</div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ==================================================
            TAB 2: ATTENDANCE HISTORY & MONTHLY MATRIX
            ================================================== */}
        {activeTab === 'history' && (
          <div>
            {/* History Control Bar */}
            <div className="att-filter-card">
              <div className="att-field-group">
                <label>Month</label>
                <select
                  className="att-select-input"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                >
                  <option value="All">All Months</option>
                  {MONTHS_LIST.map(m => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </div>

              <div className="att-field-group">
                <label>Year</label>
                <select
                  className="att-select-input"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                </select>
              </div>

              <div className="att-field-group">
                <label>Class / Standard</label>
                <select
                  className="att-select-input"
                  value={selectedStandard}
                  onChange={(e) => setSelectedStandard(e.target.value)}
                >
                  <option value="All Standards">All Classes</option>
                  {STANDARDS_LIST.map(std => (
                    <option key={std} value={std}>{std} Class</option>
                  ))}
                </select>
              </div>

              <div className="att-field-group">
                <label>Subject</label>
                <select
                  className="att-select-input"
                  value={selectedSubject}
                  onChange={(e) => setSelectedSubject(e.target.value)}
                >
                  <option value="All Subjects">All Subjects</option>
                  {availableSubjects.map(sub => (
                    <option key={sub} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Monthly Attendance Register Grid */}
            <MonthlyAttendanceGrid
              monthlyGrid={monthlyGrid}
              loading={loading}
              selectedStandard={selectedStandard}
              selectedSubject={selectedSubject}
              selectedMonth={selectedMonth}
              selectedYear={selectedYear}
              onStudentClick={handleOpenStudentModal}
            />
          </div>
        )}

        {/* ==================================================
            CRITICAL REQUIREMENT: CENTERED STUDENT ATTENDANCE MODAL (REACT PORTAL ON DOCUMENT.BODY)
            ================================================== */}
        {selectedStudentForModal && ReactDOM.createPortal(
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              width: '100vw',
              height: '100vh',
              backgroundColor: 'rgba(0, 0, 0, 0.75)',
              zIndex: 99999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(3px)',
              padding: '1rem',
              boxSizing: 'border-box'
            }}
            onClick={handleCloseStudentModal}
          >
            <div
              style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #1E3A8A', padding: '1.75rem', maxWidth: '620px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#1E3A8A', fontWeight: 900, margin: 0 }}>Student Attendance</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    Attendance Record Overview
                  </span>
                </div>
                <button
                  onClick={handleCloseStudentModal}
                  style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Student Basic Info */}
              <div style={{ background: '#F8F5EC', padding: '1rem', borderRadius: '8px', border: '1px solid #E2DBD0', marginBottom: '1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#111', margin: 0 }}>{selectedStudentForModal.name}</h2>
                  <div style={{ fontSize: '0.88rem', fontWeight: 700, color: '#1E3A8A', marginTop: '2px' }}>
                    Student ID: {selectedStudentForModal.studentId || 'N/A'} | Roll No: {selectedStudentForModal.rollNo || 'N/A'}
                  </div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <span style={{ background: '#1E3A8A', color: '#FFF', fontSize: '0.85rem', fontWeight: 800, padding: '3px 10px', borderRadius: '4px' }}>
                    {selectedStudentForModal.standard || selectedStandard} Class
                  </span>
                </div>
              </div>

              {modalLoading ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center' }}>
                  <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>Loading student attendance history...</div>
                </div>
              ) : (
                <>
                  {/* Attendance Summary Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0.75rem', marginBottom: '1.25rem', textAlign: 'center' }}>
                    <div style={{ background: '#FFF', border: '1px solid #E2DBD0', padding: '0.75rem 0.5rem', borderRadius: '6px', borderTop: '3px solid #1E3A8A' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#666' }}>TOTAL DAYS</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111' }}>{modalTotal}</div>
                    </div>

                    <div style={{ background: '#ECFDF5', border: '1px solid #A7F3D0', padding: '0.75rem 0.5rem', borderRadius: '6px', borderTop: '3px solid #10B981' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#065F46' }}>PRESENT</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#065F46' }}>{modalPresent}</div>
                    </div>

                    <div style={{ background: '#FEF2F2', border: '1px solid #FECACA', padding: '0.75rem 0.5rem', borderRadius: '6px', borderTop: '3px solid #EF4444' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#991B1B' }}>ABSENT</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#991B1B' }}>{modalAbsent}</div>
                    </div>

                    <div style={{ background: '#FFF8E7', border: '1px solid #FCD34D', padding: '0.75rem 0.5rem', borderRadius: '6px', borderTop: '3px solid #D4AF37' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#92400E' }}>ATTENDANCE</div>
                      <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#1E3A8A' }}>{modalPercentage}%</div>
                    </div>
                  </div>

                  {/* Individual Attendance Records List */}
                  <div style={{ fontWeight: 800, color: '#1E3A8A', fontSize: '0.95rem', marginBottom: '0.5rem' }}>
                    Recent Attendance History:
                  </div>

                  {studentModalRecords.length > 0 ? (
                    <table className="att-table" style={{ fontSize: '0.88rem' }}>
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Subject</th>
                          <th>Teacher</th>
                          <th style={{ textAlign: 'center' }}>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {studentModalRecords.map((rec) => {
                          const formattedDate = rec.date ? new Date(rec.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
                          const tName = (rec.teacher && typeof rec.teacher === 'object') ? rec.teacher.name : 'Faculty';

                          return (
                            <tr key={rec._id || rec.id}>
                              <td style={{ fontWeight: 800, color: '#1E3A8A' }}>{formattedDate}</td>
                              <td>{rec.subject}</td>
                              <td>{tName}</td>
                              <td style={{ textAlign: 'center' }}>
                                <span className={rec.status === 'Present' ? 'badge-present' : 'badge-absent'}>
                                  {rec.status}
                                </span>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: '#F8F5EC', borderRadius: '6px', border: '1px solid #E2DBD0', color: '#666', fontWeight: 600 }}>
                      No saved attendance records found for this student yet.
                    </div>
                  )}

                  <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
                    <button type="button" className="save-att-btn" onClick={handleCloseStudentModal} style={{ padding: '0.5rem 2.5rem' }}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}
      </div>
    </AdminLayout>
  );
};

export default Attendance;
