import React, { useState, useEffect, useCallback } from 'react';
import StaffLayout from '../../layouts/StaffLayout';
import TeacherModal from '../../components/teacher/TeacherModal';
import {
  getAttendanceStudentsAPI,
  createAttendanceAPI,
  getAttendanceByClassAndDateAPI,
  sendManualWhatsAppNotificationsAPI,
  getAttendanceProgressAPI,
  getAttendanceHistoryAPI,
  getCoursesAPI
} from '../../services/api';
import MonthlyAttendanceGrid from '../../components/common/MonthlyAttendanceGrid';
import WhatsAppResultModal from '../../components/common/WhatsAppResultModal';
import {
  UserCheck,
  Calendar,
  BookOpen,
  Save,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Send,
  XCircle,
  Check,
  Clock
} from 'lucide-react';
import { SUPPORTED_CLASSES, SUPPORTED_SUBJECTS } from '../../config/academicConstants';
import '../../styles/teacher/teacher-pages.css';

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

const StaffAttendance = () => {
  const [selectedClass, setSelectedClass] = useState('10th');
  const [selectedSubject, setSelectedSubject] = useState('Math');
  const [attendanceDate, setAttendanceDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('05:00 AM');
  const [endTime, setEndTime] = useState('06:00 AM');
  const [subjectsList] = useState(SUPPORTED_SUBJECTS);

  // Subject-wise Attendance Completion Progress State
  const [progressLoading, setProgressLoading] = useState(false);
  const [progressState, setProgressState] = useState({
    requiredSubjects: ['Math', 'Science', 'English'],
    completedSubjects: [],
    pendingSubjects: ['Math', 'Science', 'English'],
    completedCount: 0,
    totalRequired: 3,
    allCompleted: false
  });

  // Roster & Attendance State
  const [students, setStudents] = useState([]);
  const [attendanceStatusMap, setAttendanceStatusMap] = useState({}); // { [studentId]: 'PRESENT' | 'ABSENT' }
  const [attendanceType, setAttendanceType] = useState('ATTENDANCE'); // 'ATTENDANCE' | 'HOLIDAY' | 'CLOSED'
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);
  const [waResult, setWaResult] = useState(null);

  // History & Navigation Tab States
  const [activeTab, setActiveTab] = useState('mark');
  const [historyMonth, setHistoryMonth] = useState(String(new Date().getMonth() + 1));
  const [historyYear, setHistoryYear] = useState(String(new Date().getFullYear()));
  const [monthlyGrid, setMonthlyGrid] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Modal & Feedback States
  const [waModalOpen, setWaModalOpen] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [lastSavedRecord, setLastSavedRecord] = useState(null);

  // Fetch attendance history callback
  const fetchAttendanceHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const res = await getAttendanceHistoryAPI({
        standard: selectedClass,
        subject: selectedSubject,
        month: historyMonth,
        year: historyYear
      });
      if (res && res.success) {
        setMonthlyGrid(res.monthlyGrid || null);
      }
    } catch (err) {
      console.warn('History fetch error:', err);
    } finally {
      setLoadingHistory(false);
    }
  }, [selectedClass, selectedSubject, historyMonth, historyYear]);

  // Fetch real attendance progress from MongoDB
  const fetchAttendanceProgress = useCallback(async () => {
    setProgressLoading(true);
    try {
      const res = await getAttendanceProgressAPI({
        standard: selectedClass,
        date: attendanceDate
      });
      if (res && res.success) {
        setProgressState({
          requiredSubjects: res.requiredSubjects || ['Math', 'Science', 'English'],
          completedSubjects: res.completedSubjects || [],
          pendingSubjects: res.pendingSubjects || [],
          completedCount: res.completedCount || 0,
          totalRequired: res.totalRequired || 3,
          allCompleted: res.allCompleted || false
        });
      }
    } catch (err) {
      console.warn('Attendance progress fetch error:', err);
    } finally {
      setProgressLoading(false);
    }
  }, [selectedClass, attendanceDate]);

  const getStudentKey = (std) => String(std?.id || std?._id || std?.studentId || std?.student_id || '');

  // Fetch class students & existing attendance
  const fetchStudentsAndAttendance = useCallback(async () => {
    setLoading(true);
    setErrorMsg('');
    setSuccessMsg('');
    setLastSavedRecord(null);

    try {
      // 1. Fetch real active students for selected standard & subject
      const studentsRes = await getAttendanceStudentsAPI({
        standard: selectedClass,
        subject: selectedSubject
      });
      const fetchedStudents = studentsRes.students || [];
      setStudents(fetchedStudents);

      // 2. Fetch existing attendance record for class, subject, date if recorded
      const attendanceRes = await getAttendanceByClassAndDateAPI({
        standard: selectedClass,
        subject: selectedSubject,
        date: attendanceDate
      });

      const initialStatus = {};
      let submittedFlag = false;
      let isHoliday = false;
      let isClosed = false;

      const rawAtt = attendanceRes && attendanceRes.attendance;
      const existingRecords = Array.isArray(rawAtt) ? rawAtt : (rawAtt ? [rawAtt] : []);
      const sessionObj = attendanceRes?.session;
      const recordsObj = attendanceRes?.records || [];
      const isTuitionClosed = attendanceRes?.isTuitionClosed || sessionObj?.attendanceType === 'CLOSED';
      const isSubjectHoliday = sessionObj?.attendanceType === 'HOLIDAY';

      if (isTuitionClosed || sessionObj?.attendanceType === 'CLOSED') {
        submittedFlag = true;
        isClosed = true;
        setAttendanceType('CLOSED');
      } else if (isSubjectHoliday || sessionObj?.attendanceType === 'HOLIDAY') {
        submittedFlag = true;
        isHoliday = true;
        setAttendanceType('HOLIDAY');
      } else if (existingRecords.length > 0 || recordsObj.length > 0 || attendanceRes?.isSubmitted) {
        submittedFlag = true;
        setLastSavedRecord(existingRecords[0] || sessionObj);
        if (existingRecords[0]?.startTime) setStartTime(existingRecords[0].startTime);
        else if (sessionObj?.startTime) setStartTime(sessionObj.startTime);
        if (existingRecords[0]?.endTime) setEndTime(existingRecords[0].endTime);
        else if (sessionObj?.endTime) setEndTime(sessionObj.endTime);

        const activeRecs = existingRecords.length > 0 ? existingRecords : recordsObj;
        activeRecs.forEach((attDoc) => {
          const stdId = String(attDoc.student_id || attDoc.studentId || (typeof attDoc.student === 'object' ? (attDoc.student?.id || attDoc.student?._id) : attDoc.student));
          if (stdId && stdId !== 'undefined') {
            initialStatus[stdId] = (attDoc.status || 'Present').toUpperCase();
            if (attDoc.status === 'Holiday') isHoliday = true;
            if (attDoc.status === 'Closed') isClosed = true;
          }
        });

        if (isHoliday) setAttendanceType('HOLIDAY');
        else if (isClosed) setAttendanceType('CLOSED');
        else setAttendanceType('ATTENDANCE');
      } else {
        setAttendanceType('ATTENDANCE');
      }

      setIsSubmitted(submittedFlag);

      // Default unmarked students to PRESENT
      fetchedStudents.forEach((std) => {
        const sKey = getStudentKey(std);
        if (!initialStatus[sKey]) {
          initialStatus[sKey] = isHoliday ? 'HOLIDAY' : isClosed ? 'CLOSED' : 'PRESENT';
        }
      });

      setAttendanceStatusMap(initialStatus);
    } catch (err) {
      console.error('Fetch Roster Error:', err);
      setErrorMsg(err.message || 'Unable to load student roster.');
    } finally {
      setLoading(false);
    }
  }, [selectedClass, selectedSubject, attendanceDate]);

  useEffect(() => {
    fetchStudentsAndAttendance();
  }, [fetchStudentsAndAttendance]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchAttendanceHistory();
    }
  }, [activeTab, selectedClass, selectedSubject, historyMonth, historyYear, fetchAttendanceHistory]);

  useEffect(() => {
    fetchAttendanceProgress();
  }, [fetchAttendanceProgress]);

  // Clear waResult, modal & stale attendance state when Class, Subject, or Date changes
  useEffect(() => {
    setWaResult(null);
    setWaModalOpen(false);
    setAttendanceStatusMap({});
    setIsSubmitted(false);
    setStudents([]);
  }, [selectedClass, selectedSubject, attendanceDate]);

  // Window Focus Revalidation (Refetches fresh attendance when Staff returns to browser tab)
  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === 'mark') {
        fetchStudentsAndAttendance();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTab, selectedClass, selectedSubject, attendanceDate, fetchStudentsAndAttendance]);

  // Toggle student Present / Absent status
  const handleToggleStatus = (studentId) => {
    if (isSubmitted) return;
    const sKey = String(studentId);
    setAttendanceStatusMap((prev) => ({
      ...prev,
      [sKey]: prev[sKey] === 'ABSENT' ? 'PRESENT' : 'ABSENT'
    }));
  };

  // Mark all Present / Absent helper
  const handleMarkAll = (status) => {
    if (isSubmitted) return;
    const nextMap = {};
    students.forEach((std) => {
      const sKey = getStudentKey(std);
      nextMap[sKey] = status;
    });
    setAttendanceStatusMap(nextMap);
  };

  // Action 1: MARK SUBJECT HOLIDAY
  const handleMarkSubjectHoliday = async () => {
    if (isSubmitted) {
      if (attendanceType === 'CLOSED') {
        setErrorMsg(`Tuition is marked CLOSED for ${attendanceDate}. Attendance/Holiday cannot be marked.`);
      } else if (attendanceType === 'HOLIDAY') {
        setErrorMsg(`Subject Holiday is already marked for ${selectedClass} (${selectedSubject}) on ${attendanceDate}.`);
      } else {
        setErrorMsg(`Attendance for ${selectedClass} (${selectedSubject}) on ${attendanceDate} has already been submitted.`);
      }
      return;
    }

    const confirmMark = window.confirm(`Are you sure you want to mark Subject Holiday for ${selectedClass} Class (${selectedSubject}) on ${attendanceDate}?`);
    if (!confirmMark) return;

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const recordsPayload = students.map((std) => {
        const sId = std.id || std._id;
        return {
          student: sId,
          studentId: sId,
          studentCode: std.studentId || std.student_id || `STU${sId}`,
          studentName: std.name || std.full_name || 'Student',
          rollNo: std.rollNo || std.roll_no || '',
          status: 'Holiday',
          attendanceType: 'HOLIDAY',
          startTime: 'N/A',
          endTime: 'N/A'
        };
      });

      const payload = {
        standard: selectedClass,
        subject: selectedSubject,
        date: attendanceDate,
        attendanceDate: attendanceDate,
        startTime: 'N/A',
        endTime: 'N/A',
        attendanceType: 'HOLIDAY',
        records: recordsPayload,
        attendance: recordsPayload,
        isStaff: true,
        userRole: 'staff'
      };

      const res = await createAttendanceAPI(payload);
      if (res && res.success) {
        setAttendanceType('HOLIDAY');
        setIsSubmitted(true);
        setSuccessMsg(`🏝 Subject Holiday successfully marked for ${selectedClass} Class (${selectedSubject}) on ${attendanceDate}.`);
        await fetchAttendanceProgress();
        fetchAttendanceHistory();
      } else {
        throw new Error(res?.message || 'Failed to mark subject holiday.');
      }
    } catch (err) {
      console.error('Mark Holiday Error:', err);
      setErrorMsg(err.message || 'Unable to mark subject holiday.');
    } finally {
      setIsSaving(false);
    }
  };

  // Action 2: MARK TUITION CLOSED
  const handleMarkTuitionClosed = async () => {
    if (isSubmitted) {
      if (attendanceType === 'CLOSED') {
        setErrorMsg(`Tuition is already marked CLOSED for ${attendanceDate}.`);
      } else {
        setErrorMsg(`Attendance for ${selectedClass} (${selectedSubject}) on ${attendanceDate} has already been submitted.`);
      }
      return;
    }

    const confirmClosed = window.confirm(`Are you sure you want to mark Tuition CLOSED for ${attendanceDate}? No attendance will be taken for any class on this date.`);
    if (!confirmClosed) return;

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const recordsPayload = students.map((std) => {
        const sId = std.id || std._id;
        return {
          student: sId,
          studentId: sId,
          studentCode: std.studentId || std.student_id || `STU${sId}`,
          studentName: std.name || std.full_name || 'Student',
          rollNo: std.rollNo || std.roll_no || '',
          status: 'Closed',
          attendanceType: 'CLOSED',
          startTime: 'N/A',
          endTime: 'N/A'
        };
      });

      const payload = {
        standard: selectedClass,
        subject: selectedSubject || 'All',
        date: attendanceDate,
        attendanceDate: attendanceDate,
        startTime: 'N/A',
        endTime: 'N/A',
        attendanceType: 'CLOSED',
        records: recordsPayload,
        attendance: recordsPayload,
        isStaff: true,
        userRole: 'staff'
      };

      const res = await createAttendanceAPI(payload);
      if (res && res.success) {
        setAttendanceType('CLOSED');
        setIsSubmitted(true);
        setSuccessMsg(`🚫 Tuition successfully marked CLOSED for ${attendanceDate}.`);
        await fetchAttendanceProgress();
        fetchAttendanceHistory();
      } else {
        throw new Error(res?.message || 'Failed to mark tuition closed.');
      }
    } catch (err) {
      console.error('Mark Tuition Closed Error:', err);
      setErrorMsg(err.message || 'Unable to mark tuition closed.');
    } finally {
      setIsSaving(false);
    }
  };

  // Save Attendance to Backend
  const handleSaveAttendance = async () => {
    if (students.length === 0) {
      setErrorMsg('No students available to save attendance.');
      return;
    }
    if (attendanceType === 'ATTENDANCE') {
      if (!startTime.trim() || !endTime.trim()) {
        setErrorMsg('Start Time and End Time are required.');
        return;
      }
    }
    if (isSubmitted) {
      setErrorMsg('Attendance for this class, subject and date has already been submitted.');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const recordsPayload = students.map((std) => {
        const sId = std.id || std._id;
        const sKey = getStudentKey(std);
        return {
          student: sId,
          studentId: sId,
          studentCode: std.studentId || std.student_id || `STU${sId}`,
          studentName: std.name || std.full_name || 'Student',
          rollNo: std.rollNo || std.roll_no || '',
          status: attendanceType === 'HOLIDAY' ? 'Holiday' : attendanceType === 'CLOSED' ? 'Closed' : ((attendanceStatusMap[sKey] || 'PRESENT') === 'ABSENT' ? 'Absent' : 'Present'),
          attendanceType: attendanceType,
          startTime: attendanceType === 'ATTENDANCE' ? startTime.trim() : 'N/A',
          endTime: attendanceType === 'ATTENDANCE' ? endTime.trim() : 'N/A'
        };
      });

      const payload = {
        standard: selectedClass,
        subject: selectedSubject,
        date: attendanceDate,
        startTime: attendanceType === 'ATTENDANCE' ? startTime.trim() : 'N/A',
        endTime: attendanceType === 'ATTENDANCE' ? endTime.trim() : 'N/A',
        attendanceType: attendanceType,
        records: recordsPayload,
        attendance: recordsPayload,
        isStaff: true,
        userRole: 'staff'
      };

      const res = await createAttendanceAPI(payload);
      if (res && res.success) {
        setLastSavedRecord(res.attendance);
        setIsSubmitted(true);
        setSuccessMsg(`Attendance saved to MongoDB for Class ${selectedClass} (${selectedSubject}) cleanly!`);
        await fetchAttendanceProgress(); // Refresh progress bar from MongoDB
        fetchAttendanceHistory(); // Refresh monthly register grid
      } else {
        throw new Error(res?.message || 'Failed to save attendance.');
      }
    } catch (err) {
      console.error('Save Attendance Error:', err);
      if (err.status === 409 || err.code === 'ATTENDANCE_ALREADY_SUBMITTED' || (err.message && err.message.includes('already been submitted'))) {
        setIsSubmitted(true);
        setErrorMsg('Attendance for this class, subject and date has already been submitted.');
      } else {
        setErrorMsg(err.message || 'Unable to save attendance to MongoDB.');
      }
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger Manual WhatsApp Notifications for Absent Students (Consolidated student-wise, supports retryStudentIds)
  const handleSendWhatsAppToAbsent = async (retryStudentIds = null) => {
    if (progressState.completedCount === 0) {
      setErrorMsg('No subject attendance has been submitted yet for this date.');
      return;
    }

    setIsSendingWhatsApp(true);
    setWaModalOpen(true);
    setErrorMsg('');

    try {
      const payload = {
        standard: selectedClass,
        date: attendanceDate
      };
      if (Array.isArray(retryStudentIds) && retryStudentIds.length > 0) {
        payload.studentIds = retryStudentIds;
      }

      const res = await sendManualWhatsAppNotificationsAPI(payload);
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (res && res.whatsappNotifications) {
        setWaResult({
          ...res.whatsappNotifications,
          success: res.success !== false,
          lastSentTime: currentTime,
          message: res.message
        });
      } else {
        setWaResult({
          success: false,
          sent: 0,
          failed: absentCount,
          totalAbsent: absentCount,
          results: [],
          lastSentTime: currentTime,
          message: res?.message || 'Failed to process WhatsApp notifications.'
        });
      }
    } catch (err) {
      console.error('Send WhatsApp Error:', err);
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const code = err.code || err.data?.code;
      const msg = err.message || 'Unable to send WhatsApp messages.';
      setWaResult({
        success: false,
        sent: 0,
        failed: absentCount,
        totalAbsent: absentCount,
        results: [],
        lastSentTime: currentTime,
        code,
        message: msg
      });
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const absentCount = Object.values(attendanceStatusMap).filter((st) => st === 'ABSENT').length;
  const presentCount = Object.values(attendanceStatusMap).filter((st) => st === 'PRESENT').length;

  const formattedDateStr = new Date(attendanceDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <StaffLayout>
      <div className="teacher-page-container">
        {/* Header Banner */}
        <div className="teacher-welcome-banner">
          <div className="teacher-welcome-text">
            <h2>Staff Class Attendance 📋</h2>
            <p>Select any class & subject to mark student attendance, record present/absent status in MongoDB, and dispatch WhatsApp alerts.</p>
          </div>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <button
            type="button"
            onClick={() => setActiveTab('mark')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: activeTab === 'mark' ? '2px solid #1E3A8A' : '1px solid #C4C4C4',
              background: activeTab === 'mark' ? '#1E3A8A' : '#FFFFFF',
              color: activeTab === 'mark' ? '#FFFFFF' : '#333333'
            }}
          >
            Mark Daily Attendance
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('history')}
            style={{
              padding: '0.6rem 1.25rem',
              borderRadius: '6px',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              border: activeTab === 'history' ? '2px solid #1E3A8A' : '1px solid #C4C4C4',
              background: activeTab === 'history' ? '#1E3A8A' : '#FFFFFF',
              color: activeTab === 'history' ? '#FFFFFF' : '#333333'
            }}
          >
            Monthly Attendance Register & History
          </button>
        </div>

        {/* Attendance Already Submitted Read-Only Banner */}
        {isSubmitted && activeTab === 'mark' && (
          <div style={{ background: attendanceType === 'HOLIDAY' ? '#EFF6FF' : attendanceType === 'CLOSED' ? '#F3F4F6' : '#FFFBEB', border: attendanceType === 'HOLIDAY' ? '1px solid #3B82F6' : attendanceType === 'CLOSED' ? '1px solid #9CA3AF' : '1px solid #F59E0B', color: attendanceType === 'HOLIDAY' ? '#1E40AF' : attendanceType === 'CLOSED' ? '#1F2937' : '#92400E', padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <CheckCircle2 size={20} color={attendanceType === 'HOLIDAY' ? '#2563EB' : attendanceType === 'CLOSED' ? '#4B5563' : '#D97706'} />
            <span>
              {attendanceType === 'HOLIDAY'
                ? `Subject Holiday Marked: Holiday is active for ${selectedClass} - ${selectedSubject} on ${formattedDateStr}.`
                : attendanceType === 'CLOSED'
                ? `Tuition Closed: Complete tuition is marked CLOSED on ${formattedDateStr}.`
                : `Attendance Already Submitted: Attendance for ${selectedClass} - ${selectedSubject} on ${formattedDateStr} has already been submitted.`}
            </span>
          </div>
        )}

        {/* Global Error Alert */}
        {errorMsg && (
          <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Global Success Alert */}
        {successMsg && (
          <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '0.85rem 1.25rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 600, fontSize: '0.9rem' }}>
            <CheckCircle2 size={20} />
            <span>{successMsg}</span>
          </div>
        )}

        {activeTab === 'history' ? (
          <div>
            {/* History Filter Card */}
            <div className="teacher-card-panel" style={{ marginBottom: '1.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
                <div className="teacher-form-group">
                  <label>Class / Standard</label>
                  <select
                    className="teacher-form-select"
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                  >
                    {SUPPORTED_CLASSES.map((std) => (
                      <option key={std} value={std}>
                        {std} Standard
                      </option>
                    ))}
                  </select>
                </div>

                <div className="teacher-form-group">
                  <label>Subject</label>
                  <select
                    className="teacher-form-select"
                    value={selectedSubject}
                    onChange={(e) => setSelectedSubject(e.target.value)}
                  >
                    {subjectsList.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="teacher-form-group">
                  <label>Month</label>
                  <select
                    className="teacher-form-select"
                    value={historyMonth}
                    onChange={(e) => setHistoryMonth(e.target.value)}
                  >
                    {[
                      { val: '1', name: 'January' },
                      { val: '2', name: 'February' },
                      { val: '3', name: 'March' },
                      { val: '4', name: 'April' },
                      { val: '5', name: 'May' },
                      { val: '6', name: 'June' },
                      { val: '7', name: 'July' },
                      { val: '8', name: 'August' },
                      { val: '9', name: 'September' },
                      { val: '10', name: 'October' },
                      { val: '11', name: 'November' },
                      { val: '12', name: 'December' }
                    ].map((m) => (
                      <option key={m.val} value={m.val}>
                        {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="teacher-form-group">
                  <label>Year</label>
                  <select
                    className="teacher-form-select"
                    value={historyYear}
                    onChange={(e) => setHistoryYear(e.target.value)}
                  >
                    <option value="2026">2026</option>
                    <option value="2025">2025</option>
                  </select>
                </div>
              </div>
            </div>

            <MonthlyAttendanceGrid
              monthlyGrid={monthlyGrid}
              loading={loadingHistory}
              selectedStandard={selectedClass}
              selectedSubject={selectedSubject}
              selectedMonth={historyMonth}
              selectedYear={historyYear}
            />
          </div>
        ) : (
          <>
            {/* Selection Bar Panel */}
            <div className="teacher-card-panel" style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem', alignItems: 'end' }}>
            <div className="teacher-form-group">
              <label>Select Standard / Class *</label>
              <select
                className="teacher-form-select"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                {SUPPORTED_CLASSES.map((std) => (
                  <option key={std} value={std}>
                    {std} Standard
                  </option>
                ))}
              </select>
            </div>

            <div className="teacher-form-group">
              <label>Select Subject *</label>
              <select
                className="teacher-form-select"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                {subjectsList.map((subj) => (
                  <option key={subj} value={subj}>
                    {subj}
                  </option>
                ))}
              </select>
            </div>

            <div className="teacher-form-group">
              <label>Attendance Date *</label>
              <input
                type="date"
                className="teacher-form-input"
                value={attendanceDate}
                onChange={(e) => setAttendanceDate(e.target.value)}
              />
            </div>

            <div className="teacher-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} color="#1E3A8A" /> Start Time *
              </label>
              <input
                type="time"
                className="teacher-form-input"
                value={formatTo24h(startTime)}
                onChange={(e) => setStartTime(formatTo12h(e.target.value))}
                disabled={isSubmitted}
                style={{ cursor: isSubmitted ? 'not-allowed' : 'pointer' }}
              />
            </div>

            <div className="teacher-form-group">
              <label style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Clock size={14} color="#1E3A8A" /> End Time *
              </label>
              <input
                type="time"
                className="teacher-form-input"
                value={formatTo24h(endTime)}
                onChange={(e) => setEndTime(formatTo12h(e.target.value))}
                disabled={isSubmitted}
                style={{ cursor: isSubmitted ? 'not-allowed' : 'pointer' }}
              />
            </div>

            {/* Session Mode Selector */}
            <div style={{ gridColumn: '1 / -1', marginTop: '0.5rem', display: 'flex', gap: '0.5rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#444444', marginRight: '0.5rem' }}>SESSION MODE:</span>
              <button
                type="button"
                disabled={isSubmitted || isSaving}
                onClick={() => setAttendanceType('ATTENDANCE')}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: (isSubmitted || isSaving) ? 'not-allowed' : 'pointer',
                  border: attendanceType === 'ATTENDANCE' ? '2px solid #1E3A8A' : '1px solid #D1D5DB',
                  background: attendanceType === 'ATTENDANCE' ? '#EFF6FF' : '#FFFFFF',
                  color: attendanceType === 'ATTENDANCE' ? '#1E3A8A' : '#374151'
                }}
              >
                ✓ Class Attendance
              </button>
              <button
                type="button"
                disabled={isSubmitted || isSaving}
                onClick={handleMarkSubjectHoliday}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: (isSubmitted || isSaving) ? 'not-allowed' : 'pointer',
                  border: attendanceType === 'HOLIDAY' ? '2px solid #3B82F6' : '1px solid #D1D5DB',
                  background: attendanceType === 'HOLIDAY' ? '#EFF6FF' : '#FFFFFF',
                  color: attendanceType === 'HOLIDAY' ? '#1E40AF' : '#374151'
                }}
              >
                🏝 Mark Subject Holiday
              </button>
              <button
                type="button"
                disabled={isSubmitted || isSaving}
                onClick={handleMarkTuitionClosed}
                style={{
                  padding: '0.45rem 0.9rem',
                  borderRadius: '6px',
                  fontWeight: 700,
                  fontSize: '0.84rem',
                  cursor: (isSubmitted || isSaving) ? 'not-allowed' : 'pointer',
                  border: attendanceType === 'CLOSED' ? '2px solid #6B7280' : '1px solid #D1D5DB',
                  background: attendanceType === 'CLOSED' ? '#F3F4F6' : '#FFFFFF',
                  color: attendanceType === 'CLOSED' ? '#1F2937' : '#374151'
                }}
              >
                🚫 Mark Tuition Closed
              </button>
            </div>
          </div>
        </div>

        {/* Compact Subject-Wise Attendance Progress Card */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #D4AF37',
            borderRadius: '10px',
            padding: '1rem 1.25rem',
            marginBottom: '1.5rem',
            boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
            <strong style={{ fontSize: '0.92rem', color: '#171717', letterSpacing: '0.3px' }}>
              Today's Attendance Progress ({selectedClass} - {formattedDateStr})
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

              <div style={{ fontSize: '0.82rem', color: progressState.completedCount > 0 ? '#059669' : '#D97706', fontWeight: 600 }}>
                {progressState.allCompleted ? (
                  '✓ All Subject Attendance Completed'
                ) : progressState.completedCount > 0 ? (
                  `✓ ${progressState.completedCount} subject(s) submitted. You can send WhatsApp alerts for submitted subjects at any time.`
                ) : (
                  `No subject attendance saved yet for this date.`
                )}
              </div>
            </>
          )}
        </div>

        {/* Student Roster Table Panel */}
        <div className="teacher-card-panel">
          <div className="teacher-panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="teacher-panel-title-group">
              <UserCheck size={22} color="#D4AF37" />
              <div>
                <h3 className="teacher-panel-title">Class Roster - {selectedClass} ({selectedSubject})</h3>
                <p className="teacher-panel-subtitle">Total {students.length} students | <strong style={{ color: '#059669' }}>{presentCount} Present</strong> | <strong style={{ color: '#DC2626' }}>{absentCount} Absent</strong></p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                className="teacher-btn teacher-btn-outline teacher-btn-sm"
                onClick={() => handleMarkAll('PRESENT')}
                disabled={loading || isSubmitted || students.length === 0}
              >
                Mark All Present
              </button>
              <button
                className="teacher-btn teacher-btn-outline teacher-btn-sm"
                onClick={() => handleMarkAll('ABSENT')}
                disabled={loading || isSubmitted || students.length === 0}
                style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
              >
                Mark All Absent
              </button>
            </div>
          </div>

          <div className="teacher-table-responsive">
            {loading ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666666' }}>
                <Loader2 size={32} color="#D4AF37" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>Loading class roster from MongoDB...</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : students.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666666' }}>
                <UserCheck size={40} color="#CCCCCC" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#171717' }}>No Active Students Found</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>No active students are registered for Class {selectedClass} in MongoDB.</p>
              </div>
            ) : (
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Roll No</th>
                    <th>Student ID</th>
                    <th>Student Name</th>
                    <th>Parent Mobile</th>
                    <th>Attendance Status</th>
                  </tr>
                </thead>
                <tbody>
                  {students.map((std) => {
                    const sKey = getStudentKey(std);
                    const isAbsent = (attendanceStatusMap[sKey] || 'PRESENT') === 'ABSENT';
                    return (
                      <tr key={sKey} style={{ background: isAbsent ? '#FEF2F2' : 'transparent' }}>
                        <td style={{ fontWeight: 800 }}>{std.rollNo || std.roll_no || '-'}</td>
                        <td style={{ fontSize: '0.85rem', color: '#666666' }}>{std.studentId || std.student_id || '-'}</td>
                        <td style={{ fontWeight: 700, color: '#171717' }}>{std.name || std.full_name}</td>
                        <td>{std.parentMobile || std.whatsapp_number || std.mobile || '-'}</td>
                        <td>
                          {attendanceType === 'HOLIDAY' ? (
                            <span style={{ background: '#EFF6FF', color: '#1E40AF', border: '1px solid #BFDBFE', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                              H Subject Holiday
                            </span>
                          ) : attendanceType === 'CLOSED' ? (
                            <span style={{ background: '#F3F4F6', color: '#374151', border: '1px solid #D1D5DB', padding: '0.35rem 0.85rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 700 }}>
                              − Tuition Closed
                            </span>
                          ) : (
                            <button
                              type="button"
                              disabled={isSubmitted}
                              onClick={() => handleToggleStatus(sKey)}
                              style={{
                                padding: '0.35rem 0.85rem',
                                borderRadius: '6px',
                                fontSize: '0.82rem',
                                fontWeight: 800,
                                cursor: isSubmitted ? 'not-allowed' : 'pointer',
                                border: 'none',
                                background: isAbsent ? '#EF4444' : '#10B981',
                                color: '#FFFFFF',
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '0.35rem',
                                opacity: isSubmitted ? 0.85 : 1
                              }}
                            >
                              {isAbsent ? 'ABSENT' : 'PRESENT'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>

          {/* Action buttons footer */}
          <div className="teacher-modal-actions" style={{ marginTop: '1.25rem', flexWrap: 'wrap', gap: '0.75rem', flexDirection: 'column', alignItems: 'flex-start' }}>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', width: '100%', alignItems: 'center' }}>
              <button
                type="button"
                className="teacher-btn"
                onClick={() => handleSendWhatsAppToAbsent(null)}
                disabled={progressState.completedCount === 0 || isSendingWhatsApp || isSaving || loading}
                style={{
                  background: progressState.completedCount === 0
                    ? '#9CA3AF'
                    : isSendingWhatsApp
                    ? '#64748B'
                    : (waResult?.sent > 0 && waResult?.failed === 0)
                    ? '#059669'
                    : 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                  color: '#FFFFFF',
                  border: 'none',
                  padding: '0.7rem 1.25rem',
                  fontWeight: 700,
                  cursor: (progressState.completedCount > 0 && !isSendingWhatsApp) ? 'pointer' : 'not-allowed',
                  opacity: progressState.completedCount > 0 ? 1 : 0.75
                }}
              >
                {isSendingWhatsApp ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>⏳ Sending WhatsApp...</span>
                  </>
                ) : (waResult?.sent > 0 && waResult?.failed === 0) ? (
                  <>
                    <Check size={16} />
                    <span>✓ WhatsApp Sent ({waResult.sent})</span>
                  </>
                ) : (
                  <>
                    <Send size={16} />
                    <span>Send WhatsApp to Absent Students</span>
                  </>
                )}
              </button>

              {isSubmitted ? (
                <button
                  type="button"
                  disabled
                  className="teacher-btn-submit"
                  style={{ background: '#6B7280', color: '#FFFFFF', cursor: 'not-allowed', opacity: 0.85 }}
                >
                  <Check size={16} /> Attendance Submitted
                </button>
              ) : (
                <button
                  type="button"
                  className="teacher-btn-submit"
                  onClick={handleSaveAttendance}
                  disabled={isSaving || loading || students.length === 0}
                >
                  {isSaving ? (
                    <>
                      <Loader2 size={16} className="animate-spin" /> Saving...
                    </>
                  ) : (
                    <>
                      <Save size={16} /> Save Attendance
                    </>
                  )}
                </button>
              )}
            </div>

            {!progressState.allCompleted && (
              <span style={{ fontSize: '0.82rem', color: '#D97706', fontWeight: 600 }}>
                ⚠️ Complete attendance for all subjects (3/3) before sending WhatsApp notifications.
              </span>
            )}

            {/* WhatsApp Execution Result Modal Overlay */}
            <WhatsAppResultModal
              isOpen={waModalOpen}
              onClose={() => setWaModalOpen(false)}
              result={waResult}
              isSending={isSendingWhatsApp}
              onRetryFailed={(failedIds) => handleSendWhatsAppToAbsent(failedIds)}
              onRetryAll={() => handleSendWhatsAppToAbsent(null)}
            />
          </div>
        </div>
        </>
        )}
      </div>
    </StaffLayout>
  );
};

export default StaffAttendance;
