import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Search, Filter, RotateCcw, Eye, Edit3, Trash2, Calendar, Clock, X, CheckCircle2, AlertCircle, Loader2, Check, FileText } from 'lucide-react';
import { getBatchesAPI, getBatchByIdAPI, createBatchAPI, updateBatchAPI, deleteBatchAPI, getTeachersAPI } from '../../services/api';
import { SUPPORTED_CLASSES, normalizeSubject } from '../../config/academicConstants';
import '../../styles/admin/batches.css';

const STANDARDS_LIST = SUPPORTED_CLASSES;
const PATTERNS_LIST = ['Monday-Friday', 'Saturday', 'Sunday'];
const TYPES_LIST = ['Regular Class', 'Exam'];

// Helper to convert 24-hour time string ("19:00" or "05:00") to 12-hour AM/PM ("7:00 PM" or "5:00 AM")
const formatTime12Hour = (timeStr) => {
  if (!timeStr) return '';
  const parts = timeStr.split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parts[1];
  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 => 12
  return `${hours}:${minutes} ${ampm}`;
};

// Helper to convert any start time string to total minutes from midnight for morning -> evening sorting
const getStartMinutes = (timeStr) => {
  if (!timeStr) return 0;
  const str = String(timeStr).trim();
  const is12Hr = /AM|PM/i.test(str);
  if (is12Hr) {
    const isPM = /PM/i.test(str);
    const timeOnly = str.replace(/AM|PM/i, '').trim();
    const parts = timeOnly.split(':');
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    if (isPM && hours < 12) hours += 12;
    if (!isPM && hours === 12) hours = 0;
    return hours * 60 + minutes;
  } else {
    const parts = str.split(':');
    const hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    return hours * 60 + minutes;
  }
};

const Batches = ({ layoutWrapper: LayoutComponent = AdminLayout }) => {
  // Batches & Teachers Data Lists
  const [batches, setBatches] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Filter & Search States
  const [selectedStandard, setSelectedStandard] = useState('All Standards');
  const [selectedPattern, setSelectedPattern] = useState('All Patterns');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedTeacher, setSelectedTeacherFilter] = useState('All Teachers');
  const [searchQuery, setSearchQuery] = useState('');

  // Single Action State for Mutually Exclusive Modals (null | 'create' | 'view' | 'edit' | 'delete')
  const [activeAction, setActiveAction] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Form State for Create / Edit
  const [formData, setFormData] = useState({
    standard: '5th',
    subject: 'Science',
    teacher: '',
    schedulePattern: 'Monday-Friday',
    scheduleType: 'Regular Class',
    startTime: '05:00',
    endTime: '06:00'
  });

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

  // Helper to get subjects assigned to a teacher from MongoDB Teacher collection
  const getTeacherSubjects = useCallback((teacherObj) => {
    if (!teacherObj) return [];
    const subjs = Array.isArray(teacherObj.subjects)
      ? teacherObj.subjects
      : (teacherObj.subject ? [teacherObj.subject] : []);
    
    const clean = subjs.map(s => typeof s === 'string' ? s.trim() : s).filter(Boolean);
    return [...new Set(clean)];
  }, []);

  // Handle Assigned Teacher selection -> Auto update Subject
  const handleTeacherChange = (teacherId) => {
    const tObj = teachers.find(t => String(t._id || t.id) === String(teacherId));
    const availableSubjects = getTeacherSubjects(tObj);
    const newSubject = availableSubjects.length > 0 ? availableSubjects[0] : '';

    setFormData(prev => ({
      ...prev,
      teacher: teacherId,
      subject: newSubject
    }));
  };

  // Fetch Teachers list from MongoDB (for dropdown selection)
  useEffect(() => {
    const fetchTeachersList = async () => {
      try {
        const res = await getTeachersAPI();
        if (res.success && res.teachers) {
          setTeachers(res.teachers);
        }
      } catch (err) {
        console.warn('Teacher fetch for batches notice:', err.message);
      }
    };
    fetchTeachersList();
  }, []);

  // Ensure formData.teacher is populated when modal opens and teachers are loaded
  useEffect(() => {
    if (activeAction === 'create' && teachers.length > 0 && !formData.teacher) {
      const firstTeacher = teachers[0];
      const tId = firstTeacher._id || firstTeacher.id;
      const availableSubjs = getTeacherSubjects(firstTeacher);
      setFormData(prev => ({
        ...prev,
        teacher: tId,
        subject: availableSubjs.length > 0 ? availableSubjs[0] : ''
      }));
    }
  }, [activeAction, teachers, formData.teacher, getTeacherSubjects]);

  // Fetch Batches from MongoDB Backend (GET /api/batches)
  const fetchBatchesList = useCallback(async (stdFilter, patternFilt, typeFilt, teacherFilt, searchQ) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getBatchesAPI({
        standard: stdFilter !== 'All Standards' ? stdFilter : undefined,
        schedulePattern: patternFilt !== 'All Patterns' ? patternFilt : undefined,
        scheduleType: typeFilt !== 'All Types' ? typeFilt : undefined,
        teacher: teacherFilt !== 'All Teachers' ? teacherFilt : undefined,
        search: searchQ
      });

      if (res.success) {
        setBatches(res.batches || []);
      } else {
        setApiError('Unable to load class schedule / batches.');
      }
    } catch (err) {
      setApiError('Unable to load class schedule / batches from MongoDB.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Auto Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBatchesList(selectedStandard, selectedPattern, selectedType, selectedTeacher, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedStandard, selectedPattern, selectedType, selectedTeacher, searchQuery, fetchBatchesList]);

  // Show Toast Banner
  const showToast = (msg) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage('');
    }, 3500);
  };

  // Close Active Modal Action
  const closeActionModal = () => {
    setActiveAction(null);
    setSelectedBatch(null);
    setActionLoading(false);
  };

  // Handle Pattern change -> Auto suggest Exam on Sunday
  const handlePatternChange = (pattern) => {
    const isSun = pattern === 'Sunday';
    setFormData(prev => ({
      ...prev,
      schedulePattern: pattern,
      scheduleType: isSun ? 'Exam' : prev.scheduleType
    }));
  };

  // Action 1: OPEN CREATE BATCH MODAL
  const handleOpenCreate = () => {
    setActiveAction('create');
    setSelectedBatch(null);
    const defaultTeacherId = teachers.length > 0 ? (teachers[0]._id || teachers[0].id) : '';
    const defaultTeacherObj = teachers.length > 0 ? teachers[0] : null;
    const availableSubjects = getTeacherSubjects(defaultTeacherObj);
    const defaultSubject = availableSubjects.length > 0 ? availableSubjects[0] : '';

    setFormData({
      standard: '5th',
      subject: defaultSubject,
      teacher: defaultTeacherId,
      schedulePattern: 'Monday-Friday',
      scheduleType: 'Regular Class',
      startTime: '05:00',
      endTime: '06:00'
    });
  };

  // Action 2: OPEN VIEW BATCH MODAL (GET /api/batches/:id)
  const handleOpenView = async (batchItem) => {
    setActiveAction('view');
    setSelectedBatch(batchItem);
    setActionLoading(true);

    try {
      const targetId = batchItem._id || batchItem.id;
      const res = await getBatchByIdAPI(targetId);
      if (res.success && res.batch) {
        setSelectedBatch(res.batch);
      }
    } catch (err) {
      console.warn('Batch view notice:', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action 3: OPEN EDIT BATCH MODAL (GET /api/batches/:id & Pre-fill)
  const handleOpenEdit = async (batchItem) => {
    setActiveAction('edit');
    setSelectedBatch(batchItem);
    setActionLoading(true);

    const targetId = batchItem._id || batchItem.id;
    try {
      const res = await getBatchByIdAPI(targetId);
      const data = (res.success && res.batch) ? res.batch : batchItem;
      setSelectedBatch(data);

      const tId = (data.teacher && typeof data.teacher === 'object') ? (data.teacher._id || data.teacher.id) : (data.teacher || '');
      const tObj = teachers.find(t => (t._id || t.id) === tId) || (typeof data.teacher === 'object' ? data.teacher : null);
      const availableSubjects = getTeacherSubjects(tObj);
      
      let initialSubj = normalizeSubject(data.subject || '');
      if (availableSubjects.length > 0 && !availableSubjects.includes(initialSubj)) {
        initialSubj = availableSubjects[0];
      }

      setFormData({
        standard: data.standard || '5th',
        subject: initialSubj || (availableSubjects.length > 0 ? availableSubjects[0] : ''),
        teacher: tId,
        schedulePattern: data.schedulePattern || (data.day === 'Saturday' ? 'Saturday' : data.day === 'Sunday' ? 'Sunday' : 'Monday-Friday'),
        scheduleType: data.scheduleType || (data.schedulePattern === 'Sunday' ? 'Exam' : 'Regular Class'),
        startTime: data.startTime || '05:00',
        endTime: data.endTime || '06:00'
      });
    } catch (err) {
      const tId = (batchItem.teacher && typeof batchItem.teacher === 'object') ? (batchItem.teacher._id || batchItem.teacher.id) : (batchItem.teacher || '');
      const tObj = teachers.find(t => (t._id || t.id) === tId) || (typeof batchItem.teacher === 'object' ? batchItem.teacher : null);
      const availableSubjects = getTeacherSubjects(tObj);
      let initialSubj = normalizeSubject(batchItem.subject || '');
      if (availableSubjects.length > 0 && !availableSubjects.includes(initialSubj)) {
        initialSubj = availableSubjects[0];
      }

      setFormData({
        standard: batchItem.standard || '5th',
        subject: initialSubj || (availableSubjects.length > 0 ? availableSubjects[0] : ''),
        teacher: tId,
        schedulePattern: batchItem.schedulePattern || 'Monday-Friday',
        scheduleType: batchItem.scheduleType || 'Regular Class',
        startTime: batchItem.startTime || '05:00',
        endTime: batchItem.endTime || '06:00'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action 4: OPEN DELETE CONFIRMATION
  const handleOpenDelete = (batchItem) => {
    setActiveAction('delete');
    setSelectedBatch(batchItem);
  };

  // Submit Create Form (POST /api/batches)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.standard.trim() || !formData.subject.trim() || !formData.teacher) {
      alert('Please fill in all required fields (Standard, Subject/Exam, Teacher).');
      return;
    }

    if (formData.startTime >= formData.endTime) {
      alert('Start time must be earlier than End time.');
      return;
    }

    setIsSubmittingAction(true);
    setApiError('');

    try {
      const payload = {
        standard: formData.standard.trim(),
        subject: formData.subject.trim(),
        teacher: formData.teacher,
        schedulePattern: formData.schedulePattern,
        scheduleType: formData.scheduleType,
        startTime: formData.startTime.trim(),
        endTime: formData.endTime.trim()
      };

      const res = await createBatchAPI(payload);

      if (res.success) {
        showToast('Batch timetable created successfully.');
        closeActionModal();
        fetchBatchesList(selectedStandard, selectedPattern, selectedType, selectedTeacher, searchQuery);
      } else {
        setApiError(res.message || 'Unable to create batch.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to create batch.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit Update Form (PUT /api/batches/:id)
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;

    if (formData.startTime >= formData.endTime) {
      alert('Start time must be earlier than End time.');
      return;
    }

    setIsSubmittingAction(true);
    setApiError('');

    try {
      const targetId = selectedBatch._id || selectedBatch.id;
      const updatePayload = {
        standard: formData.standard.trim(),
        subject: formData.subject.trim(),
        teacher: formData.teacher,
        schedulePattern: formData.schedulePattern,
        scheduleType: formData.scheduleType,
        startTime: formData.startTime.trim(),
        endTime: formData.endTime.trim()
      };

      const res = await updateBatchAPI(targetId, updatePayload);

      if (res.success) {
        showToast('Batch timetable updated successfully.');
        closeActionModal();
        fetchBatchesList(selectedStandard, selectedPattern, selectedType, selectedTeacher, searchQuery);
      } else {
        setApiError(res.message || 'Unable to update batch.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to update batch.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Confirm Delete Action (DELETE /api/batches/:id)
  const handleDeleteConfirm = async () => {
    if (!selectedBatch) return;
    setIsSubmittingAction(true);
    setApiError('');

    try {
      const targetId = selectedBatch._id || selectedBatch.id;
      const res = await deleteBatchAPI(targetId);

      if (res.success) {
        showToast('🗑️ Batch timetable schedule deleted successfully!');
        closeActionModal();
        fetchBatchesList(selectedStandard, selectedPattern, selectedType, selectedTeacher, searchQuery);
      } else {
        setApiError(res.message || 'Unable to delete batch.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to delete batch.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedStandard('All Standards');
    setSelectedPattern('All Patterns');
    setSelectedType('All Types');
    setSelectedTeacherFilter('All Teachers');
    setSearchQuery('');
  };

  return (
    <LayoutComponent>
      <div className="batches-container">
        {/* ==================================================
            1. PAGE HEADER BAR & CREATE NEW BATCH BUTTON
            ================================================== */}
        <div className="batches-top-bar">
          <div>
            <h1 className="batches-heading">Class Batches</h1>
            <p className="batches-subtitle">
              Manage regular classes, Saturday schedules, and Sunday exams
            </p>
          </div>
          <button className="add-schedule-btn" onClick={handleOpenCreate}>
            <Plus size={18} /> + Create New Batch
          </button>
        </div>

        {/* ==================================================
            CLASS PILL TABS NAVIGATION (STRICT ORDER 5th -> 12th)
            ================================================== */}
        <div className="batches-class-tabs-card">
          <span className="batches-tabs-label">Select Class</span>
          <div className="batches-pills-row">
            {STANDARDS_LIST.map((cls) => (
              <button
                key={cls}
                type="button"
                className={`class-pill-btn ${selectedStandard === cls ? 'active' : ''}`}
                onClick={() => setSelectedStandard(cls)}
              >
                {cls}
              </button>
            ))}
            <button
              type="button"
              className={`class-pill-btn ${selectedStandard === 'All Standards' ? 'active' : ''}`}
              onClick={() => setSelectedStandard('All Standards')}
            >
              All Classes
            </button>
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



        {/* ==================================================
            3. SEARCH & FILTERS BAR
            ================================================== */}
        <div className="batches-filter-card">
          <input
            type="text"
            placeholder="Search Subject / Exam / Teacher / Class..."
            style={{ padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', minWidth: '220px' }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />



          <select
            className="b-select-filter"
            value={selectedPattern}
            onChange={(e) => setSelectedPattern(e.target.value)}
          >
            <option value="All Patterns">Schedule ▼</option>
            {PATTERNS_LIST.map((pat) => (
              <option key={pat} value={pat}>{pat}</option>
            ))}
          </select>

          <select
            className="b-select-filter"
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
          >
            <option value="All Types">Type ▼</option>
            {TYPES_LIST.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <select
            className="b-select-filter"
            value={selectedTeacher}
            onChange={(e) => setSelectedTeacherFilter(e.target.value)}
          >
            <option value="All Teachers">Teacher ▼</option>
            {teachers.map((t) => (
              <option key={t._id || t.id} value={t._id || t.id}>{t.name}</option>
            ))}
          </select>

          <button className="add-schedule-btn" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
            <Filter size={16} /> Filter
          </button>

          <button className="b-select-filter" onClick={handleClearFilters} style={{ minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <RotateCcw size={16} /> Clear
          </button>
        </div>

        {/* ==================================================
            4. BATCH TIMETABLE TABLE (SORTED MORNING -> EVENING)
            ================================================== */}
        <div className="batches-table-card">
          <div className="table-header-title">Class Schedule & Batches</div>

          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600 }}>Loading batch schedule from MongoDB...</div>
            </div>
          ) : batches.length > 0 ? (
            <table className="batches-table">
              <thead>
                <tr>
                  <th>Class</th>
                  <th>Subject / Exam</th>
                  <th>Teacher</th>
                  <th>Schedule</th>
                  <th>Type</th>
                  <th>Time</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {[...batches]
                  .sort((a, b) => getStartMinutes(a.startTime) - getStartMinutes(b.startTime))
                  .map((batch) => {
                  const isViewing = activeAction === 'view' && selectedBatch && (selectedBatch._id === batch._id || selectedBatch.id === batch.id);
                  const teacherName = (batch.teacher && typeof batch.teacher === 'object') ? batch.teacher.name : 'Unassigned';
                  const isExam = batch.scheduleType === 'Exam';
                  const displayPattern = batch.schedulePattern || (batch.day === 'Saturday' ? 'Saturday' : batch.day === 'Sunday' ? 'Sunday' : 'Monday-Friday');

                  return (
                    <tr key={batch._id || batch.id}>
                      <td style={{ fontWeight: 800, color: '#111' }}>{batch.standard}</td>
                      <td className="b-subject-cell" style={{ color: isExam ? '#C9A227' : '#1E3A8A' }}>
                        {batch.subject}
                      </td>
                      <td className="b-teacher-cell">{teacherName}</td>
                      <td className="b-days-tag">
                        <span style={{ background: '#F8F5EC', border: '1px solid #D4AF37', padding: '2px 8px', borderRadius: '4px', fontWeight: 700, fontSize: '0.82rem', color: '#171717' }}>
                          {displayPattern}
                        </span>
                      </td>
                      <td>
                        <span
                          style={{
                            background: isExam ? '#FEF3C7' : '#EFF6FF',
                            color: isExam ? '#92400E' : '#1E40AF',
                            border: `1px solid ${isExam ? '#F59E0B' : '#3B82F6'}`,
                            padding: '2px 8px',
                            borderRadius: '3px',
                            fontWeight: 800,
                            fontSize: '0.78rem'
                          }}
                        >
                          {batch.scheduleType || 'Regular Class'}
                        </span>
                      </td>
                      <td>
                        <span className="b-time-badge" style={{ background: '#FFF', fontWeight: 800 }}>
                          {formatTime12Hour(batch.startTime)} - {formatTime12Hour(batch.endTime)}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenView(batch)}
                            style={{ background: isViewing ? '#1D4ED8' : '#233F8F', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            {isViewing ? (
                              <>
                                <Check size={13} /> Viewing
                              </>
                            ) : (
                              <>
                                <Eye size={13} /> View
                              </>
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(batch)}
                            style={{ background: '#C9A227', color: '#080808', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleOpenDelete(batch)}
                            style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Trash2 size={13} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <Calendar size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600, fontSize: '0.95rem' }}>No batch schedule entries found in MongoDB.</div>
            </div>
          )}
        </div>

        {/* ==================================================
            5. MUTUALLY EXCLUSIVE OVERLAY MODALS (PORTALS ON DOCUMENT.BODY)
            ================================================== */}

        {/* MODAL 1: CREATE NEW BATCH MODAL */}
        {activeAction === 'create' && ReactDOM.createPortal(
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
            onClick={closeActionModal}
          >
            <div
              style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #1E3A8A', padding: '1.5rem', maxWidth: '620px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#1E3A8A', fontWeight: 900, margin: 0 }}>Create New Batch</h3>
                <button
                  onClick={closeActionModal}
                  style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Class / Standard *</label>
                    <select
                      className="b-select-filter"
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
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Schedule Pattern *</label>
                    <select
                      className="b-select-filter"
                      style={{ width: '100%' }}
                      value={formData.schedulePattern}
                      onChange={(e) => handlePatternChange(e.target.value)}
                    >
                      {PATTERNS_LIST.map(pat => (
                        <option key={pat} value={pat}>{pat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Schedule Type *</label>
                    <select
                      className="b-select-filter"
                      style={{ width: '100%' }}
                      value={formData.scheduleType}
                      onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                    >
                      {TYPES_LIST.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Assigned Teacher *</label>
                  <select
                    className="b-select-filter"
                    style={{ width: '100%' }}
                    value={formData.teacher}
                    onChange={(e) => handleTeacherChange(e.target.value)}
                    required
                  >
                    {teachers.length > 0 ? (
                      teachers.map(t => (
                        <option key={t._id || t.id} value={t._id || t.id}>
                          {t.name} ({Array.isArray(t.subjects) ? t.subjects.join(', ') : 'Faculty'})
                        </option>
                      ))
                    ) : (
                      <option value="">No teachers available in MongoDB</option>
                    )}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                    {formData.scheduleType === 'Exam' ? 'Exam / Test Subject *' : 'Subject (Auto-populated from Teacher) *'}
                  </label>
                  {(() => {
                    const selectedTeacherObj = teachers.find(t => String(t._id || t.id) === String(formData.teacher));
                    const availableSubjects = getTeacherSubjects(selectedTeacherObj);

                    if (!formData.teacher) {
                      return (
                        <select
                          className="b-select-filter"
                          style={{ width: '100%', background: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' }}
                          disabled
                          value=""
                        >
                          <option value="">-- Select Teacher First --</option>
                        </select>
                      );
                    }

                    if (availableSubjects.length <= 1) {
                      return (
                        <select
                          className="b-select-filter"
                          style={{ width: '100%', background: '#F9FAFB', fontWeight: 700, color: '#111827', cursor: 'not-allowed' }}
                          value={formData.subject}
                          disabled
                        >
                          {availableSubjects.length === 1 ? (
                            <option value={availableSubjects[0]}>{availableSubjects[0]}</option>
                          ) : (
                            <option value="">No subject assigned to teacher</option>
                          )}
                        </select>
                      );
                    }

                    return (
                      <select
                        className="b-select-filter"
                        style={{ width: '100%', fontWeight: 700 }}
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      >
                        {availableSubjects.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Start Time *</label>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E3A8A' }}>
                        {formatTime12Hour(formData.startTime)}
                      </span>
                    </div>
                    <input
                      type="time"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>End Time *</label>
                      <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#1E3A8A' }}>
                        {formatTime12Hour(formData.endTime)}
                      </span>
                    </div>
                    <input
                      type="time"
                      required
                      style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.55rem 1.25rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                    Cancel
                  </button>
                  <button type="submit" className="add-schedule-btn" disabled={isSubmittingAction}>
                    {isSubmittingAction ? 'Creating...' : 'Create Batch'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 2: VIEW BATCH MODAL */}
        {activeAction === 'view' && selectedBatch && ReactDOM.createPortal(
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
            onClick={closeActionModal}
          >
            <div
              style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #1E3A8A', padding: '1.75rem', maxWidth: '560px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#1E3A8A', fontWeight: 900, margin: 0 }}>View Batch Details</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    Class Timetable Schedule
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

              {actionLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>Loading batch details...</div>
                </div>
              ) : (
                <>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Class / Standard:</label>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#1E3A8A' }}>{selectedBatch.standard} Class</div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>
                        {selectedBatch.scheduleType === 'Exam' ? 'Exam Name:' : 'Subject:'}
                      </label>
                      <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#111' }}>{selectedBatch.subject}</div>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ fontSize: '0.8rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Assigned Teacher:</label>
                    <div style={{ fontSize: '1rem', fontWeight: 700, color: '#171717' }}>
                      {(selectedBatch.teacher && typeof selectedBatch.teacher === 'object') ? selectedBatch.teacher.name : 'Unassigned'}
                    </div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', background: '#F8F5EC', padding: '1rem', borderRadius: '6px', border: '1px solid #E2DBD0', marginBottom: '1.25rem' }}>
                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Schedule:</label>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: '#1E3A8A' }}>
                        {selectedBatch.schedulePattern || 'Monday-Friday'}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>Type:</label>
                      <div style={{ fontSize: '0.95rem', fontWeight: 800, color: selectedBatch.scheduleType === 'Exam' ? '#B45309' : '#1D4ED8' }}>
                        {selectedBatch.scheduleType || 'Regular Class'}
                      </div>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.78rem', fontWeight: 800, color: '#666', textTransform: 'uppercase', display: 'block', marginBottom: '2px' }}>12-Hour Time:</label>
                      <div style={{ fontSize: '0.92rem', fontWeight: 800, color: '#059669' }}>
                        {formatTime12Hour(selectedBatch.startTime)} - {formatTime12Hour(selectedBatch.endTime)}
                      </div>
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
                    <button type="button" className="add-schedule-btn" onClick={closeActionModal} style={{ padding: '0.5rem 2.5rem' }}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 3: EDIT BATCH MODAL */}
        {activeAction === 'edit' && selectedBatch && ReactDOM.createPortal(
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
            onClick={closeActionModal}
          >
            <div
              style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #C9A227', padding: '1.5rem', maxWidth: '620px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #C9A227', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#7A5B0B', fontWeight: 900, margin: 0 }}>Edit Batch Schedule</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    Class: <strong style={{ color: '#171717' }}>{selectedBatch.standard} - {selectedBatch.subject}</strong>
                  </span>
                </div>
                <button
                  type="button"
                  onClick={closeActionModal}
                  style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {actionLoading ? (
                <div style={{ textAlign: 'center', padding: '3rem 1rem' }}>
                  <Loader2 size={36} className="spin-icon" color="#7A5B0B" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div>Loading batch details...</div>
                </div>
              ) : (
                <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Class / Standard *</label>
                      <select
                        className="b-select-filter"
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
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Schedule Pattern *</label>
                      <select
                        className="b-select-filter"
                        style={{ width: '100%' }}
                        value={formData.schedulePattern}
                        onChange={(e) => handlePatternChange(e.target.value)}
                      >
                        {PATTERNS_LIST.map(pat => (
                          <option key={pat} value={pat}>{pat}</option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Schedule Type *</label>
                      <select
                        className="b-select-filter"
                        style={{ width: '100%' }}
                        value={formData.scheduleType}
                        onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                      >
                        {TYPES_LIST.map(type => (
                          <option key={type} value={type}>{type}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Assigned Teacher *</label>
                    <select
                      className="b-select-filter"
                      style={{ width: '100%' }}
                      value={formData.teacher}
                      onChange={(e) => handleTeacherChange(e.target.value)}
                      required
                    >
                      {teachers.map(t => (
                        <option key={t._id || t.id} value={t._id || t.id}>
                          {t.name} ({Array.isArray(t.subjects) ? t.subjects.join(', ') : 'Faculty'})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>
                      {formData.scheduleType === 'Exam' ? 'Exam / Test Subject *' : 'Subject (Auto-populated from Teacher) *'}
                    </label>
                    {(() => {
                      const selectedTeacherObj = teachers.find(t => String(t._id || t.id) === String(formData.teacher));
                      const availableSubjects = getTeacherSubjects(selectedTeacherObj);

                      if (!formData.teacher) {
                        return (
                          <select
                            className="b-select-filter"
                            style={{ width: '100%', background: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' }}
                            disabled
                            value=""
                          >
                            <option value="">-- Select Teacher First --</option>
                          </select>
                        );
                      }

                      if (availableSubjects.length <= 1) {
                        return (
                          <select
                            className="b-select-filter"
                            style={{ width: '100%', background: '#F9FAFB', fontWeight: 700, color: '#111827', cursor: 'not-allowed' }}
                            value={formData.subject}
                            disabled
                          >
                            {availableSubjects.length === 1 ? (
                              <option value={availableSubjects[0]}>{availableSubjects[0]}</option>
                            ) : (
                              <option value="">No subject assigned to teacher</option>
                            )}
                          </select>
                        );
                      }

                      return (
                        <select
                          className="b-select-filter"
                          style={{ width: '100%', fontWeight: 700 }}
                          value={formData.subject}
                          onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                          required
                        >
                          {availableSubjects.map((s) => (
                            <option key={s} value={s}>{s}</option>
                          ))}
                        </select>
                      );
                    })()}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>Start Time *</label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7A5B0B' }}>
                          {formatTime12Hour(formData.startTime)}
                        </span>
                      </div>
                      <input
                        type="time"
                        required
                        style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                        value={formData.startTime}
                        onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      />
                    </div>

                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                        <label style={{ fontSize: '0.85rem', fontWeight: 700 }}>End Time *</label>
                        <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#7A5B0B' }}>
                          {formatTime12Hour(formData.endTime)}
                        </span>
                      </div>
                      <input
                        type="time"
                        required
                        style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #C4C4C4', borderRadius: '4px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                        value={formData.endTime}
                        onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="button" onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.55rem 1.25rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                      Cancel
                    </button>
                    <button type="submit" className="add-schedule-btn" disabled={isSubmittingAction} style={{ background: '#C9A227', color: '#080808' }}>
                      {isSubmittingAction ? 'Updating...' : 'Update Batch'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 4: DELETE CONFIRMATION MODAL */}
        {activeAction === 'delete' && selectedBatch && ReactDOM.createPortal(
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
            onClick={closeActionModal}
          >
            <div style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #EF4444', padding: '1.5rem', maxWidth: '420px', width: '90%', textAlign: 'center', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }} onClick={e => e.stopPropagation()}>
              <Trash2 size={46} color="#EF4444" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.3rem', color: '#171717', fontWeight: 900, marginBottom: '0.4rem' }}>
                Delete Batch Schedule
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', marginBottom: '1.25rem' }}>
                Are you sure you want to delete this batch timetable entry?
                <br />
                <strong style={{ color: '#171717', fontSize: '1rem', marginTop: '4px', display: 'block' }}>
                  {selectedBatch.standard} Class - {selectedBatch.subject} ({selectedBatch.schedulePattern || 'Monday-Friday'})
                </strong>
              </p>

              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                <button onClick={closeActionModal} style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', padding: '0.5rem 1.5rem', borderRadius: '4px', fontWeight: 700, cursor: 'pointer', color: '#111' }}>
                  Cancel
                </button>
                <button className="add-schedule-btn" onClick={handleDeleteConfirm} disabled={isSubmittingAction} style={{ background: '#DC2626', padding: '0.5rem 1.5rem' }}>
                  {isSubmittingAction ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </LayoutComponent>
  );
};

export default Batches;
