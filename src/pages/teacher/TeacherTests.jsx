import React, { useState, useEffect, useContext } from 'react';
import TeacherLayout from '../../layouts/TeacherLayout';
import TeacherModal from '../../components/teacher/TeacherModal';
import { AuthContext } from '../../context/AuthContext';
import { getActiveTeacherId } from '../../config/teacherConfig';
import {
  getTeacherAllocationsAPI,
  getAuthenticatedTeacherProfileAPI,
  getTestsAPI,
  createTestAPI,
  deleteTestAPI,
  getAttendanceStudentsAPI,
  createResultsAPI,
  getResultsByTestAPI,
  sendTestAbsentWhatsAppAPI
} from '../../services/api';
import { normalizeSubject } from '../../utils/subjectUtils';
import {
  Plus,
  FileCheck2,
  Eye,
  Award,
  Calendar,
  Save,
  CheckCircle2,
  Trash2,
  Loader2,
  AlertCircle,
  Send,
  Smartphone,
  XCircle,
  CheckCheck,
  Lock,
  Unlock,
  Edit3,
  BarChart3
} from 'lucide-react';
import '../../styles/teacher/teacher-pages.css';

const TeacherTests = () => {
  const { teacherProfile, user } = useContext(AuthContext) || {};
  const teacherId = teacherProfile?.id || teacherProfile?._id || user?.teacher_id;

  // Allocations & MongoDB Data State
  const [allocatedClasses, setAllocatedClasses] = useState([]);
  const [teacherAllocations, setTeacherAllocations] = useState([]);
  const [allocatedSubjects, setAllocatedSubjects] = useState([]);
  const [tests, setTests] = useState([]);
  const [loadingTests, setLoadingTests] = useState(true);
  const [loadingAllocations, setLoadingAllocations] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [marksModalOpen, setMarksModalOpen] = useState(false);

  const [selectedTest, setSelectedTest] = useState(null);

  // New Test Form State
  const [newTest, setNewTest] = useState({
    testName: '',
    className: '',
    subject: '',
    date: new Date().toISOString().split('T')[0],
    totalMarks: '50'
  });

  // Compute available subjects strictly for selected test class
  const currentAllocation = teacherAllocations.find(a => a.standard === newTest.className);
  const availableTestSubjects = currentAllocation && Array.isArray(currentAllocation.subjects)
    ? currentAllocation.subjects
    : (allocatedSubjects.length > 0 ? allocatedSubjects : []);

  useEffect(() => {
    if (availableTestSubjects.length > 0) {
      if (!availableTestSubjects.includes(newTest.subject)) {
        setNewTest(prev => ({ ...prev, subject: availableTestSubjects[0] }));
      }
    } else {
      setNewTest(prev => ({ ...prev, subject: '' }));
    }
  }, [newTest.className, teacherAllocations]);

  // Marks Modal State
  const [testStudents, setTestStudents] = useState([]);
  const [studentMarks, setStudentMarks] = useState({}); // { [studentId]: marks }
  const [studentStatuses, setStudentStatuses] = useState({}); // { [studentId]: 'PRESENT' | 'ABSENT' }
  const [existingResultsMap, setExistingResultsMap] = useState({}); // { [studentId]: resultObj }
  
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [isSavingMarks, setIsSavingMarks] = useState(false);
  const [isCreatingTest, setIsCreatingTest] = useState(false);
  const [isSendingWhatsApp, setIsSendingWhatsApp] = useState(false);

  // Marks Lock & Confirmation Summary Modal State
  const [isMarksLocked, setIsMarksLocked] = useState(false);
  const [saveSummaryModalOpen, setSaveSummaryModalOpen] = useState(false);
  const [savedMarksSummary, setSavedMarksSummary] = useState(null);

  // WhatsApp Summary Modal State
  const [waSummaryModalOpen, setWaSummaryModalOpen] = useState(false);
  const [waSummaryResult, setWaSummaryResult] = useState(null);

  // Feedback State
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. Fetch Teacher Allocations (Classes & Subjects) on Mount
  useEffect(() => {
    const fetchAllocations = async () => {
      setLoadingAllocations(true);
      try {
        let allocs = [];
        let classes = [];
        let subjects = [];

        try {
          const profRes = await getAuthenticatedTeacherProfileAPI();
          if (profRes && profRes.success && profRes.teacher && Array.isArray(profRes.teacher.class_subjects)) {
            const allocMap = new Map();
            profRes.teacher.class_subjects.forEach(cs => {
              if (!allocMap.has(cs.class_name)) allocMap.set(cs.class_name, []);
              allocMap.get(cs.class_name).push(cs.subject_name);
              if (!classes.includes(cs.class_name)) classes.push(cs.class_name);
              if (!subjects.includes(cs.subject_name)) subjects.push(cs.subject_name);
            });
            allocs = Array.from(allocMap.entries()).map(([std, subs]) => ({
              standard: std,
              subjects: [...new Set(subs)]
            }));
          }
        } catch (pErr) {
          console.warn('Authenticated profile fetch fallback:', pErr);
        }

        if (allocs.length === 0) {
          const res = await getTeacherAllocationsAPI(teacherId);
          if (res && res.success) {
            classes = res.classes || [];
            subjects = res.subjects || [];
            if (Array.isArray(res.allocations)) {
              allocs = res.allocations;
            } else {
              allocs = classes.map(c => ({ standard: c, subjects }));
            }
          }
        }

        if (classes.length > 0) {
          setAllocatedClasses(classes);
          setAllocatedSubjects(subjects);
          setTeacherAllocations(allocs);

          const defaultClass = classes[0];
          const matchAlloc = allocs.find(a => a.standard === defaultClass);
          const defaultSub = matchAlloc && matchAlloc.subjects && matchAlloc.subjects.length > 0 ? matchAlloc.subjects[0] : (subjects[0] || 'Mathematics');

          setNewTest((prev) => ({
            ...prev,
            className: defaultClass,
            subject: defaultSub
          }));
        }
      } catch (err) {
        console.warn('Failed to load teacher allocations:', err.message);
      } finally {
        setLoadingAllocations(false);
      }
    };
    fetchAllocations();
  }, [teacherId]);

  // 2. Fetch Tests List from MongoDB
  const fetchTests = async () => {
    setLoadingTests(true);
    setErrorMsg('');
    try {
      const res = await getTestsAPI({ teacher: teacherId });
      if (res && res.success) {
        const rawTests = res.tests || [];

        // Enrich tests with dynamic status by checking existing results in MongoDB
        const enrichedTests = await Promise.all(
          rawTests.map(async (t) => {
            try {
              const resData = await getResultsByTestAPI(t._id);
              const resultsCount = resData && resData.results ? resData.results.length : 0;
              return {
                ...t,
                testName: t.title || t.testName,
                className: t.standard || t.className,
                date: t.testDate || t.date || '',
                testDate: t.testDate || t.date || '',
                marksSubmitted: resultsCount > 0,
                status: resultsCount > 0 ? 'Completed' : 'Scheduled',
                resultsCount
              };
            } catch (e) {
              return {
                ...t,
                testName: t.title || t.testName,
                className: t.standard || t.className,
                date: t.testDate || t.date || '',
                testDate: t.testDate || t.date || '',
                marksSubmitted: false,
                status: 'Scheduled',
                resultsCount: 0
              };
            }
          })
        );

        setTests(enrichedTests);
      }
    } catch (err) {
      console.error('Fetch Tests Error:', err);
      setErrorMsg(err.message || 'Unable to load tests from MongoDB.');
    } finally {
      setLoadingTests(false);
    }
  };

  useEffect(() => {
    fetchTests();
  }, [teacherId]);

  // Handlers for Modals
  const handleOpenCreateModal = () => {
    setErrorMsg('');
    setSuccessMsg('');
    const defaultClass = allocatedClasses.length > 0 ? allocatedClasses[0] : '';
    const matchAlloc = teacherAllocations.find(a => a.standard === defaultClass);
    const defaultSub = matchAlloc && matchAlloc.subjects && matchAlloc.subjects.length > 0
      ? matchAlloc.subjects[0]
      : (allocatedSubjects.length > 0 ? allocatedSubjects[0] : 'Mathematics');

    setNewTest({
      testName: '',
      className: defaultClass,
      subject: defaultSub,
      date: new Date().toISOString().split('T')[0],
      totalMarks: '50'
    });
    setCreateModalOpen(true);
  };

  const handleCreateTestSubmit = async (e) => {
    e.preventDefault();
    if (!newTest.testName.trim()) {
      setErrorMsg('Validation Error: Test name is required.');
      return;
    }
    if (!newTest.className) {
      setErrorMsg('Validation Error: Target Class is required.');
      return;
    }
    if (!newTest.subject) {
      setErrorMsg('Validation Error: Subject is required.');
      return;
    }

    setIsCreatingTest(true);
    setErrorMsg('');

    try {
      const payload = {
        title: newTest.testName.trim(),
        standard: newTest.className,
        subject: normalizeSubject(newTest.subject, newTest.className),
        teacher: teacherId,
        testDate: newTest.date,
        totalMarks: Number(newTest.totalMarks) || 50,
        description: `${newTest.className} - ${newTest.subject} Test`
      };

      const res = await createTestAPI(payload);
      if (res && res.success) {
        setCreateModalOpen(false);
        await fetchTests();
      } else {
        throw new Error(res?.message || 'Failed to create test in database.');
      }
    } catch (err) {
      console.error('Create Test Error:', err);
      setErrorMsg(err.message || 'Unable to save test to database.');
    } finally {
      setIsCreatingTest(false);
    }
  };

  const handleOpenViewModal = (test) => {
    setSelectedTest(test);
    setViewModalOpen(true);
  };

  const handleOpenMarksModal = async (test) => {
    setSelectedTest(test);
    setMarksModalOpen(true);
    setLoadingStudents(true);
    setStudentMarks({});
    setStudentStatuses({});
    setExistingResultsMap({});
    setErrorMsg('');
    setSuccessMsg('');
    setIsMarksLocked(false);

    try {
      const targetClass = test.standard || test.className;
      const targetSubject = test.subject;

      // 1. Fetch real active students for exact test class
      const studentsRes = await getAttendanceStudentsAPI({
        teacherId,
        standard: targetClass,
        subject: targetSubject
      });
      const fetchedStudents = studentsRes.students || [];
      setTestStudents(fetchedStudents);

      // 2. Fetch previously saved results for this test
      const resultsRes = await getResultsByTestAPI(test._id || test.id);
      const existingResults = resultsRes.results || [];

      const marksMap = {};
      const statusMap = {};
      const resultMap = {};

      existingResults.forEach((r) => {
        const stdId = String(
          (typeof r.student === 'object' ? (r.student?.id || r.student?._id) : r.student) ||
          r.studentDbId ||
          r.studentId ||
          ''
        );
        if (stdId) {
          resultMap[stdId] = r;
          statusMap[stdId] = r.status || (r.marksObtained !== null && r.marksObtained !== undefined ? 'PRESENT' : 'ABSENT');
          marksMap[stdId] = r.status === 'ABSENT' ? '' : (r.marksObtained !== null && r.marksObtained !== undefined ? String(r.marksObtained) : '');
        }
      });

      // Default lock mode if existing results exist
      const hasSavedResults = existingResults.length > 0;
      setIsMarksLocked(hasSavedResults);

      // Default unmarked students to PRESENT
      fetchedStudents.forEach((std) => {
        const stdKey = String(std.id || std._id || std.studentId);
        if (!statusMap[stdKey]) {
          statusMap[stdKey] = 'PRESENT';
        }
      });

      setStudentMarks(marksMap);
      setStudentStatuses(statusMap);
      setExistingResultsMap(resultMap);
    } catch (err) {
      console.error('Fetch Marks Roster Error:', err);
      setErrorMsg(err.message || 'Unable to load student roster for this test.');
    } finally {
      setLoadingStudents(false);
    }
  };

  const handleToggleStatus = (studentId) => {
    if (isMarksLocked) return;
    const stdKey = String(studentId);
    setStudentStatuses((prev) => {
      const current = prev[stdKey] || 'PRESENT';
      const nextStatus = current === 'PRESENT' ? 'ABSENT' : 'PRESENT';
      
      // If setting to ABSENT, clear marks
      if (nextStatus === 'ABSENT') {
        setStudentMarks((prevMarks) => ({ ...prevMarks, [stdKey]: '' }));
      }

      return {
        ...prev,
        [stdKey]: nextStatus
      };
    });
  };

  const handleSaveMarksSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTest || isMarksLocked) return;

    // Validate marks for PRESENT students
    const maxMarks = Number(selectedTest.totalMarks) || 100;
    for (const std of testStudents) {
      const stdKey = String(std.id || std._id || std.studentId);
      const status = studentStatuses[stdKey] || 'PRESENT';
      if (status === 'PRESENT') {
        const marksVal = studentMarks[stdKey];
        if (marksVal !== undefined && marksVal !== '') {
          const num = Number(marksVal);
          if (isNaN(num) || num < 0) {
            setErrorMsg(`Validation Error: Marks for ${std.name} cannot be negative.`);
            return;
          }
          if (num > maxMarks) {
            setErrorMsg(`Validation Error: Marks for ${std.name} (${num}) cannot exceed total marks (${maxMarks}).`);
            return;
          }
        }
      }
    }

    setIsSavingMarks(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const resultsPayload = {
        test: selectedTest._id || selectedTest.id,
        results: testStudents.map((std) => {
          const stdKey = String(std.id || std._id || std.studentId);
          const status = studentStatuses[stdKey] || 'PRESENT';
          const scoreInput = studentMarks[stdKey];
          return {
            student: std.id || std._id || std.studentId,
            status: status,
            marksObtained: status === 'ABSENT' ? null : (scoreInput !== undefined && scoreInput !== '' ? Number(scoreInput) : 0)
          };
        })
      };

      const res = await createResultsAPI(resultsPayload);
      if (res && res.success) {
        // Calculate Summary Metrics for Popup Modal
        const presentStudents = testStudents.filter(std => (studentStatuses[String(std.id || std._id || std.studentId)] || 'PRESENT') === 'PRESENT');
        const absentStudents = testStudents.filter(std => studentStatuses[String(std.id || std._id || std.studentId)] === 'ABSENT');
        const scores = presentStudents.map(std => Number(studentMarks[String(std.id || std._id || std.studentId)] || 0));
        const highestScore = scores.length > 0 ? Math.max(...scores) : 0;
        const avgScore = scores.length > 0 ? (scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(1) : '0';

        setSavedMarksSummary({
          testName: selectedTest.testName || selectedTest.title,
          className: selectedTest.className || selectedTest.standard,
          subject: selectedTest.subject,
          totalMarks: selectedTest.totalMarks,
          totalStudents: testStudents.length,
          presentCount: presentStudents.length,
          absentCount: absentStudents.length,
          highestScore,
          avgScore
        });

        setIsMarksLocked(true); // Lock immediately on save
        setSaveSummaryModalOpen(true); // Open Confirmation Summary Popup

        await fetchTests();
        // Re-fetch existing results map to update UI indicators
        const updatedResultsRes = await getResultsByTestAPI(selectedTest._id || selectedTest.id);
        const newResults = updatedResultsRes.results || [];
        const resultMap = {};
        newResults.forEach((r) => {
          const stdId = String((typeof r.student === 'object' ? (r.student?.id || r.student?._id) : r.student) || r.studentDbId || r.studentId || '');
          if (stdId) resultMap[stdId] = r;
        });
        setExistingResultsMap(resultMap);
      } else {
        throw new Error(res?.message || 'Failed to save test marks.');
      }
    } catch (err) {
      console.error('Save Marks Error:', err);
      setErrorMsg(err.message || 'Unable to save marks to database.');
    } finally {
      setIsSavingMarks(false);
    }
  };

  // Trigger Manual WhatsApp Notifications for Test Absentees
  const handleSendWhatsAppToAbsent = async () => {
    if (!selectedTest) return;

    setIsSendingWhatsApp(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await sendTestAbsentWhatsAppAPI(selectedTest._id || selectedTest.id);
      if (res && res.success) {
        setWaSummaryResult(res.whatsappNotifications);
        setWaSummaryModalOpen(true);
        // Refresh results map to show updated notificationSent status
        const updatedResultsRes = await getResultsByTestAPI(selectedTest._id || selectedTest.id);
        const newResults = updatedResultsRes.results || [];
        const resultMap = {};
        newResults.forEach((r) => {
          const stdId = String((typeof r.student === 'object' ? (r.student?.id || r.student?._id) : r.student) || r.studentDbId || r.studentId || '');
          if (stdId) resultMap[stdId] = r;
        });
        setExistingResultsMap(resultMap);
      } else {
        throw new Error(res?.message || 'Failed to send WhatsApp notifications.');
      }
    } catch (err) {
      console.error('Send WhatsApp Error:', err);
      setErrorMsg(err.message || 'Failed to send WhatsApp notifications. Make sure WhatsApp Web is connected.');
    } finally {
      setIsSendingWhatsApp(false);
    }
  };

  const handleDeleteTest = async (testId) => {
    if (!window.confirm('Are you sure you want to delete this test and its student marks from MongoDB?')) return;
    try {
      await deleteTestAPI(testId);
      await fetchTests();
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete test.');
    }
  };

  // Count absent students
  const absentStudentsCount = Object.values(studentStatuses).filter(st => st === 'ABSENT').length;

  return (
    <TeacherLayout activePage="tests">
      <div className="teacher-page-container">
        {/* Header Banner */}
        <div className="teacher-welcome-banner">
          <div className="teacher-welcome-text">
            <h2>Tests & Marks Management 📝</h2>
            <p>Create tests, manage assessments, enter student scores, and send absent notifications via WhatsApp Web.</p>
          </div>
          <div className="teacher-welcome-actions">
            <button
              className="teacher-btn teacher-btn-primary"
              onClick={handleOpenCreateModal}
              disabled={loadingAllocations}
              style={{ padding: '0.8rem 1.5rem', fontSize: '0.95rem' }}
            >
              <Plus size={18} />
              <span>Create Test</span>
            </button>
          </div>
        </div>

        {/* Global Error Alert */}
        {errorMsg && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #EF4444',
              color: '#991B1B',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Global Success Alert */}
        {successMsg && (
          <div
            style={{
              background: '#ECFDF5',
              border: '1px solid #10B981',
              color: '#065F46',
              padding: '0.85rem 1.25rem',
              borderRadius: '8px',
              marginBottom: '1.25rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.6rem',
              fontWeight: 600,
              fontSize: '0.9rem'
            }}
          >
            <CheckCircle2 size={20} />
            <span>{successMsg}</span>
          </div>
        )}

        {/* Tests Table Panel */}
        <div className="teacher-card-panel">
          <div className="teacher-panel-header">
            <div className="teacher-panel-title-group">
              <FileCheck2 size={22} color="#D4AF37" />
              <div>
                <h3 className="teacher-panel-title">All Examinations & Assessments</h3>
                <p className="teacher-panel-subtitle">Total {tests.length} tests recorded</p>
              </div>
            </div>
            <button
              className="teacher-btn teacher-btn-dark teacher-btn-sm"
              onClick={handleOpenCreateModal}
              disabled={loadingAllocations}
            >
              <Plus size={15} /> Add New
            </button>
          </div>

          <div className="teacher-table-responsive">
            {loadingTests ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666666' }}>
                <Loader2 size={32} color="#D4AF37" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
                <p style={{ marginTop: '1rem', fontWeight: 600 }}>Loading tests from database...</p>
                <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
              </div>
            ) : tests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#666666' }}>
                <Calendar size={40} color="#CCCCCC" style={{ marginBottom: '0.5rem' }} />
                <h4 style={{ margin: '0 0 0.5rem 0', color: '#171717' }}>No Tests Found</h4>
                <p style={{ margin: 0, fontSize: '0.9rem' }}>Create a test to record marks and evaluate student performance.</p>
              </div>
            ) : (
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Test Name</th>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Date</th>
                    <th>Max Marks</th>
                    <th>Status</th>
                    <th style={{ textAlign: 'right' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {tests.map((t) => (
                    <tr key={t._id || t.id}>
                      <td style={{ fontWeight: 700, color: '#171717' }}>{t.testName}</td>
                      <td>{t.className}</td>
                      <td>{t.subject}</td>
                      <td>{t.date}</td>
                      <td style={{ fontWeight: 700, color: '#B8860B' }}>{t.totalMarks} Marks</td>
                      <td>
                        <span className={`teacher-badge ${t.status ? t.status.toLowerCase() : 'scheduled'}`}>
                          {t.status || 'Scheduled'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.5rem' }}>
                          <button
                            className="teacher-btn teacher-btn-outline teacher-btn-sm"
                            onClick={() => handleOpenViewModal(t)}
                            title="View Test Details"
                          >
                            <Eye size={14} /> View
                          </button>

                          <button
                            className="teacher-btn teacher-btn-primary teacher-btn-sm"
                            onClick={() => handleOpenMarksModal(t)}
                            title="Enter / Edit Student Marks"
                          >
                            <Award size={14} /> Marks
                          </button>

                          <button
                            className="teacher-btn teacher-btn-outline teacher-btn-sm"
                            onClick={() => handleDeleteTest(t._id || t.id)}
                            title="Delete Test"
                            style={{ color: '#DC2626', borderColor: '#FCA5A5' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* ==================================================
            1. CREATE TEST CENTERED FIXED MODAL (Portal)
           ================================================== */}
        <TeacherModal
          isOpen={createModalOpen}
          onClose={() => setCreateModalOpen(false)}
          title="Create New Examination / Test"
          maxWidth="550px"
        >
          <form onSubmit={handleCreateTestSubmit}>
            <div className="teacher-form-group">
              <label>Test Title / Name *</label>
              <input
                type="text"
                required
                placeholder="e.g. Unit Test 1, Mathematics Assessment"
                className="teacher-form-input"
                value={newTest.testName}
                onChange={(e) => setNewTest({ ...newTest, testName: e.target.value })}
              />
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="teacher-form-group">
                <label>Target Class / Standard *</label>
                <select
                  className="teacher-form-select"
                  value={newTest.className}
                  onChange={(e) => setNewTest({ ...newTest, className: e.target.value })}
                  required
                >
                  {allocatedClasses.length > 0 ? (
                    allocatedClasses.map((cls) => (
                      <option key={cls} value={cls}>
                        {cls.includes('Standard') ? cls : `${cls} Standard`}
                      </option>
                    ))
                  ) : (
                    <option value="">No Allocated Classes</option>
                  )}
                </select>
              </div>

              <div className="teacher-form-group">
                <label>Subject *</label>
                <select
                  className="teacher-form-select"
                  value={newTest.subject}
                  onChange={(e) => setNewTest({ ...newTest, subject: e.target.value })}
                  required
                >
                  {availableTestSubjects.length > 0 ? (
                    availableTestSubjects.map((subj) => (
                      <option key={subj} value={subj}>
                        {subj}
                      </option>
                    ))
                  ) : (
                    <option value="">No Assigned Subjects</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
              <div className="teacher-form-group">
                <label>Test Date *</label>
                <input
                  type="date"
                  required
                  className="teacher-form-input"
                  value={newTest.date}
                  onChange={(e) => setNewTest({ ...newTest, date: e.target.value })}
                />
              </div>

              <div className="teacher-form-group">
                <label>Total Marks *</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="500"
                  className="teacher-form-input"
                  value={newTest.totalMarks}
                  onChange={(e) => setNewTest({ ...newTest, totalMarks: e.target.value })}
                />
              </div>
            </div>

            <div className="teacher-modal-actions">
              <button
                type="button"
                className="teacher-btn-cancel"
                onClick={() => setCreateModalOpen(false)}
              >
                Cancel
              </button>
              <button type="submit" className="teacher-btn-submit" disabled={isCreatingTest}>
                {isCreatingTest ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Plus size={16} /> Save Test
                  </>
                )}
              </button>
            </div>
          </form>
        </TeacherModal>

        {/* ==================================================
            2. VIEW TEST CENTERED FIXED MODAL (Portal)
           ================================================== */}
        {selectedTest && (
          <TeacherModal
            isOpen={viewModalOpen}
            onClose={() => setViewModalOpen(false)}
            title={`Test Overview - ${selectedTest.testName || selectedTest.title}`}
            maxWidth="520px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div className="teacher-form-group">
                <label>Test Title</label>
                <div className="teacher-info-val">{selectedTest.testName || selectedTest.title}</div>
              </div>

              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="teacher-form-group">
                  <label>Target Class</label>
                  <div className="teacher-info-val">{selectedTest.className || selectedTest.standard}</div>
                </div>
                <div className="teacher-form-group">
                  <label>Subject</label>
                  <div className="teacher-info-val">{selectedTest.subject}</div>
                </div>
              </div>

              <div className="grid-2" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div className="teacher-form-group">
                  <label>Scheduled Date</label>
                  <div className="teacher-info-val">{selectedTest.date}</div>
                </div>
                <div className="teacher-form-group">
                  <label>Maximum Marks</label>
                  <div className="teacher-info-val" style={{ color: '#B8860B' }}>
                    {selectedTest.totalMarks} Marks
                  </div>
                </div>
              </div>

              <div className="teacher-form-group">
                <label>Evaluation Status</label>
                <div>
                  <span className={`teacher-badge ${selectedTest.status ? selectedTest.status.toLowerCase() : 'scheduled'}`}>
                    {selectedTest.status || 'Scheduled'}
                  </span>
                </div>
              </div>

              <div className="teacher-modal-actions">
                <button
                  className="teacher-btn-cancel"
                  onClick={() => setViewModalOpen(false)}
                >
                  Close
                </button>
                <button
                  className="teacher-btn-submit"
                  onClick={() => {
                    setViewModalOpen(false);
                    handleOpenMarksModal(selectedTest);
                  }}
                >
                  <Award size={16} /> Enter / Edit Marks
                </button>
              </div>
            </div>
          </TeacherModal>
        )}

        {/* ==================================================
            3. ENTER MARKS CENTERED FIXED MODAL (Portal)
           ================================================== */}
        {selectedTest && (
          <TeacherModal
            isOpen={marksModalOpen}
            onClose={() => setMarksModalOpen(false)}
            title={`Enter Marks - ${selectedTest.testName || selectedTest.title} (${selectedTest.className || selectedTest.standard})`}
            maxWidth="720px"
          >
            <form onSubmit={handleSaveMarksSubmit}>
              {/* Header Info */}
              <div
                style={{
                  background: '#FAF7F0',
                  padding: '0.85rem 1.2rem',
                  borderRadius: '10px',
                  marginBottom: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem'
                }}
              >
                <span style={{ fontSize: '0.9rem', color: '#555555' }}>
                  Subject: <strong>{selectedTest.subject}</strong> | Date: <strong>{selectedTest.date}</strong>
                </span>
                <span className="teacher-badge-pill" style={{ background: '#151515', color: '#F4C542' }}>
                  Max Marks: {selectedTest.totalMarks}
                </span>
              </div>

              {/* Lock Status Alert Banner */}
              {isMarksLocked && (
                <div
                  style={{
                    background: '#FFFBEB',
                    border: '1px solid #FCD34D',
                    borderRadius: '8px',
                    padding: '0.75rem 1rem',
                    marginBottom: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: '0.75rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400E', fontWeight: 600, fontSize: '0.88rem' }}>
                    <Lock size={18} color="#D97706" />
                    <span>Marks are saved & locked (Read-Only). Click "Edit Marks" to modify scores.</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsMarksLocked(false)}
                    style={{
                      background: '#F59E0B',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '6px',
                      padding: '0.4rem 0.85rem',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <Unlock size={14} /> Edit Marks
                  </button>
                </div>
              )}

              <div className="teacher-table-responsive" style={{ maxHeight: '320px', overflowY: 'auto' }}>
                {loadingStudents ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666666' }}>
                    <Loader2 size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
                    <p style={{ fontWeight: 600 }}>Loading class roster...</p>
                  </div>
                ) : testStudents.length === 0 ? (
                  <div style={{ padding: '2rem', textAlign: 'center', color: '#666666' }}>
                    <p style={{ fontWeight: 700 }}>No active students found for Class {selectedTest.className || selectedTest.standard}.</p>
                  </div>
                ) : (
                  <table className="teacher-table">
                    <thead>
                      <tr>
                        <th>Roll No</th>
                        <th>Student ID</th>
                        <th>Student Name</th>
                        <th>Status</th>
                        <th>Score / {selectedTest.totalMarks}</th>
                      </tr>
                    </thead>
                    <tbody>
                      {testStudents.map((std) => {
                        const stdKey = String(std.id || std._id || std.studentId);
                        const status = studentStatuses[stdKey] || 'PRESENT';
                        const isAbsent = status === 'ABSENT';
                        const existingRes = existingResultsMap[stdKey];
                        const notifSent = existingRes?.notificationSent;

                        return (
                          <tr key={stdKey} style={{ background: isAbsent ? '#FEF2F2' : 'transparent' }}>
                            <td style={{ fontWeight: 800 }}>{std.rollNo || '-'}</td>
                            <td style={{ fontSize: '0.85rem', color: '#666666' }}>{std.studentId || '-'}</td>
                            <td style={{ fontWeight: 600, color: '#171717' }}>
                              {std.name}
                              {isAbsent && notifSent && (
                                <span style={{ marginLeft: '0.5rem', fontSize: '0.72rem', background: '#D1FAE5', color: '#065F46', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 700 }}>
                                  WA Sent
                                </span>
                              )}
                            </td>
                            <td>
                              <button
                                type="button"
                                disabled={isMarksLocked}
                                onClick={() => handleToggleStatus(stdKey)}
                                style={{
                                  padding: '0.3rem 0.75rem',
                                  borderRadius: '6px',
                                  fontSize: '0.8rem',
                                  fontWeight: 800,
                                  cursor: isMarksLocked ? 'not-allowed' : 'pointer',
                                  opacity: isMarksLocked ? 0.7 : 1,
                                  border: 'none',
                                  background: isAbsent ? '#EF4444' : '#10B981',
                                  color: '#FFFFFF',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.3rem'
                                }}
                              >
                                {isAbsent ? 'ABSENT' : 'PRESENT'}
                              </button>
                            </td>
                            <td>
                              {isAbsent ? (
                                <span style={{ fontWeight: 800, color: '#DC2626', fontStyle: 'italic', paddingLeft: '0.5rem' }}>
                                  ABSENT
                                </span>
                              ) : (
                                <input
                                  type="number"
                                  min="0"
                                  max={selectedTest.totalMarks}
                                  disabled={isMarksLocked}
                                  required
                                  className="teacher-form-input"
                                  style={{
                                    width: '110px',
                                    padding: '0.4rem 0.75rem',
                                    fontWeight: 700,
                                    background: isMarksLocked ? '#F3F4F6' : '#FFFFFF',
                                    cursor: isMarksLocked ? 'not-allowed' : 'text'
                                  }}
                                  value={
                                    studentMarks[stdKey] !== undefined
                                      ? studentMarks[stdKey]
                                      : ''
                                  }
                                  onChange={(e) =>
                                    setStudentMarks({
                                      ...studentMarks,
                                      [stdKey]: e.target.value
                                    })
                                  }
                                />
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
              <div className="teacher-modal-actions" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="teacher-btn-cancel"
                  onClick={() => setMarksModalOpen(false)}
                >
                  Close
                </button>

                {/* Send WhatsApp to Absent Students button (Visible when absent students exist) */}
                {absentStudentsCount > 0 && (
                  <button
                    type="button"
                    className="teacher-btn"
                    onClick={handleSendWhatsAppToAbsent}
                    disabled={isSendingWhatsApp || isSavingMarks || loadingStudents}
                    style={{
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      padding: '0.65rem 1.15rem',
                      fontWeight: 700
                    }}
                  >
                    {isSendingWhatsApp ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        <span>Sending...</span>
                      </>
                    ) : (
                      <>
                        <Send size={16} />
                        <span>Send WhatsApp to Absent Students ({absentStudentsCount})</span>
                      </>
                    )}
                  </button>
                )}

                {isMarksLocked ? (
                  <button
                    type="button"
                    className="teacher-btn teacher-btn-outline"
                    onClick={() => setIsMarksLocked(false)}
                    style={{ borderColor: '#F59E0B', color: '#D97706', fontWeight: 700, padding: '0.65rem 1.25rem' }}
                  >
                    <Unlock size={16} /> Edit Marks
                  </button>
                ) : (
                  <button
                    type="submit"
                    className="teacher-btn-submit"
                    disabled={isSavingMarks || loadingStudents || testStudents.length === 0}
                  >
                    {isSavingMarks ? (
                      <>
                        <Loader2 size={16} className="animate-spin" /> Saving...
                      </>
                    ) : (
                      <>
                        <Save size={16} /> Save Scores
                      </>
                    )}
                  </button>
                )}
              </div>
            </form>
          </TeacherModal>
        )}

        {/* ==================================================
            4. MARKS SAVED CONFIRMATION SUMMARY MODAL
           ================================================== */}
        {savedMarksSummary && (
          <TeacherModal
            isOpen={saveSummaryModalOpen}
            onClose={() => setSaveSummaryModalOpen(false)}
            title="Marks Saved Successfully! 🎉"
            maxWidth="540px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div
                style={{
                  background: '#ECFDF5',
                  border: '1px solid #A7F3D0',
                  borderRadius: '10px',
                  padding: '1rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem'
                }}
              >
                <CheckCircle2 size={28} color="#059669" style={{ flexShrink: 0 }} />
                <div>
                  <h4 style={{ margin: '0 0 0.2rem 0', color: '#065F46', fontSize: '1rem', fontWeight: 700 }}>
                    Database Updated Successfully
                  </h4>
                  <p style={{ margin: 0, color: '#047857', fontSize: '0.85rem' }}>
                    All student test scores have been securely saved to the database.
                  </p>
                </div>
              </div>

              <div style={{ background: '#FAF7F0', padding: '0.85rem 1rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                <strong style={{ fontSize: '0.95rem', color: '#171717', display: 'block' }}>
                  {savedMarksSummary.testName}
                </strong>
                <span style={{ fontSize: '0.85rem', color: '#666666' }}>
                  Class: <strong>{savedMarksSummary.className}</strong> | Subject: <strong>{savedMarksSummary.subject}</strong> | Max Marks: <strong>{savedMarksSummary.totalMarks}</strong>
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ background: '#F9FAFB', padding: '0.75rem 0.5rem', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
                  <span style={{ fontSize: '0.7rem', color: '#6B7280', fontWeight: 700, display: 'block' }}>TOTAL</span>
                  <strong style={{ fontSize: '1.25rem', color: '#111827' }}>{savedMarksSummary.totalStudents}</strong>
                </div>
                <div style={{ background: '#ECFDF5', padding: '0.75rem 0.5rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <span style={{ fontSize: '0.7rem', color: '#065F46', fontWeight: 700, display: 'block' }}>PRESENT</span>
                  <strong style={{ fontSize: '1.25rem', color: '#059669' }}>{savedMarksSummary.presentCount}</strong>
                </div>
                <div style={{ background: '#FEF2F2', padding: '0.75rem 0.5rem', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                  <span style={{ fontSize: '0.7rem', color: '#991B1B', fontWeight: 700, display: 'block' }}>ABSENT</span>
                  <strong style={{ fontSize: '1.25rem', color: '#DC2626' }}>{savedMarksSummary.absentCount}</strong>
                </div>
                <div style={{ background: '#FFFBEB', padding: '0.75rem 0.5rem', borderRadius: '8px', border: '1px solid #FCD34D' }}>
                  <span style={{ fontSize: '0.7rem', color: '#92400E', fontWeight: 700, display: 'block' }}>HIGHEST</span>
                  <strong style={{ fontSize: '1.25rem', color: '#D97706' }}>{savedMarksSummary.highestScore}</strong>
                </div>
              </div>

              <div className="teacher-modal-actions">
                <button
                  type="button"
                  className="teacher-btn-submit"
                  onClick={() => setSaveSummaryModalOpen(false)}
                  style={{ width: '100%' }}
                >
                  OK, Great!
                </button>
              </div>
            </div>
          </TeacherModal>
        )}

        {/* ==================================================
            5. WHATSAPP NOTIFICATION SUMMARY MODAL
           ================================================== */}
        {waSummaryResult && (
          <TeacherModal
            isOpen={waSummaryModalOpen}
            onClose={() => setWaSummaryModalOpen(false)}
            title="WhatsApp Notifications Result"
            maxWidth="520px"
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.75rem', textAlign: 'center' }}>
                <div style={{ background: '#FAF7F0', padding: '0.85rem', borderRadius: '8px', border: '1px solid var(--border-light)' }}>
                  <span style={{ fontSize: '0.75rem', color: '#666', fontWeight: 700, display: 'block' }}>TOTAL ABSENT</span>
                  <strong style={{ fontSize: '1.4rem', color: '#171717' }}>{waSummaryResult.total || waSummaryResult.totalAbsent || 0}</strong>
                </div>

                <div style={{ background: '#ECFDF5', padding: '0.85rem', borderRadius: '8px', border: '1px solid #A7F3D0' }}>
                  <span style={{ fontSize: '0.75rem', color: '#065F46', fontWeight: 700, display: 'block' }}>SUCCESSFULLY SENT</span>
                  <strong style={{ fontSize: '1.4rem', color: '#059669' }}>{waSummaryResult.sent || 0}</strong>
                </div>

                <div style={{ background: '#FEF2F2', padding: '0.85rem', borderRadius: '8px', border: '1px solid #FCA5A5' }}>
                  <span style={{ fontSize: '0.75rem', color: '#991B1B', fontWeight: 700, display: 'block' }}>FAILED</span>
                  <strong style={{ fontSize: '1.4rem', color: '#DC2626' }}>{waSummaryResult.failed || 0}</strong>
                </div>
              </div>

              {/* Per-Student Status Breakdown List with WhatsApp Open Buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem', maxHeight: '280px', overflowY: 'auto' }}>
                {(waSummaryResult.results || []).map((r, idx) => (
                  <div
                    key={r.studentId || idx}
                    style={{
                      background: r.waUrl ? '#ECFDF5' : '#FEF2F2',
                      border: r.waUrl ? '1px solid #A7F3D0' : '1px solid #FCA5A5',
                      borderRadius: '8px',
                      padding: '0.75rem 1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: '0.5rem'
                    }}
                  >
                    <div style={{ flex: 1 }}>
                      <strong style={{ fontSize: '0.92rem', color: r.waUrl ? '#065F46' : '#991B1B', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                        {r.waUrl ? <CheckCircle2 size={16} color="#059669" /> : <XCircle size={16} color="#DC2626" />}
                        {r.studentName}
                      </strong>
                      <span style={{ fontSize: '0.8rem', color: r.waUrl ? '#047857' : '#B91C1C', display: 'block', marginTop: '0.2rem' }}>
                        Phone: <strong>{r.phone || 'N/A'}</strong>
                      </span>
                    </div>

                    {r.waUrl ? (
                      <a
                        href={r.waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="teacher-btn"
                        style={{
                          background: '#25D366',
                          color: '#FFFFFF',
                          border: 'none',
                          padding: '0.35rem 0.75rem',
                          borderRadius: '6px',
                          fontSize: '0.8rem',
                          fontWeight: 700,
                          textDecoration: 'none',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        <Smartphone size={14} /> Send WhatsApp
                      </a>
                    ) : (
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '12px',
                          background: '#DC2626',
                          color: '#FFFFFF'
                        }}
                      >
                        No Mobile
                      </span>
                    )}
                  </div>
                ))}
              </div>

              <div className="teacher-modal-actions">
                {(waSummaryResult.results || []).some(r => r.waUrl) && (
                  <button
                    type="button"
                    className="teacher-btn"
                    onClick={() => {
                      (waSummaryResult.results || []).forEach((r) => {
                        if (r.waUrl) window.open(r.waUrl, '_blank');
                      });
                    }}
                    style={{
                      background: 'linear-gradient(135deg, #25D366 0%, #128C7E 100%)',
                      color: '#FFFFFF',
                      border: 'none',
                      fontWeight: 700,
                      padding: '0.65rem 1.15rem'
                    }}
                  >
                    <Send size={16} /> Open All WhatsApp Chats
                  </button>
                )}

                <button
                  className="teacher-btn-submit"
                  onClick={() => setWaSummaryModalOpen(false)}
                >
                  Done
                </button>
              </div>

            </div>
          </TeacherModal>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherTests;
