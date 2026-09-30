import React, { useState, useEffect, useContext } from 'react';
import { useSearchParams } from 'react-router-dom';
import TeacherLayout from '../../layouts/TeacherLayout';
import TeacherModal from '../../components/teacher/TeacherModal';
import { AuthContext } from '../../context/AuthContext';
import {
  getTeacherAllocationsAPI,
  getAttendanceStudentsAPI,
  getAttendanceByClassAndDateAPI,
  getAttendanceByDateAPI,
  getAttendanceHistoryAPI,
  markAttendanceAPI,
  sendManualWhatsAppAPI,
  getBatchesAPI
} from '../../services/api';
import MonthlyAttendanceGrid from '../../components/common/MonthlyAttendanceGrid';
import WhatsAppResultModal from '../../components/common/WhatsAppResultModal';
import {
  UserCheck,
  Calendar,
  CheckCircle2,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Sparkles,
  Filter,
  Users,
  Search,
  BookOpen,
  ChevronRight,
  AlertCircle,
  FileSpreadsheet,
  Check,
  X,
  History,
  Info,
  BarChart3,
  Sun,
  Lock,
  CheckCheck,
  RotateCw,
  Smartphone,
  Save
} from 'lucide-react';
import '../../styles/teacher/teacher-pages.css';

// Helper to format date as DD/MM/YYYY
const formatDisplayDate = (dateStr) => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return dateStr;
};

// Helper to format 24h time to 12h AM/PM
const formatTime12hClient = (timeStr) => {
  if (!timeStr) return '';
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = hours < 10 ? '0' + hours : hours;
  return `${strHours}:${minutes} ${ampm}`;
};

const TeacherAttendance = () => {
  const { teacherProfile, user } = useContext(AuthContext) || {};
  const teacherId = teacherProfile?.id || teacherProfile?._id || user?.teacher_id;
  const [searchParams] = useSearchParams();
  const urlClass = searchParams.get('class');
  const urlSubject = searchParams.get('subject');

  // Active View Tab: 'mark' | 'history'
  // Selected Filter States
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);

  // Master Lists
  const [teacherAllocations, setTeacherAllocations] = useState([]);
  const [allocatedClasses, setAllocatedClasses] = useState([]);
  const [allocatedSubjects, setAllocatedSubjects] = useState([]);
  const [activeTab, setActiveTab] = useState('mark'); // 'mark' | 'history'
  const [searchTerm, setSearchTerm] = useState('');

  // Roster & Attendance States
  const [students, setStudents] = useState([]);
  const [attendanceState, setAttendanceState] = useState({});
  const [attendanceType, setAttendanceType] = useState('ATTENDANCE'); // 'ATTENDANCE' | 'HOLIDAY' | 'CLOSED'
  const [notifiedMap, setNotifiedMap] = useState({});
  const [isAlreadySubmitted, setIsAlreadySubmitted] = useState(false);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [classTime, setClassTime] = useState('');
  const [hasValidSchedule, setHasValidSchedule] = useState(true);
  const [scheduleMessage, setScheduleMessage] = useState('');

  // History / Monthly Stats States
  const [historyMonth, setHistoryMonth] = useState(String(new Date().getMonth() + 1));
  const [historyYear, setHistoryYear] = useState(String(new Date().getFullYear()));
  const [historyRecords, setHistoryRecords] = useState([]);
  const [monthlyGrid, setMonthlyGrid] = useState(null);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // Status & UI States
  const [loadingAllocations, setLoadingAllocations] = useState(true);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Modal & WhatsApp Action States
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [savedSummary, setSavedSummary] = useState(null);
  const [isSendingWa, setIsSendingWa] = useState(false);
  const [waResult, setWaResult] = useState(null);
  const [waModalOpen, setWaModalOpen] = useState(false);

  // Compute available subjects strictly for selected class
  const currentAllocation = teacherAllocations.find(a => a.standard === selectedClass);
  const availableAttendanceSubjects = currentAllocation && Array.isArray(currentAllocation.subjects)
    ? currentAllocation.subjects
    : (allocatedSubjects.length > 0 ? allocatedSubjects : []);

  useEffect(() => {
    if (availableAttendanceSubjects.length > 0) {
      if (!availableAttendanceSubjects.includes(selectedSubject)) {
        setSelectedSubject(availableAttendanceSubjects[0]);
      }
    } else {
      setSelectedSubject('');
    }
  }, [selectedClass, teacherAllocations]);

  // 1. Fetch Teacher Allocation (Classes & Subjects)
  const fetchAllocations = async () => {
    setLoadingAllocations(true);
    setErrorMsg('');
    try {
      const allocRes = await getTeacherAllocationsAPI(teacherId);
      if (allocRes && allocRes.success && Array.isArray(allocRes.allocations) && allocRes.allocations.length > 0) {
        const allocs = allocRes.allocations;
        setTeacherAllocations(allocs);
        const clsList = allocs.map(a => a.standard);
        setAllocatedClasses(clsList);

        let targetClass = clsList[0];
        let targetSubjs = allocs.find(a => a.standard === targetClass)?.subjects || [];
        let targetSubject = targetSubjs.length > 0 ? targetSubjs[0] : '';

        if (urlClass) {
          const matchedCls = clsList.find(
            c => c.toLowerCase() === urlClass.toLowerCase() ||
                 c.toLowerCase().replace(/\D/g, '') === urlClass.toLowerCase().replace(/\D/g, '')
          );
          if (matchedCls) {
            targetClass = matchedCls;
            const matchedSubjs = allocs.find(a => a.standard === matchedCls)?.subjects || [];
            if (matchedSubjs.length > 0) targetSubject = matchedSubjs[0];
          }
        }

        if (urlSubject) {
          const matchedSubj = targetSubjs.find(
            s => s.toLowerCase() === urlSubject.toLowerCase() ||
                 ((urlSubject.toLowerCase() === 'math' || urlSubject.toLowerCase() === 'mathematics') && s.toLowerCase().startsWith('math'))
          );
          if (matchedSubj) targetSubject = matchedSubj;
        }

        setSelectedClass(targetClass);
        setSelectedSubject(targetSubject);
      } else {
        const res = await getTeacherAllocationsAPI(teacherId);
        if (res && res.success) {
          const clsList = res.classes || [];
          const subjList = res.subjects || [];
          setAllocatedClasses(clsList);
          setAllocatedSubjects(subjList);

          let targetClass = clsList.length > 0 ? clsList[0] : '';
          let targetSubject = subjList.length > 0 ? subjList[0] : '';

          setSelectedClass(targetClass);
          setSelectedSubject(targetSubject);
        }
      }
    } catch (err) {
      console.error('Fetch Allocations Error:', err);
      setErrorMsg(err.message || 'Unable to load teacher class allocation.');
    } finally {
      setLoadingAllocations(false);
    }
  };



  // 2. Fetch Real MongoDB Students and Existing Attendance Records
  const fetchClassStudentsAndAttendance = async () => {
    if (!selectedClass) return;
    setLoadingStudents(true);
    setErrorMsg('');

    setIsAlreadySubmitted(false);
    setAttendanceState({});
    setNotifiedMap({});

    try {
      const studentsRes = await getAttendanceStudentsAPI({
        teacherId,
        standard: selectedClass,
        subject: selectedSubject
      });

      const fetchedStudents = studentsRes.students || [];
      // Sort by Roll Number ascending
      fetchedStudents.sort((a, b) => {
        const rA = parseInt(a.rollNo, 10) || 9999;
        const rB = parseInt(b.rollNo, 10) || 9999;
        return rA - rB;
      });

      setStudents(fetchedStudents);

      const attendanceRes = await getAttendanceByClassAndDateAPI({
        standard: selectedClass,
        subject: selectedSubject,
        date: selectedDate
      });

      const existingRecords = attendanceRes.records || attendanceRes.attendance || [];
      const hasExisting = attendanceRes.isSubmitted || existingRecords.length > 0;
      setIsAlreadySubmitted(hasExisting);

      const newAttendanceMap = {};
      const newNotifiedMap = {};
      let isHoliday = false;
      let isClosed = false;

      if (hasExisting) {
        existingRecords.forEach((rec) => {
          const sId = rec.studentId || rec.student_id || (typeof rec.student === 'object' ? (rec.student?._id || rec.student?.id) : rec.student);
          if (sId) {
            const keyStr = String(sId);
            newAttendanceMap[keyStr] = rec.status;
            newNotifiedMap[keyStr] = rec.notificationSent || false;
            if (rec.status === 'Holiday') isHoliday = true;
            if (rec.status === 'Closed') isClosed = true;
          }
        });
        if (isHoliday) setAttendanceType('HOLIDAY');
        else if (isClosed) setAttendanceType('CLOSED');
        else setAttendanceType('ATTENDANCE');

        fetchedStudents.forEach((std) => {
          const stdIdKey = String(std.id || std._id);
          if (!newAttendanceMap[stdIdKey]) {
            newAttendanceMap[stdIdKey] = 'Present';
          }
        });
      } else {
        setAttendanceType('ATTENDANCE');
        fetchedStudents.forEach((std) => {
          const stdIdKey = String(std.id || std._id);
          newAttendanceMap[stdIdKey] = 'Present';
        });
      }

      setAttendanceState(newAttendanceMap);
      setNotifiedMap(newNotifiedMap);

      if (hasExisting && attendanceRes.session) {
        setStartTime(attendanceRes.session.startTime || attendanceRes.session.start_time || '');
        setEndTime(attendanceRes.session.endTime || attendanceRes.session.end_time || '');
        setClassTime(attendanceRes.session.classTime || attendanceRes.session.class_time || '');
      } else {
        setStartTime('');
        setEndTime('');
        setClassTime('');
      }
      setHasValidSchedule(true);
      setScheduleMessage('');
    } catch (err) {
      console.error('Fetch Students/Attendance Error:', err);
      setErrorMsg('Unable to load attendance data from MongoDB.');
    } finally {
      setLoadingStudents(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'mark') {
      setIsAlreadySubmitted(false);
      setAttendanceState({});
      setNotifiedMap({});
      setSavedSummary(null);
      setErrorMsg('');
      fetchClassStudentsAndAttendance();
    }
  }, [selectedClass, selectedSubject, selectedDate, activeTab]);

  // Clear waResult & stale attendance state when Class, Subject, or Date changes
  useEffect(() => {
    setWaResult(null);
    setWaModalOpen(false);
    setAttendanceState({});
    setIsAlreadySubmitted(false);
    setStudents([]);
    setNotifiedMap({});
  }, [selectedClass, selectedSubject, selectedDate]);

  // Window Focus Revalidation (Refetches fresh MongoDB attendance when Teacher returns to browser tab)
  useEffect(() => {
    const handleFocus = () => {
      if (activeTab === 'mark') {
        fetchClassStudentsAndAttendance();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [activeTab, selectedClass, selectedSubject, selectedDate]);

  // 3. Fetch History / Monthly Attendance Records
  const fetchAttendanceHistory = async () => {
    if (!selectedClass) return;
    setLoadingHistory(true);
    try {
      const res = await getAttendanceHistoryAPI({
        standard: selectedClass,
        subject: selectedSubject,
        teacher: teacherId,
        month: historyMonth,
        year: historyYear
      });
      setHistoryRecords(res.attendance || []);
      setMonthlyGrid(res.monthlyGrid || null);
    } catch (err) {
      console.error('Fetch History Error:', err);
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, [teacherId]);

  useEffect(() => {
    if (activeTab === 'history') {
      fetchAttendanceHistory();
    }
  }, [selectedClass, selectedSubject, historyMonth, historyYear, activeTab]);

  // Set individual student status ('Present' | 'Absent' | 'Late' | 'Excused')
  const setStudentStatus = (studentId, newStatus) => {
    if (isAlreadySubmitted) return;
    const stdKey = String(studentId);
    setAttendanceState((prev) => ({
      ...prev,
      [stdKey]: newStatus
    }));
  };

  // Toggle individual student status ('Present' <-> 'Absent')
  const toggleStudentStatus = (studentId) => {
    if (isAlreadySubmitted) return;
    const stdKey = String(studentId);
    setAttendanceState((prev) => {
      const current = prev[stdKey] || 'Present';
      return {
        ...prev,
        [stdKey]: current === 'Present' ? 'Absent' : 'Present'
      };
    });
  };

  // Mark ALL students in current view as Present (FRONTEND ONLY!)
  const markAllPresent = () => {
    if (isAlreadySubmitted || students.length === 0) return;
    const updated = { ...attendanceState };
    filteredStudents.forEach((std) => {
      const stdKey = String(std.id || std._id || std.studentId);
      updated[stdKey] = 'Present';
    });
    setAttendanceState(updated);
  };

  // Filter students based on search input
  const filteredStudents = students.filter((std) => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const nameMatch = std.name && std.name.toLowerCase().includes(term);
    const rollMatch = std.rollNo && String(std.rollNo).toLowerCase().includes(term);
    const idMatch = std.studentId && std.studentId.toLowerCase().includes(term);
    return nameMatch || rollMatch || idMatch;
  });

  const presentCount = filteredStudents.filter(
    (std) => (attendanceState[String(std.id || std._id || std.studentId)] || 'Present') === 'Present'
  ).length;

  const absentCount = filteredStudents.filter(
    (std) => attendanceState[String(std.id || std._id || std.studentId)] === 'Absent'
  ).length;

  // 4. Save Attendance Action (Persists to MySQL)
  const handleSaveAttendance = async () => {
    if (!selectedClass) {
      setErrorMsg('Class is required.');
      return;
    }
    if (!selectedSubject) {
      setErrorMsg('Subject is required.');
      return;
    }
    if (!selectedDate) {
      setErrorMsg('Attendance Date is required.');
      return;
    }

    if (attendanceType === 'ATTENDANCE') {
      if (students.length === 0 || isAlreadySubmitted) return;
      if (!startTime || !endTime) {
        setErrorMsg('Start Time and End Time are required.');
        return;
      }

      const getMinutes = (timeStr) => {
        if (!timeStr) return 0;
        const clean = timeStr.trim();
        if (!clean.includes('AM') && !clean.includes('PM')) {
          const parts = clean.split(':');
          return (parseInt(parts[0], 10) || 0) * 60 + (parseInt(parts[1], 10) || 0);
        }
        const isPM = clean.toUpperCase().includes('PM');
        const c = clean.toUpperCase().replace('AM', '').replace('PM', '').trim();
        const parts = c.split(':');
        let h = parseInt(parts[0], 10) || 0;
        const m = parseInt(parts[1], 10) || 0;
        if (isPM && h < 12) h += 12;
        if (!isPM && h === 12) h = 0;
        return h * 60 + m;
      };

      if (getMinutes(endTime) <= getMinutes(startTime)) {
        setErrorMsg('End Time must be later than Start Time.');
        return;
      }
    }

    setIsSaving(true);
    setErrorMsg('');

    try {
      const attendancePayload = {
        teacherId,
        standard: selectedClass,
        subject: selectedSubject,
        date: selectedDate,
        attendanceDate: selectedDate,
        startTime: attendanceType === 'ATTENDANCE' ? startTime : 'N/A',
        endTime: attendanceType === 'ATTENDANCE' ? endTime : 'N/A',
        attendanceType: attendanceType,
        createdByRole: 'Teacher',
        role: 'Teacher',
        records: attendanceType === 'ATTENDANCE' ? students.map((std) => {
          const sIdKey = String(std.id || std._id);
          return {
            studentId: std.id || std._id,
            studentCode: std.student_code || std.studentCode || std.studentId,
            studentName: std.student_name || std.name || std.full_name,
            rollNo: std.roll_no || std.rollNo || '',
            status: attendanceState[sIdKey] || 'Present'
          };
        }) : (attendanceType === 'HOLIDAY' ? students.map((std) => ({
          studentId: std.id || std._id,
          studentCode: std.student_code || std.studentCode || std.studentId,
          studentName: std.student_name || std.name || std.full_name,
          rollNo: std.roll_no || std.rollNo || '',
          status: 'Holiday'
        })) : [])
      };

      const res = await markAttendanceAPI(attendancePayload);

      if (res && res.success) {
        const summary = res.summary || {
          total: students.length,
          present: attendanceType === 'ATTENDANCE' ? presentCount : 0,
          absent: attendanceType === 'ATTENDANCE' ? absentCount : 0
        };

        setSavedSummary({
          className: selectedClass,
          subject: selectedSubject,
          date: selectedDate,
          ...summary
        });
        setSaveModalOpen(true);
        setIsAlreadySubmitted(true); // Lock roster immediately
        setWaResult(null); // Reset WhatsApp result for fresh submission
      } else {
        throw new Error(res?.message || 'Failed to save attendance.');
      }
    } catch (err) {
      console.error('Save Attendance Error:', err);
      setErrorMsg(err.message || 'Unable to save attendance.');
    } finally {
      setIsSaving(false);
    }
  };

  // Handle Manual WhatsApp Notification Trigger (Supports retryStudentIds for failed recipients)
  const handleSendManualWhatsApp = async (retryStudentIds = null) => {
    if (isSendingWa) return;
    setIsSendingWa(true);
    setWaModalOpen(true);
    setErrorMsg('');

    try {
      const payload = {
        standard: selectedClass,
        date: selectedDate,
        subject: selectedSubject,
        isTeacher: true,
        userRole: 'teacher'
      };
      if (Array.isArray(retryStudentIds) && retryStudentIds.length > 0) {
        payload.studentIds = retryStudentIds;
      }

      const res = await sendManualWhatsAppAPI(payload);
      const currentTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

      if (res && res.whatsappNotifications) {
        setWaResult({
          ...res.whatsappNotifications,
          success: res.success !== false,
          lastSentTime: currentTime,
          message: res.message
        });
        await fetchClassStudentsAndAttendance();
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
      console.error('Manual WhatsApp Error:', err);
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
      setIsSendingWa(false);
    }
  };

  return (
    <TeacherLayout activePage="attendance">
      <div className="teacher-attendance-mobile-container" style={{ paddingBottom: '6rem', overflowX: 'hidden' }}>
        
        {/* TOP COMPACT HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '1.35rem', color: '#0F172A', fontWeight: 800 }}>
              Attendance
            </h2>
            <div style={{ fontSize: '0.78rem', color: '#64748B', fontWeight: 600 }}>
              Mobile Attendance Portal
            </div>
          </div>

          {/* Mode Switch Tabs */}
          <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', gap: '3px' }}>
            <button
              onClick={() => setActiveTab('mark')}
              style={{
                border: 'none',
                background: activeTab === 'mark' ? '#1E3A8A' : 'transparent',
                color: activeTab === 'mark' ? '#FFFFFF' : '#64748B',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <UserCheck size={14} /> Mark
            </button>
            <button
              onClick={() => setActiveTab('history')}
              style={{
                border: 'none',
                background: activeTab === 'history' ? '#1E3A8A' : 'transparent',
                color: activeTab === 'history' ? '#FFFFFF' : '#64748B',
                padding: '0.35rem 0.85rem',
                borderRadius: '6px',
                fontWeight: 700,
                fontSize: '0.78rem',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.3rem'
              }}
            >
              <BarChart3 size={14} /> Report
            </button>
          </div>
        </div>

        {/* Global Error Alert */}
        {errorMsg && (
          <div
            style={{
              background: '#FEE2E2',
              border: '1px solid #FCA5A5',
              color: '#991B1B',
              padding: '0.65rem 0.9rem',
              borderRadius: '8px',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '0.82rem',
              fontWeight: 600
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={16} />
              <span>{errorMsg}</span>
            </div>
            <button
              onClick={fetchClassStudentsAndAttendance}
              style={{ background: '#991B1B', color: '#FFFFFF', border: 'none', borderRadius: '4px', padding: '0.2rem 0.6rem', fontSize: '0.72rem', fontWeight: 800, cursor: 'pointer' }}
            >
              Retry
            </button>
          </div>
        )}

        {/* 2. TOP CONTROLS (CLASS, SUBJECT, DATE, START TIME, END TIME) */}
        <div
          style={{
            background: '#FFFFFF',
            border: '1px solid #E2E8F0',
            borderRadius: '12px',
            padding: '0.85rem 1rem',
            marginBottom: '1rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.65rem', marginBottom: '0.65rem' }}>
            {/* Class Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                Class
              </label>
              <select
                className="teacher-input"
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                disabled={loadingAllocations}
                style={{ width: '100%', height: '38px', fontSize: '0.85rem', fontWeight: 700, padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              >
                {allocatedClasses.length === 0 ? (
                  <option value="">No classes</option>
                ) : (
                  allocatedClasses.map((cls) => (
                    <option key={cls} value={cls}>{cls}</option>
                  ))
                )}
              </select>
            </div>

            {/* Subject Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                Subject
              </label>
              <select
                className="teacher-input"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                disabled={loadingAllocations}
                style={{ width: '100%', height: '38px', fontSize: '0.85rem', fontWeight: 700, padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              >
                {availableAttendanceSubjects.length === 0 ? (
                  <option value="">No subjects</option>
                ) : (
                  availableAttendanceSubjects.map((subj) => (
                    <option key={subj} value={subj}>{subj}</option>
                  ))
                )}
              </select>
            </div>

            {/* Date Selector */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                Date
              </label>
              <input
                type="date"
                className="teacher-input"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                style={{ width: '100%', height: '38px', fontSize: '0.82rem', fontWeight: 700, padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              />
            </div>

            {/* Start Time Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                Start Time
              </label>
              <input
                type="time"
                className="teacher-input"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                disabled={isAlreadySubmitted}
                style={{ width: '100%', height: '38px', fontSize: '0.82rem', fontWeight: 700, padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              />
            </div>

            {/* End Time Input */}
            <div>
              <label style={{ display: 'block', fontSize: '0.72rem', fontWeight: 800, color: '#64748B', marginBottom: '0.25rem', textTransform: 'uppercase' }}>
                End Time
              </label>
              <input
                type="time"
                className="teacher-input"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                disabled={isAlreadySubmitted}
                style={{ width: '100%', height: '38px', fontSize: '0.82rem', fontWeight: 700, padding: '0 0.5rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}
              />
            </div>
          </div>

          {/* 3. SHOW CLASS TIME & SESSION TYPE */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', borderTop: '1px solid #F1F5F9', paddingTop: '0.55rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.78rem', fontWeight: 700, color: '#1E3A8A' }}>
              <Clock size={14} color="#1E3A8A" />
              <span>
                {startTime && endTime
                  ? `${formatTime12hClient(startTime)} - ${formatTime12hClient(endTime)}`
                  : (classTime || 'Select Start & End Time')}
              </span>
            </div>

            {/* Session Type Controls */}
            <div style={{ display: 'flex', gap: '4px' }}>
              <button
                type="button"
                disabled={isAlreadySubmitted}
                onClick={() => setAttendanceType('ATTENDANCE')}
                style={{
                  border: 'none',
                  background: attendanceType === 'ATTENDANCE' ? '#DBEAFE' : '#F1F5F9',
                  color: attendanceType === 'ATTENDANCE' ? '#1E40AF' : '#64748B',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  cursor: isAlreadySubmitted ? 'not-allowed' : 'pointer'
                }}
              >
                Regular Class
              </button>
              <button
                type="button"
                disabled={isAlreadySubmitted}
                onClick={() => setAttendanceType('HOLIDAY')}
                style={{
                  border: 'none',
                  background: attendanceType === 'HOLIDAY' ? '#FEF3C7' : '#F1F5F9',
                  color: attendanceType === 'HOLIDAY' ? '#B45309' : '#64748B',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  cursor: isAlreadySubmitted ? 'not-allowed' : 'pointer'
                }}
              >
                🌤 Holiday
              </button>
              <button
                type="button"
                disabled={isAlreadySubmitted}
                onClick={() => setAttendanceType('CLOSED')}
                style={{
                  border: 'none',
                  background: attendanceType === 'CLOSED' ? '#E2E8F0' : '#F1F5F9',
                  color: attendanceType === 'CLOSED' ? '#334155' : '#64748B',
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  padding: '0.25rem 0.55rem',
                  borderRadius: '6px',
                  cursor: isAlreadySubmitted ? 'not-allowed' : 'pointer'
                }}
              >
                🔒 Closed
              </button>
            </div>
          </div>
        </div>

        {/* MARK ATTENDANCE VIEW TAB */}
        {activeTab === 'mark' && (
          <>
            {/* HOLIDAY STATE BANNER */}
            {attendanceType === 'HOLIDAY' && (
              <div style={{ background: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '12px', padding: '1.75rem 1rem', textAlign: 'center', color: '#B45309', marginBottom: '1rem' }}>
                <Sun size={40} style={{ margin: '0 auto 0.5rem auto' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>🌤 Holiday / No Class</h3>
                <p style={{ margin: '0.4rem 0 1rem 0', fontSize: '0.85rem', color: '#D97706', fontWeight: 700 }}>
                  This subject is marked as Holiday for the selected date.
                </p>
                {!isAlreadySubmitted && (
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={isSaving}
                    style={{
                      background: '#D97706',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.65rem 1.5rem',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      cursor: isSaving ? 'not-allowed' : 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(217, 119, 6, 0.3)'
                    }}
                  >
                    {isSaving ? 'Saving Holiday...' : 'Confirm & Save Subject Holiday'}
                  </button>
                )}
              </div>
            )}

            {/* TUITION CLOSED STATE BANNER */}
            {attendanceType === 'CLOSED' && (
              <div style={{ background: '#F8FAFC', border: '1px solid #CBD5E1', borderRadius: '12px', padding: '2rem 1rem', textAlign: 'center', color: '#475569', marginBottom: '1rem' }}>
                <Lock size={40} style={{ margin: '0 auto 0.5rem auto' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>🔒 Tuition Closed</h3>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.82rem', color: '#64748B' }}>Tuition closed on this date. No attendance records needed.</p>
              </div>
            )}

            {/* REGULAR ATTENDANCE FLOW */}
            {attendanceType === 'ATTENDANCE' && (
              <>
                {/* 4. ATTENDANCE SUMMARY & MARK ALL PRESENT */}
                <div
                  style={{
                    background: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    borderRadius: '12px',
                    padding: '0.75rem 1rem',
                    marginBottom: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: '0.65rem'
                  }}
                >
                  {/* Compact Horizontal Summary */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', fontSize: '0.82rem', fontWeight: 800 }}>
                    <span style={{ color: '#0F172A' }}>
                      Students: <strong>{filteredStudents.length}</strong>
                    </span>
                    <span style={{ color: '#059669', background: '#ECFDF5', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      Present: {presentCount}
                    </span>
                    <span style={{ color: '#DC2626', background: '#FEF2F2', padding: '0.15rem 0.5rem', borderRadius: '6px' }}>
                      Absent: {absentCount}
                    </span>
                  </div>

                  {/* 5. MARK ALL PRESENT BUTTON */}
                  {!isAlreadySubmitted && (
                    <button
                      type="button"
                      onClick={markAllPresent}
                      disabled={students.length === 0}
                      style={{
                        background: '#ECFDF5',
                        color: '#047857',
                        border: '1px solid #A7F3D0',
                        borderRadius: '8px',
                        padding: '0.4rem 0.85rem',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.35rem'
                      }}
                    >
                      <CheckCheck size={15} color="#059669" />
                      <span>✓ Mark All Present</span>
                    </button>
                  )}
                </div>

                {/* 26. COMPACT SEARCH FIELD */}
                <div style={{ marginBottom: '0.85rem', position: 'relative' }}>
                  <input
                    type="text"
                    placeholder="Search student by name, roll no, or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    style={{
                      width: '100%',
                      height: '38px',
                      paddingLeft: '2.2rem',
                      paddingRight: '0.75rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      fontSize: '0.83rem',
                      outline: 'none',
                      background: '#FFFFFF',
                      boxSizing: 'border-box'
                    }}
                  />
                  <Search size={15} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>

                {/* SUBMITTED LOCK BANNER IF READ-ONLY */}
                {isAlreadySubmitted && (
                  <div
                    style={{
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                      borderRadius: '10px',
                      padding: '0.65rem 0.85rem',
                      marginBottom: '0.85rem',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      color: '#166534',
                      fontWeight: 800,
                      fontSize: '0.82rem'
                    }}
                  >
                    <Lock size={16} color="#166534" />
                    <span>✓ Attendance Submitted (Read-Only)</span>
                  </div>
                )}

                {/* 6. STUDENT LIST (COMPACT TOUCH-FRIENDLY ROWS FOR MOBILE) */}
                {loadingStudents ? (
                  <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
                    <RotateCw size={28} className="spin-icon" style={{ margin: '0 auto 0.5rem auto' }} />
                    <div style={{ fontSize: '0.85rem', fontWeight: 700 }}>Loading class roster...</div>
                  </div>
                ) : filteredStudents.length === 0 ? (
                  <div style={{ background: '#FFFFFF', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '2.5rem 1rem', textAlign: 'center', color: '#64748B' }}>
                    <AlertCircle size={36} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
                    <h4 style={{ margin: 0, color: '#1E293B' }}>No students found for this class</h4>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {filteredStudents.map((std) => {
                      const stdKey = String(std.id || std._id || std.studentId);
                      const status = attendanceState[stdKey] || 'Present';
                      const isPresent = status === 'Present';

                      return (
                        <div
                          key={stdKey}
                          style={{
                            background: isPresent ? '#FFFFFF' : '#FEF2F2',
                            border: isPresent ? '1px solid #E2E8F0' : '1px solid #FCA5A5',
                            borderRadius: '10px',
                            padding: '0.65rem 0.85rem',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            transition: 'all 0.15s ease',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.02)'
                          }}
                        >
                          {/* Student Info */}
                          <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0, flex: 1, paddingRight: '0.5rem' }}>
                            <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#0F172A', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {std.name}
                            </span>
                            <span style={{ fontSize: '0.73rem', color: '#64748B', fontWeight: 600, marginTop: '1px' }}>
                              Roll No. {std.rollNo || '-'} • ID: {std.studentId || '-'}
                            </span>
                          </div>

                          {/* 7. PRESENT / ABSENT TOUCH CONTROL */}
                          {isAlreadySubmitted ? (
                            <span
                              style={{
                                padding: '0.35rem 0.75rem',
                                borderRadius: '6px',
                                fontSize: '0.78rem',
                                fontWeight: 800,
                                background: isPresent ? '#D1FAE5' : '#FEE2E2',
                                color: isPresent ? '#065F46' : '#991B1B'
                              }}
                            >
                              {isPresent ? '✓ Present' : '✕ Absent'}
                            </span>
                          ) : (
                            <div style={{ display: 'flex', background: '#F1F5F9', padding: '3px', borderRadius: '8px', gap: '3px' }}>
                              <button
                                type="button"
                                onClick={() => setStudentStatus(stdKey, 'Present')}
                                style={{
                                  border: 'none',
                                  background: isPresent ? '#10B981' : 'transparent',
                                  color: isPresent ? '#FFFFFF' : '#64748B',
                                  padding: '0.45rem 0.75rem',
                                  borderRadius: '6px',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  minHeight: '36px',
                                  minWidth: '72px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                ✓ Present
                              </button>
                              <button
                                type="button"
                                onClick={() => setStudentStatus(stdKey, 'Absent')}
                                style={{
                                  border: 'none',
                                  background: !isPresent ? '#EF4444' : 'transparent',
                                  color: !isPresent ? '#FFFFFF' : '#64748B',
                                  padding: '0.45rem 0.75rem',
                                  borderRadius: '6px',
                                  fontWeight: 800,
                                  fontSize: '0.78rem',
                                  cursor: 'pointer',
                                  minHeight: '36px',
                                  minWidth: '72px',
                                  transition: 'all 0.15s ease'
                                }}
                              >
                                ✕ Absent
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* 13. WHATSAPP BUTTON & RESULT CARD (SHOWN IF SUBMITTED) */}
                {isAlreadySubmitted && (
                  <div style={{ marginTop: '1.25rem' }}>
                    {absentCount > 0 ? (
                      <>
                        <button
                          type="button"
                          className="teacher-btn"
                          onClick={() => handleSendManualWhatsApp(null)}
                          disabled={isSendingWa}
                          style={{
                            width: '100%',
                            background: isSendingWa ? '#64748B' : (waResult?.sent > 0 && waResult?.failed === 0) ? '#059669' : '#25D366',
                            color: '#FFFFFF',
                            fontWeight: 800,
                            padding: '0.75rem 1rem',
                            fontSize: '0.88rem',
                            borderRadius: '10px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.5rem',
                            boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                            border: 'none',
                            cursor: isSendingWa ? 'not-allowed' : 'pointer'
                          }}
                        >
                          <Smartphone size={18} />
                          <span>
                            {isSendingWa
                              ? '⏳ Sending WhatsApp...'
                              : (waResult?.sent > 0 && waResult?.failed === 0)
                              ? `✓ WhatsApp Sent (${waResult.sent})`
                              : `Send WhatsApp to Absent Students (${absentCount})`}
                          </span>
                        </button>
                      </>
                    ) : (
                      <div style={{ background: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px', padding: '0.65rem 1rem', textAlign: 'center', color: '#166534', fontSize: '0.82rem', fontWeight: 700 }}>
                        ✓ All students are present. No absent students to notify.
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* 9. STICKY MOBILE SAVE BUTTON */}
            {!isAlreadySubmitted && attendanceType === 'ATTENDANCE' && students.length > 0 && (
              <div
                style={{
                  position: 'fixed',
                  bottom: 0,
                  left: 0,
                  right: 0,
                  background: '#FFFFFF',
                  borderTop: '1px solid #E2E8F0',
                  padding: '0.75rem 1rem calc(0.75rem + env(safe-area-inset-bottom, 0px))',
                  boxShadow: '0 -4px 16px rgba(0, 0, 0, 0.08)',
                  zIndex: 90
                }}
              >
                <div style={{ maxWidth: '600px', margin: '0 auto', display: 'flex', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={handleSaveAttendance}
                    disabled={isSaving || !hasValidSchedule}
                    style={{
                      flex: 1,
                      background: (!hasValidSchedule || isSaving) ? '#94A3B8' : 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '10px',
                      padding: '0.85rem 1rem',
                      fontSize: '0.92rem',
                      fontWeight: 900,
                      cursor: (!hasValidSchedule || isSaving) ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.5rem',
                      boxShadow: '0 4px 12px rgba(30, 58, 138, 0.3)'
                    }}
                  >
                    {isSaving ? (
                      <>
                        <RotateCw size={18} className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                        <span>Saving...</span>
                      </>
                    ) : (
                      <>
                        <Save size={18} />
                        <span>Save Attendance</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* TAB 2: MONTHLY REPORT VIEW */}
        {activeTab === 'history' && (
          <MonthlyAttendanceGrid
            monthlyGrid={monthlyGrid}
            loading={loadingHistory}
            selectedStandard={selectedClass}
            selectedSubject={selectedSubject}
            selectedMonth={historyMonth}
            selectedYear={historyYear}
          />
        )}

        {/* 10. AFTER SAVE FEEDBACK MODAL */}
        {savedSummary && (
          <TeacherModal
            isOpen={saveModalOpen}
            onClose={() => setSaveModalOpen(false)}
            title="Attendance Submitted"
            maxWidth="480px"
          >
            <div style={{ textAlign: 'center', padding: '0.5rem 0' }}>
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#D1FAE5',
                  color: '#10B981',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '0.75rem'
                }}
              >
                <CheckCircle size={32} />
              </div>

              <h3 style={{ margin: '0 0 0.3rem 0', color: '#0F172A', fontSize: '1.2rem', fontWeight: 800 }}>
                ✓ Attendance Submitted
              </h3>
              <p style={{ color: '#64748B', fontSize: '0.85rem', marginBottom: '1rem' }}>
                Class <strong>{savedSummary.className}</strong> ({savedSummary.subject}) • {formatDisplayDate(savedSummary.date)}
              </p>

              {/* Counts Card */}
              <div
                style={{
                  background: '#F8FAFC',
                  padding: '0.85rem',
                  borderRadius: '10px',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  justifyContent: 'space-around',
                  marginBottom: '1rem'
                }}
              >
                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#64748B', fontWeight: 700 }}>TOTAL</span>
                  <strong style={{ fontSize: '1.2rem', color: '#0F172A' }}>{savedSummary.total}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#059669', fontWeight: 700 }}>PRESENT</span>
                  <strong style={{ fontSize: '1.2rem', color: '#10B981' }}>{savedSummary.present}</strong>
                </div>
                <div>
                  <span style={{ display: 'block', fontSize: '0.72rem', color: '#DC2626', fontWeight: 700 }}>ABSENT</span>
                  <strong style={{ fontSize: '1.2rem', color: '#EF4444' }}>{savedSummary.absent}</strong>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                {savedSummary.absent > 0 && (
                  <button
                    type="button"
                    className="teacher-btn"
                    onClick={() => {
                      setSaveModalOpen(false);
                      handleSendManualWhatsApp();
                    }}
                    style={{
                      background: '#25D366',
                      color: '#FFFFFF',
                      fontWeight: 800,
                      justifyContent: 'center',
                      padding: '0.75rem 1rem',
                      borderRadius: '8px',
                      fontSize: '0.85rem'
                    }}
                  >
                    <Smartphone size={16} />
                    <span>Send WhatsApp to Absent Students ({savedSummary.absent})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => setSaveModalOpen(false)}
                  style={{
                    width: '100%',
                    background: '#F1F5F9',
                    border: '1px solid #CBD5E1',
                    color: '#334155',
                    fontWeight: 800,
                    padding: '0.65rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.85rem',
                    cursor: 'pointer'
                  }}
                >
                  Close
                </button>
              </div>
            </div>
          </TeacherModal>
        )}

        {/* WHATSAPP EXECUTION RESULT MODAL OVERLAY */}
        <WhatsAppResultModal
          isOpen={waModalOpen}
          onClose={() => setWaModalOpen(false)}
          result={waResult}
          isSending={isSendingWa}
          onRetryFailed={(failedIds) => handleSendManualWhatsApp(failedIds)}
          onRetryAll={() => handleSendManualWhatsApp(null)}
        />
      </div>
    </TeacherLayout>
  );
};

export default TeacherAttendance;
