import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Award, Plus, Search, Filter, RotateCcw, Eye, Edit3, Trash2, Calendar, BookOpen, User, CheckCircle2, AlertCircle, Loader2, X, Check, Save } from 'lucide-react';
import { getTestsAPI, getTestByIdAPI, createTestAPI, updateTestAPI, deleteTestAPI, getResultsByTestAPI, createResultsAPI, getTeachersAPI, getStudentsAPI } from '../../services/api';
import '../../styles/admin/results.css';

const STANDARDS_LIST = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th', 'Navodaya'];
const SUBJECTS_LIST = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology'];

const MarksResults = () => {
  // Navigation Tabs: 'tests' | 'student'
  const [activeTab, setActiveTab] = useState('tests');

  // Data Lists
  const [tests, setTests] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [students, setStudents] = useState([]);

  // Search & Filter States
  const [selectedStandard, setSelectedStandard] = useState('All Standards');
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedTeacherFilter, setSelectedTeacherFilter] = useState('All Teachers');
  const [searchQuery, setSearchQuery] = useState('');
  const [studentSearchQuery, setStudentSearchQuery] = useState('');

  // UI Feedback
  const [loading, setLoading] = useState(true);
  const [toastMessage, setToastMessage] = useState('');
  const [apiError, setApiError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // SINGLE MUTUALLY EXCLUSIVE ACTION STATE FOR CENTERED REACT PORTAL MODALS
  // activeAction: null | 'create' | 'view' | 'edit' | 'delete' | 'enterMarks'
  const [activeAction, setActiveAction] = useState(null);
  const [selectedTest, setSelectedTest] = useState(null);
  const [testResults, setTestResults] = useState([]);

  // Form State for Create / Edit Test
  const [formData, setFormData] = useState({
    title: 'Weekly Unit Test 1',
    standard: '10th',
    subject: 'Mathematics',
    teacher: '',
    testDate: new Date().toISOString().split('T')[0],
    totalMarks: 50,
    description: ''
  });

  // Marks Entry Form State { studentId: marksObtained }
  const [marksEntryMap, setMarksEntryMap] = useState({});

  // Lock background body scrolling when any modal is active
  useEffect(() => {
    if (activeAction) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [activeAction]);

  // Toast Helper
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(''), 3500);
  };

  // Close Active Action Modal
  const closeActionModal = () => {
    setActiveAction(null);
    setSelectedTest(null);
    setTestResults([]);
    setActionLoading(false);
  };

  // 1. Fetch Teachers List for selection
  useEffect(() => {
    const fetchTeachersList = async () => {
      try {
        const res = await getTeachersAPI();
        if (res.success && res.teachers) {
          setTeachers(res.teachers);
          if (res.teachers.length > 0) {
            setFormData(prev => ({ ...prev, teacher: res.teachers[0]._id || res.teachers[0].id }));
          }
        }
      } catch (err) {
        console.warn('Teachers fetch notice:', err.message);
      }
    };
    fetchTeachersList();
  }, []);

  // 2. Fetch Tests from MongoDB (GET /api/tests)
  const fetchTestsList = useCallback(async (std, subj, teacherId, searchQ) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getTestsAPI({
        standard: std !== 'All Standards' ? std : undefined,
        subject: subj !== 'All Subjects' ? subj : undefined,
        teacher: teacherId !== 'All Teachers' ? teacherId : undefined,
        search: searchQ
      });

      if (res.success) {
        setTests(res.tests || []);
      } else {
        setApiError('Unable to load tests from MongoDB.');
      }
    } catch (err) {
      setApiError('Unable to load tests from MongoDB.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Auto Fetch Tests
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTestsList(selectedStandard, selectedSubject, selectedTeacherFilter, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedStandard, selectedSubject, selectedTeacherFilter, searchQuery, fetchTestsList]);

  // ACTION 1: OPEN CREATE TEST MODAL
  const handleOpenCreate = () => {
    setActiveAction('create');
    setSelectedTest(null);
    const defaultTeacherId = teachers.length > 0 ? (teachers[0]._id || teachers[0].id) : '';
    setFormData({
      title: 'Weekly Unit Test 1',
      standard: '10th',
      subject: 'Mathematics',
      teacher: defaultTeacherId,
      testDate: new Date().toISOString().split('T')[0],
      totalMarks: 50,
      description: ''
    });
  };

  // ACTION 2: OPEN VIEW RESULTS CENTERED MODAL (GET /api/results/test/:testId)
  const handleOpenViewResults = async (testItem) => {
    setActiveAction('view');
    setSelectedTest(testItem);
    setActionLoading(true);

    try {
      const targetId = testItem._id || testItem.id;
      const res = await getResultsByTestAPI(targetId);

      if (res.success) {
        setTestResults(res.results || []);
        if (res.test) {
          setSelectedTest(res.test);
        }
      }
    } catch (err) {
      console.warn('Test results fetch notice:', err.message);
      setTestResults([]);
    } finally {
      setActionLoading(false);
    }
  };

  // ACTION 3: OPEN EDIT TEST MODAL
  const handleOpenEdit = async (testItem) => {
    setActiveAction('edit');
    setSelectedTest(testItem);
    setActionLoading(true);

    const targetId = testItem._id || testItem.id;
    try {
      const res = await getTestByIdAPI(targetId);
      const data = (res.success && res.test) ? res.test : testItem;
      setSelectedTest(data);

      const tId = (data.teacher && typeof data.teacher === 'object') ? (data.teacher._id || data.teacher.id) : (data.teacher || '');

      setFormData({
        title: data.title || '',
        standard: data.standard || '10th',
        subject: data.subject || 'Mathematics',
        teacher: tId,
        testDate: data.testDate ? new Date(data.testDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        totalMarks: data.totalMarks || 50,
        description: data.description || ''
      });
    } catch (err) {
      const tId = (testItem.teacher && typeof testItem.teacher === 'object') ? (testItem.teacher._id || testItem.teacher.id) : (testItem.teacher || '');
      setFormData({
        title: testItem.title || '',
        standard: testItem.standard || '10th',
        subject: testItem.subject || 'Mathematics',
        teacher: tId,
        testDate: testItem.testDate ? new Date(testItem.testDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        totalMarks: testItem.totalMarks || 50,
        description: testItem.description || ''
      });
    } finally {
      setActionLoading(false);
    }
  };

  // ACTION 4: OPEN ENTER MARKS MODAL FOR A TEST
  const handleOpenEnterMarks = async (testItem) => {
    setActiveAction('enterMarks');
    setSelectedTest(testItem);
    setActionLoading(true);

    try {
      // 1. Fetch Students in class
      const stdRes = await getStudentsAPI({ standard: testItem.standard });
      const studentList = (stdRes.success && stdRes.students) ? stdRes.students : [];
      setStudents(studentList);

      // 2. Fetch existing results
      const targetId = testItem._id || testItem.id;
      const res = await getResultsByTestAPI(targetId);
      const existingResults = (res.success && res.results) ? res.results : [];

      const initialMarks = {};
      studentList.forEach(s => {
        const sId = s._id || s.id;
        const record = existingResults.find(r => (r.student && (r.student._id === sId || r.student.id === sId || r.student === sId)));
        initialMarks[sId] = record ? record.marksObtained : 0;
      });

      setMarksEntryMap(initialMarks);
    } catch (err) {
      console.warn('Enter marks setup notice:', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // ACTION 5: OPEN DELETE CONFIRMATION MODAL
  const handleOpenDelete = (testItem) => {
    setActiveAction('delete');
    setSelectedTest(testItem);
  };

  // Submit Create Test (POST /api/tests)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.teacher) {
      alert('Please fill in required fields (Test Title, Assigned Teacher).');
      return;
    }

    setIsSubmitting(true);
    setApiError('');

    try {
      const payload = {
        title: formData.title.trim(),
        standard: formData.standard,
        subject: formData.subject,
        teacher: formData.teacher,
        testDate: formData.testDate,
        totalMarks: Number(formData.totalMarks),
        description: formData.description.trim()
      };

      const res = await createTestAPI(payload);

      if (res.success) {
        showToast('Test created successfully in MongoDB.');
        closeActionModal();
        fetchTestsList(selectedStandard, selectedSubject, selectedTeacherFilter, searchQuery);
      } else {
        setApiError(res.message || 'Unable to create test.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to create test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Edit Test (PUT /api/tests/:id)
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const targetId = selectedTest._id || selectedTest.id;
      const updatePayload = {
        title: formData.title.trim(),
        standard: formData.standard,
        subject: formData.subject,
        teacher: formData.teacher,
        testDate: formData.testDate,
        totalMarks: Number(formData.totalMarks),
        description: formData.description.trim()
      };

      const res = await updateTestAPI(targetId, updatePayload);

      if (res.success) {
        showToast('Test updated successfully.');
        closeActionModal();
        fetchTestsList(selectedStandard, selectedSubject, selectedTeacherFilter, searchQuery);
      } else {
        setApiError(res.message || 'Unable to update test.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to update test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit Marks Entry (POST /api/results)
  const handleSaveMarksSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTest) return;

    setIsSubmitting(true);
    setApiError('');

    try {
      const targetId = selectedTest._id || selectedTest.id;
      const totalM = selectedTest.totalMarks;

      const resultsPayload = {
        test: targetId,
        results: students.map(s => {
          const sId = s._id || s.id;
          const marks = Number(marksEntryMap[sId] || 0);
          if (marks > totalM) {
            throw new Error('Marks for ' + s.name + ' (' + marks + ') cannot exceed total marks (' + totalM + ').');
          }
          return {
            student: sId,
            marksObtained: marks
          };
        })
      };

      const res = await createResultsAPI(resultsPayload);

      if (res.success) {
        showToast('Student marks and competition ranks saved successfully.');
        closeActionModal();
        fetchTestsList(selectedStandard, selectedSubject, selectedTeacherFilter, searchQuery);
      } else {
        setApiError(res.message || 'Unable to save student marks.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to save student marks.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Confirm Delete Test (DELETE /api/tests/:id)
  const handleDeleteConfirm = async () => {
    if (!selectedTest) return;
    setIsSubmitting(true);
    setApiError('');

    try {
      const targetId = selectedTest._id || selectedTest.id;
      const res = await deleteTestAPI(targetId);

      if (res.success) {
        showToast('Test and associated student results deleted successfully.');
        closeActionModal();
        fetchTestsList(selectedStandard, selectedSubject, selectedTeacherFilter, searchQuery);
      } else {
        setApiError(res.message || 'Unable to delete test.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to delete test.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedStandard('All Standards');
    setSelectedSubject('All Subjects');
    setSelectedTeacherFilter('All Teachers');
    setSearchQuery('');
  };

  return (
    <AdminLayout>
      <div className="results-container">
        {/* Top Header Bar & Create Test Button */}
        <div className="results-top-bar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 className="results-heading">Marks & Results Management</h1>
            <p className="results-subtitle">
              Manage class tests, enter student marks, and view competition rank results.
            </p>
          </div>

          <button className="btn-act-view" onClick={handleOpenCreate} style={{ background: '#1F2937', color: '#FBBF24', border: '1px solid #C9A227', padding: '0.65rem 1.25rem', fontSize: '0.92rem', fontWeight: 700 }}>
            <Plus size={18} inline style={{ marginRight: '4px' }} /> Create Test
          </button>
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

        {/* Navigation Tabs */}
        <div className="results-tabs-bar">
          <button
            className={"res-tab-btn " + (activeTab === 'tests' ? 'active' : '')}
            onClick={() => setActiveTab('tests')}
          >
            Class Tests & Result Reports
          </button>
        </div>

        {/* ==================================================
            TAB 1: CLASS TESTS LIST
            ================================================== */}
        {activeTab === 'tests' && (
          <div>
            {/* Search & Filter Card */}
            <div className="res-filter-card">
              <input
                type="text"
                placeholder="Search Test Name / Subject / Teacher..."
                className="res-search-input"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />

              <select
                className="res-select-filter"
                value={selectedStandard}
                onChange={(e) => setSelectedStandard(e.target.value)}
              >
                <option value="All Standards">Class ▼</option>
                {STANDARDS_LIST.map(std => (
                  <option key={std} value={std}>{std} Class</option>
                ))}
              </select>

              <select
                className="res-select-filter"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
              >
                <option value="All Subjects">Subject ▼</option>
                {SUBJECTS_LIST.map(sub => (
                  <option key={sub} value={sub}>{sub}</option>
                ))}
              </select>

              <select
                className="res-select-filter"
                value={selectedTeacherFilter}
                onChange={(e) => setSelectedTeacherFilter(e.target.value)}
              >
                <option value="All Teachers">Teacher ▼</option>
                {teachers.map(t => (
                  <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
                ))}
              </select>

              <button className="res-select-filter" onClick={handleClearFilters} style={{ minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
                <RotateCcw size={16} /> Clear
              </button>
            </div>

            {/* Test Table Card - Grouped Class-Wise & Subject-Wise */}
            {loading ? (
              <div className="res-table-card" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <Loader2 size={36} className="spin-icon" color="#C9A227" style={{ margin: '0 auto 0.5rem auto' }} />
                <div style={{ color: '#666', fontWeight: 600 }}>Loading tests from database...</div>
              </div>
            ) : tests.length > 0 ? (
              (() => {
                // 1. Sort tests descending by date (latest test first at top)
                const sortedTests = [...tests].sort((a, b) => new Date(b.testDate) - new Date(a.testDate));

                // 2. Group sorted tests by Class standard and Subject
                const groupedByClass = sortedTests.reduce((acc, t) => {
                  const std = t.standard || 'Other';
                  const subj = t.subject || 'General';
                  if (!acc[std]) acc[std] = {};
                  if (!acc[std][subj]) acc[std][subj] = [];
                  acc[std][subj].push(t);
                  return acc;
                }, {});

                // 3. Sort Class keys by STANDARDS_LIST order
                const sortedClassKeys = Object.keys(groupedByClass).sort((a, b) => {
                  const idxA = STANDARDS_LIST.indexOf(a);
                  const idxB = STANDARDS_LIST.indexOf(b);
                  if (idxA !== -1 && idxB !== -1) return idxA - idxB;
                  if (idxA !== -1) return -1;
                  if (idxB !== -1) return 1;
                  return a.localeCompare(b);
                });

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {sortedClassKeys.map((stdKey) => {
                      const classSubjectsMap = groupedByClass[stdKey];
                      const subjectKeys = Object.keys(classSubjectsMap).sort();
                      const totalClassTests = subjectKeys.reduce((sum, subj) => sum + classSubjectsMap[subj].length, 0);

                      return (
                        <div key={stdKey} className="res-table-card" style={{ border: '1px solid #E2DBD0', borderRadius: '8px', overflow: 'hidden' }}>
                          {/* Class Standard Header */}
                          <div style={{ padding: '1rem 1.5rem', background: '#1F2937', color: '#FFF', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ fontSize: '1.15rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                              <BookOpen size={20} color="#FBBF24" />
                              <span>{stdKey} Class Assessments</span>
                            </div>
                            <span style={{ background: '#FBBF24', color: '#111827', padding: '0.25rem 0.75rem', borderRadius: '12px', fontSize: '0.85rem', fontWeight: 900 }}>
                              {totalClassTests} {totalClassTests === 1 ? 'Test' : 'Tests'} Conducted
                            </span>
                          </div>

                          {/* Subject Columns Grid Inside Class */}
                          <div style={{ padding: '1.25rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.25rem', background: '#FAFAFA' }}>
                            {subjectKeys.map((subjKey) => {
                              const subjectTests = classSubjectsMap[subjKey]; // Already sorted latest first

                              return (
                                <div key={subjKey} style={{ background: '#FFFFFF', border: '1px solid #E5E7EB', borderRadius: '8px', overflow: 'hidden', boxShadow: '0 2px 6px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column' }}>
                                  {/* Subject Column Header */}
                                  <div style={{ padding: '0.85rem 1.15rem', background: '#F8F5EC', borderBottom: '2px solid #C9A227', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <div style={{ fontSize: '1rem', fontWeight: 900, color: '#171717', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                                      <Award size={18} color="#C9A227" />
                                      <span>{subjKey}</span>
                                    </div>
                                    <span style={{ background: '#1F2937', color: '#FBBF24', padding: '0.2rem 0.65rem', borderRadius: '12px', fontSize: '0.78rem', fontWeight: 900 }}>
                                      {subjectTests.length} {subjectTests.length === 1 ? 'Test' : 'Tests'} Total
                                    </span>
                                  </div>

                                  {/* Subject Column Test List */}
                                  <div style={{ flex: 1, padding: '0.75rem', overflowX: 'auto' }}>
                                    <table className="res-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                                      <thead>
                                        <tr style={{ background: '#F3F4F6' }}>
                                          <th style={{ padding: '0.5rem', fontSize: '0.8rem', textAlign: 'left' }}>Test Title</th>
                                          <th style={{ padding: '0.5rem', fontSize: '0.8rem', textAlign: 'left' }}>Teacher</th>
                                          <th style={{ padding: '0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>Date</th>
                                          <th style={{ padding: '0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>Marks</th>
                                          <th style={{ padding: '0.5rem', fontSize: '0.8rem', textAlign: 'center' }}>Action</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {subjectTests.map((t) => {
                                          const teacherName = (t.teacher && typeof t.teacher === 'object') ? t.teacher.name : 'Faculty';
                                          const formattedDate = t.testDate ? new Date(t.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

                                          return (
                                            <tr key={t._id || t.id} style={{ borderBottom: '1px solid #F3F4F6' }}>
                                              <td style={{ padding: '0.55rem 0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#111' }}>{t.title}</td>
                                              <td style={{ padding: '0.55rem 0.4rem', fontSize: '0.8rem', color: '#4B5563' }}>{teacherName}</td>
                                              <td style={{ padding: '0.55rem 0.4rem', fontSize: '0.78rem', textAlign: 'center', color: '#374151', whiteSpace: 'nowrap' }}>{formattedDate}</td>
                                              <td style={{ padding: '0.55rem 0.4rem', fontSize: '0.82rem', fontWeight: 800, textAlign: 'center', color: '#B45309' }}>{t.totalMarks}</td>
                                              <td style={{ padding: '0.55rem 0.4rem', textAlign: 'center' }}>
                                                <button
                                                  className="btn-act-view"
                                                  onClick={() => handleOpenViewResults(t)}
                                                  style={{ background: '#1F2937', color: '#FBBF24', border: '1px solid #C9A227', padding: '0.3rem 0.65rem', fontSize: '0.75rem', fontWeight: 700, borderRadius: '4px', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px', whiteSpace: 'nowrap' }}
                                                >
                                                  <Eye size={12} /> Results
                                                </button>
                                              </td>
                                            </tr>
                                          );
                                        })}
                                      </tbody>
                                    </table>
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()
            ) : (
              <div className="res-table-card" style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                <Award size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
                <div style={{ color: '#666', fontWeight: 600, fontSize: '0.95rem' }}>No test records found in database.</div>
              </div>
            )}
          </div>
        )}

        {/* ==================================================
            CRITICAL REQUIREMENT: CENTERED FIXED MODALS (PORTAL ON DOCUMENT.BODY)
            ================================================== */}

        {/* MODAL 1: VIEW TEST RESULTS CENTERED MODAL */}
        {activeAction === 'view' && selectedTest && ReactDOM.createPortal(
          <div
            className="results-modal-overlay"
            onClick={closeActionModal}
          >
            <div
              className="results-modal"
              style={{ border: '2px solid #C9A227', borderRadius: '8px', padding: '1.75rem', boxShadow: '0 25px 60px rgba(0,0,0,0.5)' }}
              onClick={e => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #C9A227', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.35rem', color: '#171717', fontWeight: 900, margin: 0 }}>
                    View Test Results
                  </h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    Competition Rank Report
                  </span>
                </div>
                <button
                  onClick={closeActionModal}
                  style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Test Header Info Card */}
              <div className="test-detail-header-card">
                <div className="info-item">
                  <label>Test Name</label>
                  <span>{selectedTest.title}</span>
                </div>
                <div className="info-item">
                  <label>Class</label>
                  <span>{selectedTest.standard} Class</span>
                </div>
                <div className="info-item">
                  <label>Subject</label>
                  <span>{selectedTest.subject}</span>
                </div>
                <div className="info-item">
                  <label>Teacher</label>
                  <span style={{ color: '#B45309', fontWeight: 700 }}>
                    {(selectedTest.teacher && typeof selectedTest.teacher === 'object') ? selectedTest.teacher.name : 'Faculty'}
                  </span>
                </div>
                <div className="info-item">
                  <label>Date</label>
                  <span>
                    {selectedTest.testDate ? new Date(selectedTest.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}
                  </span>
                </div>
                <div className="info-item">
                  <label>Total Marks</label>
                  <span>{selectedTest.totalMarks}</span>
                </div>
              </div>

              {/* Student Results Table */}
              {actionLoading ? (
                <div style={{ padding: '2.5rem 1rem', textAlign: 'center' }}>
                  <Loader2 size={36} className="spin-icon" color="#C9A227" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div style={{ color: '#666', fontWeight: 600 }}>Fetching student marks and competition ranks...</div>
                </div>
              ) : testResults.length > 0 ? (
                (() => {
                  // Sort descending by marks and compute dynamic rank (equal marks = equal rank)
                  const sortedAndRankedResults = (() => {
                    const sorted = [...testResults].sort((a, b) => Number(b.marksObtained || 0) - Number(a.marksObtained || 0));
                    let rank = 0;
                    let prevMarks = null;
                    return sorted.map((item) => {
                      const marks = Number(item.marksObtained || 0);
                      if (marks !== prevMarks) {
                        rank++;
                        prevMarks = marks;
                      }
                      return { ...item, calculatedRank: rank };
                    });
                  })();

                  return (
                    <div style={{ border: '1px solid #E2DBD0', borderRadius: '6px', overflow: 'hidden' }}>
                      <table className="res-table">
                        <thead>
                          <tr>
                            <th style={{ width: '100px' }}>Roll No</th>
                            <th>Student Name</th>
                            <th style={{ textAlign: 'center' }}>Marks</th>
                            <th style={{ textAlign: 'center' }}>Rank</th>
                          </tr>
                        </thead>
                        <tbody>
                          {sortedAndRankedResults.map((r) => {
                            const sObj = (r.student && typeof r.student === 'object') ? r.student : null;

                            return (
                              <tr key={r._id || r.id}>
                                <td className="att-roll-cell">{sObj ? (sObj.rollNo || 'N/A') : 'N/A'}</td>
                                <td className="att-name-cell">{sObj ? sObj.name : 'Student'}</td>
                                <td style={{ fontWeight: 800, color: '#111', textAlign: 'center' }}>
                                  {r.marksObtained} / {selectedTest.totalMarks}
                                </td>
                                <td style={{ textAlign: 'center' }}>
                                  <span className={"res-rank-badge " + (r.calculatedRank === 1 ? 'top-1' : '')}>
                                    Rank {r.calculatedRank}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  );
                })()
              ) : (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', background: '#F8F5EC', borderRadius: '6px', border: '1px solid #E2DBD0', color: '#666', fontWeight: 600 }}>
                  No student marks entered for this test yet.
                </div>
              )}

              <div style={{ textAlign: 'center', marginTop: '1.5rem' }}>
                <button className="save-att-btn" onClick={closeActionModal} style={{ padding: '0.55rem 2.5rem', background: '#1F2937', color: '#FBBF24', border: '1px solid #C9A227' }}>
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 2: CREATE TEST CENTERED MODAL */}
        {activeAction === 'create' && ReactDOM.createPortal(
          <div className="results-modal-overlay" onClick={closeActionModal}>
            <div className="results-modal" style={{ border: '2px solid #C9A227', borderRadius: '8px', padding: '1.5rem', maxWidth: '620px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #C9A227', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#171717', fontWeight: 900, margin: 0 }}>Create New Test</h3>
                <button onClick={closeActionModal} style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}>
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Test Name / Title *</label>
                  <input
                    type="text"
                    required
                    style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="e.g. Weekly Unit Test 1"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Class / Standard *</label>
                    <select
                      className="res-select-filter"
                      style={{ width: '100%' }}
                      value={formData.standard}
                      onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                    >
                      {STANDARDS_LIST.map(std => (
                        <option key={std} value={std}>{std} Class</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Subject *</label>
                    <select
                      className="res-select-filter"
                      style={{ width: '100%' }}
                      value={formData.subject}
                      onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                    >
                      {SUBJECTS_LIST.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Assigned Teacher *</label>
                  <select
                    className="res-select-filter"
                    style={{ width: '100%' }}
                    value={formData.teacher}
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                    required
                  >
                    {teachers.map(t => (
                      <option key={t._id || t.id} value={t._id || t.id}>
                        {t.name} ({Array.isArray(t.subjects) ? t.subjects.join(', ') : 'Faculty'})
                      </option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Test Date *</label>
                    <input
                      type="date"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.testDate}
                      onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Total Marks *</label>
                    <input
                      type="number"
                      required
                      min="1"
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.totalMarks}
                      onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.55rem 1.25rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                    Cancel
                  </button>
                  <button type="submit" className="btn-act-view" disabled={isSubmitting} style={{ background: '#1F2937', color: '#FBBF24', border: '1px solid #C9A227' }}>
                    {isSubmitting ? 'Creating...' : 'Create Test'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 3: EDIT TEST CENTERED MODAL */}
        {activeAction === 'edit' && selectedTest && ReactDOM.createPortal(
          <div className="results-modal-overlay" onClick={closeActionModal}>
            <div className="results-modal" style={{ border: '2px solid #C9A227', borderRadius: '8px', padding: '1.5rem', maxWidth: '620px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #C9A227', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#7A5B0B', fontWeight: 900, margin: 0 }}>Edit Test Details</h3>
                <button onClick={closeActionModal} style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}>
                  <X size={18} />
                </button>
              </div>

              {actionLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Loader2 size={36} className="spin-icon" color="#7A5B0B" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>Loading test details...</div>
                </div>
              ) : (
                <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Test Name / Title *</label>
                    <input
                      type="text"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Class / Standard *</label>
                      <select
                        className="res-select-filter"
                        style={{ width: '100%' }}
                        value={formData.standard}
                        onChange={(e) => setFormData({ ...formData, standard: e.target.value })}
                      >
                        {STANDARDS_LIST.map(std => (
                          <option key={std} value={std}>{std} Class</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Subject *</label>
                      <select
                        className="res-select-filter"
                        style={{ width: '100%' }}
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                      >
                        {SUBJECTS_LIST.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Assigned Teacher *</label>
                    <select
                      className="res-select-filter"
                      style={{ width: '100%' }}
                      value={formData.teacher}
                      onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                      required
                    >
                      {teachers.map(t => (
                        <option key={t._id || t.id} value={t._id || t.id}>
                          {t.name} ({Array.isArray(t.subjects) ? t.subjects.join(', ') : 'Faculty'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Test Date *</label>
                      <input
                        type="date"
                        required
                        style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                        value={formData.testDate}
                        onChange={(e) => setFormData({ ...formData, testDate: e.target.value })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Total Marks *</label>
                      <input
                        type="number"
                        required
                        min="1"
                        style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                        value={formData.totalMarks}
                        onChange={(e) => setFormData({ ...formData, totalMarks: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="button" onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.55rem 1.25rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-act-view" disabled={isSubmitting} style={{ background: '#C9A227', color: '#080808' }}>
                      {isSubmitting ? 'Updating...' : 'Update Test'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 4: ENTER MARKS CENTERED MODAL */}
        {activeAction === 'enterMarks' && selectedTest && ReactDOM.createPortal(
          <div className="results-modal-overlay" onClick={closeActionModal}>
            <div className="results-modal" style={{ border: '2px solid #10B981', borderRadius: '8px', padding: '1.5rem', maxWidth: '650px', width: '95%' }} onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #10B981', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#065F46', fontWeight: 900, margin: 0 }}>Enter Student Marks</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    {selectedTest.title} ({selectedTest.standard} Class - {selectedTest.subject}) | Total Marks: {selectedTest.totalMarks}
                  </span>
                </div>
                <button onClick={closeActionModal} style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}>
                  <X size={18} />
                </button>
              </div>

              {actionLoading ? (
                <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
                  <Loader2 size={36} className="spin-icon" color="#10B981" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>Loading students for marks entry...</div>
                </div>
              ) : (
                <form onSubmit={handleSaveMarksSubmit}>
                  {students.length > 0 ? (
                    <table className="res-table" style={{ marginBottom: '1.25rem' }}>
                      <thead>
                        <tr>
                          <th>Roll No</th>
                          <th>Student Name</th>
                          <th style={{ textAlign: 'center' }}>Marks Obtained (Max: {selectedTest.totalMarks})</th>
                        </tr>
                      </thead>
                      <tbody>
                        {students.map((s) => {
                          const sId = s._id || s.id;
                          const currentM = marksEntryMap[sId] !== undefined ? marksEntryMap[sId] : 0;

                          return (
                            <tr key={sId}>
                              <td className="att-roll-cell">{s.rollNo || 'N/A'}</td>
                              <td className="att-name-cell">{s.name}</td>
                              <td style={{ textAlign: 'center' }}>
                                <input
                                  type="number"
                                  min="0"
                                  max={selectedTest.totalMarks}
                                  required
                                  style={{ width: '90px', padding: '0.4rem 0.6rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.95rem', fontWeight: 800, textAlign: 'center', color: '#1E3A8A' }}
                                  value={currentM}
                                  onChange={(e) => setMarksEntryMap({ ...marksEntryMap, [sId]: e.target.value })}
                                />
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  ) : (
                    <div style={{ padding: '1.5rem', textAlign: 'center', background: '#F8F5EC', borderRadius: '6px', border: '1px solid #E2DBD0', color: '#666', fontWeight: 600, marginBottom: '1rem' }}>
                      No students found in {selectedTest.standard} Class.
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.55rem 1.25rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                      Cancel
                    </button>
                    <button type="submit" className="btn-act-view" disabled={isSubmitting} style={{ background: '#10B981', color: '#FFF' }}>
                      {isSubmitting ? 'Saving Marks...' : 'Save Marks & Ranks'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 5: DELETE CONFIRMATION CENTERED MODAL */}
        {activeAction === 'delete' && selectedTest && ReactDOM.createPortal(
          <div className="results-modal-overlay" onClick={closeActionModal}>
            <div style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #EF4444', padding: '1.5rem', maxWidth: '420px', width: '90%', textAlign: 'center', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
              <Trash2 size={46} color="#EF4444" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.3rem', color: '#171717', fontWeight: 900, marginBottom: '0.4rem' }}>
                Delete Test Entry
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', marginBottom: '1.25rem' }}>
                Are you sure you want to delete this test and its associated student results?
                <br />
                <strong style={{ color: '#171717', fontSize: '1rem', marginTop: '4px', display: 'block' }}>
                  {selectedTest.title} ({selectedTest.standard} Class - {selectedTest.subject})
                </strong>
              </p>

              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                <button onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                  Cancel
                </button>
                <button className="save-att-btn" onClick={handleDeleteConfirm} disabled={isSubmitting} style={{ background: '#DC2626', padding: '0.5rem 1.5rem' }}>
                  {isSubmitting ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </AdminLayout>
  );
};

export default MarksResults;
