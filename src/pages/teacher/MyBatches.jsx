import React, { useState, useEffect, useCallback, useContext } from 'react';
import ReactDOM from 'react-dom';
import TeacherLayout from '../../layouts/TeacherLayout';
import { Plus, Search, Filter, RotateCcw, Edit3, Trash2, Calendar, Clock, X, CheckCircle2, AlertCircle, Loader2, Check, UserCheck } from 'lucide-react';
import { getBatchesAPI, getBatchByIdAPI, createBatchAPI, updateBatchAPI, deleteBatchAPI, getAuthenticatedTeacherProfileAPI } from '../../services/api';
import { AuthContext } from '../../context/AuthContext';
import '../../styles/admin/batches.css';
import '../../styles/teacher/teacher-pages.css';

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
  hours = hours ? hours : 12;
  return `${hours}:${minutes} ${ampm}`;
};

const MyBatches = () => {
  const { teacherProfile: contextProfile } = useContext(AuthContext) || {};
  const [teacher, setTeacher] = useState(contextProfile || null);

  // Batches Data
  const [batches, setBatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Filter & Search States
  const [selectedStandardFilter, setSelectedStandardFilter] = useState('All Standards');
  const [selectedPatternFilter, setSelectedPatternFilter] = useState('All Patterns');
  const [selectedTypeFilter, setSelectedTypeFilter] = useState('All Types');
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Action State (null | 'create' | 'edit' | 'delete')
  const [activeAction, setActiveAction] = useState(null);
  const [selectedBatch, setSelectedBatch] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [formError, setFormError] = useState('');

  // Form State
  const [formData, setFormData] = useState({
    standard: '',
    subject: '',
    schedulePattern: 'Monday-Friday',
    scheduleType: 'Regular Class',
    startTime: '05:00',
    endTime: '06:00'
  });

  // Lock body scroll when modal is active
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

  // Fetch teacher profile if not loaded
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await getAuthenticatedTeacherProfileAPI();
        if (res && res.success && res.teacher) {
          setTeacher(res.teacher);
        }
      } catch (err) {
        console.warn('Profile fetch notice in MyBatches:', err.message);
      }
    };
    if (!teacher) {
      fetchProfile();
    }
  }, [teacher]);

  const ALL_STANDARDS = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];
  const ALL_SUBJECTS = ['Mathematics', 'Science', 'English', 'Physics', 'Chemistry', 'Biology'];

  // Derive assigned classes for this teacher (with fallback to all standards)
  const assignedClasses = React.useMemo(() => {
    if (teacher && Array.isArray(teacher.classes) && teacher.classes.length > 0) {
      return teacher.classes;
    }
    if (teacher && Array.isArray(teacher.permissions) && teacher.permissions.length > 0) {
      const clsList = teacher.permissions.map(p => p.class_name).filter(Boolean);
      if (clsList.length > 0) return [...new Set(clsList)];
    }
    return ALL_STANDARDS;
  }, [teacher]);

  // Helper to get subjects for a given selected class
  const getAllowedSubjectsForClass = useCallback((clsName) => {
    if (teacher && Array.isArray(teacher.permissions) && teacher.permissions.length > 0) {
      const allowed = teacher.permissions
        .filter(p => p.class_name === clsName)
        .map(p => p.subject_name)
        .filter(Boolean);
      if (allowed.length > 0) return [...new Set(allowed)];
    }
    if (teacher && Array.isArray(teacher.subjects) && teacher.subjects.length > 0) {
      return teacher.subjects;
    }
    return ALL_SUBJECTS;
  }, [teacher]);

  // Fetch Batches from Backend API
  const fetchBatchesList = useCallback(async (stdFilt, patFilt, typeFilt, searchQ) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getBatchesAPI({
        standard: stdFilt !== 'All Standards' ? stdFilt : undefined,
        schedulePattern: patFilt !== 'All Patterns' ? patFilt : undefined,
        scheduleType: typeFilt !== 'All Types' ? typeFilt : undefined,
        search: searchQ
      });

      if (res.success) {
        setBatches(res.batches || []);
      } else {
        setApiError('Unable to load your timetable batches.');
      }
    } catch (err) {
      setApiError('Unable to load timetable batches from server.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Auto Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchBatchesList(selectedStandardFilter, selectedPatternFilter, selectedTypeFilter, searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [selectedStandardFilter, selectedPatternFilter, selectedTypeFilter, searchQuery, fetchBatchesList]);

  // Show Toast Message
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
    setFormError('');
  };

  // Handle Class selection in modal -> Auto update allowed Subject
  const handleClassChangeInModal = (newClass) => {
    const allowedSubjs = getAllowedSubjectsForClass(newClass);
    const firstSubj = allowedSubjs.length > 0 ? allowedSubjs[0] : '';
    setFormData(prev => ({
      ...prev,
      standard: newClass,
      subject: firstSubj
    }));
  };

  // Handle Pattern change -> Auto suggest Exam on Sunday
  const handlePatternChangeInModal = (pattern) => {
    const isSun = pattern === 'Sunday';
    setFormData(prev => ({
      ...prev,
      schedulePattern: pattern,
      scheduleType: isSun ? 'Exam' : prev.scheduleType
    }));
  };

  // Action 1: OPEN CREATE BATCH MODAL
  const handleOpenCreate = () => {
    setFormError('');
    const defaultClass = assignedClasses.length > 0 ? assignedClasses[0] : '';
    const allowedSubjs = getAllowedSubjectsForClass(defaultClass);
    const defaultSubj = allowedSubjs.length > 0 ? allowedSubjs[0] : 'Mathematics';

    setFormData({
      standard: defaultClass,
      subject: defaultSubj,
      schedulePattern: 'Monday-Friday',
      scheduleType: 'Regular Class',
      startTime: '05:00',
      endTime: '06:00'
    });
    setActiveAction('create');
  };

  // Action 2: OPEN EDIT BATCH MODAL
  const handleOpenEdit = async (batchItem) => {
    setFormError('');
    setActiveAction('edit');
    setSelectedBatch(batchItem);
    setActionLoading(true);

    const targetId = batchItem._id || batchItem.id;
    try {
      const res = await getBatchByIdAPI(targetId);
      const data = (res.success && res.batch) ? res.batch : batchItem;
      setSelectedBatch(data);

      const cls = data.standard || (assignedClasses.length > 0 ? assignedClasses[0] : '');
      const allowedSubjs = getAllowedSubjectsForClass(cls);
      let initialSubj = data.subject || '';
      if (allowedSubjs.length > 0 && !allowedSubjs.includes(initialSubj)) {
        initialSubj = allowedSubjs[0];
      }

      setFormData({
        standard: cls,
        subject: initialSubj || (allowedSubjs.length > 0 ? allowedSubjs[0] : 'Mathematics'),
        schedulePattern: data.schedulePattern || 'Monday-Friday',
        scheduleType: data.scheduleType || 'Regular Class',
        startTime: data.startTime || '05:00',
        endTime: data.endTime || '06:00'
      });
    } catch (err) {
      setFormData({
        standard: batchItem.standard || '',
        subject: batchItem.subject || '',
        schedulePattern: batchItem.schedulePattern || 'Monday-Friday',
        scheduleType: batchItem.scheduleType || 'Regular Class',
        startTime: batchItem.startTime || '05:00',
        endTime: batchItem.endTime || '06:00'
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action 3: OPEN DELETE CONFIRMATION
  const handleOpenDelete = (batchItem) => {
    setFormError('');
    setActiveAction('delete');
    setSelectedBatch(batchItem);
  };

  // Submit Create Form (POST /api/batches)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!formData.standard) {
      setFormError('Please select an assigned class.');
      return;
    }
    if (!formData.subject) {
      setFormError('Please select an authorized subject.');
      return;
    }
    if (formData.startTime >= formData.endTime) {
      setFormError('Start Time must be earlier than End Time.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const payload = {
        standard: formData.standard,
        subject: formData.subject,
        teacher: teacher?.id || teacher?._id || undefined,
        schedulePattern: formData.schedulePattern,
        scheduleType: formData.scheduleType,
        startTime: formData.startTime,
        endTime: formData.endTime
      };

      const res = await createBatchAPI(payload);

      if (res.success) {
        showToast('✅ Timetable batch created successfully!');
        closeActionModal();
        fetchBatchesList(selectedStandardFilter, selectedPatternFilter, selectedTypeFilter, searchQuery);
      } else {
        setFormError(res.message || 'Unable to create timetable batch.');
      }
    } catch (err) {
      setFormError(err.message || 'Unable to create timetable batch.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit Update Form (PUT /api/batches/:id)
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedBatch) return;
    setFormError('');

    if (formData.startTime >= formData.endTime) {
      setFormError('Start Time must be earlier than End Time.');
      return;
    }

    setIsSubmittingAction(true);
    try {
      const targetId = selectedBatch._id || selectedBatch.id;
      const updatePayload = {
        standard: formData.standard,
        subject: formData.subject,
        schedulePattern: formData.schedulePattern,
        scheduleType: formData.scheduleType,
        startTime: formData.startTime,
        endTime: formData.endTime
      };

      const res = await updateBatchAPI(targetId, updatePayload);

      if (res.success) {
        showToast('✅ Timetable batch updated successfully!');
        closeActionModal();
        fetchBatchesList(selectedStandardFilter, selectedPatternFilter, selectedTypeFilter, searchQuery);
      } else {
        setFormError(res.message || 'Unable to update batch.');
      }
    } catch (err) {
      setFormError(err.message || 'Unable to update batch.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Confirm Delete Action (DELETE /api/batches/:id)
  const handleDeleteConfirm = async () => {
    if (!selectedBatch) return;
    setIsSubmittingAction(true);
    setFormError('');

    try {
      const targetId = selectedBatch._id || selectedBatch.id;
      const res = await deleteBatchAPI(targetId);

      if (res.success) {
        showToast('🗑️ Timetable batch deleted successfully!');
        closeActionModal();
        fetchBatchesList(selectedStandardFilter, selectedPatternFilter, selectedTypeFilter, searchQuery);
      } else {
        setFormError(res.message || 'Unable to delete batch.');
      }
    } catch (err) {
      setFormError(err.message || 'Unable to delete batch.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedStandardFilter('All Standards');
    setSelectedPatternFilter('All Patterns');
    setSelectedTypeFilter('All Types');
    setSearchQuery('');
  };

  return (
    <TeacherLayout activePage="batches">
      <div className="teacher-page-container">
        {/* ==================================================
            1. PAGE HEADER BAR & CREATE NEW BATCH BUTTON
            ================================================== */}
        <div className="teacher-welcome-banner" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div className="teacher-welcome-text">
            <h2>My Batches & Timetable 📅</h2>
            <p>Manage your teaching timetable schedules, regular classes, and exam sessions for authorized classes.</p>
          </div>
          <button className="teacher-btn teacher-btn-primary" onClick={handleOpenCreate} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', fontWeight: 800 }}>
            <Plus size={18} /> Add New Batch
          </button>
        </div>

        {/* Toast Notification Banner */}
        {toastMessage && (
          <div style={{ background: '#ECFDF5', border: '1px solid #10B981', color: '#065F46', padding: '0.75rem 1.25rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <CheckCircle2 size={20} />
            <span>{toastMessage}</span>
          </div>
        )}

        {/* API Error Banner */}
        {apiError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.75rem 1.25rem', borderRadius: '8px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
        )}

        {/* ==================================================
            2. TOTAL BATCHES SUMMARY CARD
            ================================================== */}
        <div className="batches-summary-card" style={{ background: '#FFF', borderRadius: '12px', border: '1px solid var(--border-light)', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
          <div className="batches-summary-icon" style={{ background: '#FEF3C7', color: '#D4AF37', width: '54px', height: '54px', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Clock size={28} />
          </div>
          <div className="batches-summary-details">
            <span className="batches-summary-label" style={{ color: '#666', fontSize: '0.85rem', fontWeight: 600 }}>Total Active Batches</span>
            <span className="batches-summary-count" style={{ display: 'block', fontSize: '1.8rem', fontWeight: 900, color: '#171717' }}>{loading ? '...' : batches.length}</span>
          </div>
        </div>

        {/* ==================================================
            3. SEARCH & FILTERS BAR
            ================================================== */}
        <div className="teacher-card-panel" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.85rem', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <input
              type="text"
              placeholder="Search Subject / Class / Type..."
              style={{ width: '100%', padding: '0.55rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <select
            className="b-select-filter"
            style={{ padding: '0.55rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', background: '#FFF' }}
            value={selectedStandardFilter}
            onChange={(e) => setSelectedStandardFilter(e.target.value)}
          >
            <option value="All Standards">Class ▼</option>
            {assignedClasses.map((cls) => (
              <option key={cls} value={cls}>{cls} Class</option>
            ))}
          </select>

          <select
            className="b-select-filter"
            style={{ padding: '0.55rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', background: '#FFF' }}
            value={selectedPatternFilter}
            onChange={(e) => setSelectedPatternFilter(e.target.value)}
          >
            <option value="All Patterns">Schedule ▼</option>
            {PATTERNS_LIST.map((pat) => (
              <option key={pat} value={pat}>{pat}</option>
            ))}
          </select>

          <select
            className="b-select-filter"
            style={{ padding: '0.55rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', background: '#FFF' }}
            value={selectedTypeFilter}
            onChange={(e) => setSelectedTypeFilter(e.target.value)}
          >
            <option value="All Types">Type ▼</option>
            {TYPES_LIST.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </select>

          <button className="teacher-btn teacher-btn-outline teacher-btn-sm" onClick={handleClearFilters} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', height: '38px' }}>
            <RotateCcw size={15} /> Clear
          </button>
        </div>

        {/* ==================================================
            4. BATCH TIMETABLE TABLE
            ================================================== */}
        <div className="teacher-card-panel">
          <div className="teacher-panel-header" style={{ marginBottom: '1rem' }}>
            <div className="teacher-panel-title-group">
              <Calendar size={22} color="#D4AF37" />
              <div>
                <h3 className="teacher-panel-title">My Teaching Batches & Schedule</h3>
                <p className="teacher-panel-subtitle">Monday-Friday classes, Saturday sessions, and Sunday examinations (12-Hour AM/PM)</p>
              </div>
            </div>
          </div>

          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <Loader2 size={36} className="spin-icon" color="#D4AF37" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600 }}>Loading your batch timetable...</div>
            </div>
          ) : batches.length > 0 ? (
            <div className="teacher-table-responsive">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Class</th>
                    <th>Subject</th>
                    <th>Schedule</th>
                    <th>Type</th>
                    <th>Time (12-Hour)</th>
                    <th style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.map((batch) => {
                    const isExam = batch.scheduleType === 'Exam';
                    const displayPattern = batch.schedulePattern || 'Monday-Friday';

                    return (
                      <tr key={batch._id || batch.id}>
                        <td style={{ fontWeight: 800, color: '#171717' }}>{batch.standard}</td>
                        <td style={{ fontWeight: 700, color: isExam ? '#C9A227' : '#1D4ED8' }}>
                          {batch.subject}
                        </td>
                        <td>
                          <span style={{ background: '#FAF7F0', border: '1px solid #D4AF37', padding: '3px 10px', borderRadius: '6px', fontWeight: 700, fontSize: '0.82rem', color: '#171717' }}>
                            {displayPattern}
                          </span>
                        </td>
                        <td>
                          <span
                            style={{
                              background: isExam ? '#FEF3C7' : '#EFF6FF',
                              color: isExam ? '#92400E' : '#1E40AF',
                              border: `1px solid ${isExam ? '#F59E0B' : '#3B82F6'}`,
                              padding: '3px 10px',
                              borderRadius: '6px',
                              fontWeight: 800,
                              fontSize: '0.78rem'
                            }}
                          >
                            {batch.scheduleType || 'Regular Class'}
                          </span>
                        </td>
                        <td>
                          <span className="timetable-time-badge" style={{ fontWeight: 800 }}>
                            {formatTime12Hour(batch.startTime)} - {formatTime12Hour(batch.endTime)}
                          </span>
                        </td>
                        <td>
                          <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                            <button
                              onClick={() => handleOpenEdit(batch)}
                              style={{ background: '#D4AF37', color: '#151515', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Edit3 size={14} /> Edit
                            </button>
                            <button
                              onClick={() => handleOpenDelete(batch)}
                              style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            >
                              <Trash2 size={14} /> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <Calendar size={48} color="#CCCCCC" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600, fontSize: '0.95rem' }}>No batch schedule entries found for your profile.</div>
              <button className="teacher-btn teacher-btn-primary" onClick={handleOpenCreate} style={{ marginTop: '1rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                <Plus size={16} /> Create Your First Batch
              </button>
            </div>
          )}
        </div>

        {/* ==================================================
            5. MUTUALLY EXCLUSIVE OVERLAY MODALS (PORTALS)
            ================================================== */}

        {/* MODAL 1: CREATE / EDIT BATCH MODAL */}
        {(activeAction === 'create' || activeAction === 'edit') && ReactDOM.createPortal(
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
              style={{ background: '#FFF', borderRadius: '12px', border: '2px solid #D4AF37', padding: '1.75rem', maxWidth: '580px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #D4AF37', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#171717', fontWeight: 900, margin: 0 }}>
                  {activeAction === 'create' ? 'Create New Timetable Batch' : 'Edit Timetable Batch'}
                </h3>
                <button
                  onClick={closeActionModal}
                  style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Form Error Banner */}
              {formError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.88rem' }}>
                  <AlertCircle size={18} />
                  <span>{formError}</span>
                </div>
              )}

              <form onSubmit={activeAction === 'create' ? handleCreateSubmit : handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                
                {/* 1. Class Dropdown (Assigned Classes Only) */}
                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#171717' }}>
                    Assigned Class / Standard *
                  </label>
                  {assignedClasses.length > 0 ? (
                    <select
                      className="b-select-filter"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontWeight: 700 }}
                      value={formData.standard}
                      onChange={(e) => handleClassChangeInModal(e.target.value)}
                      required
                    >
                      {assignedClasses.map(cls => (
                        <option key={cls} value={cls}>{cls} Standard</option>
                      ))}
                    </select>
                  ) : (
                    <div style={{ padding: '0.6rem 0.85rem', background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#991B1B', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 700 }}>
                      No classes assigned to your teacher profile. Please contact Admin.
                    </div>
                  )}
                </div>

                {/* 2. Subject Dropdown (Authorized Subjects for Selected Class Only) */}
                <div>
                  <label style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#171717' }}>
                    Authorized Subject *
                  </label>
                  {(() => {
                    const allowedSubjs = getAllowedSubjectsForClass(formData.standard);
                    if (allowedSubjs.length === 0) {
                      return (
                        <select
                          className="b-select-filter"
                          style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', background: '#F3F4F6', color: '#6B7280', cursor: 'not-allowed' }}
                          disabled
                          value=""
                        >
                          <option value="">No subject assigned for {formData.standard || 'selected class'}</option>
                        </select>
                      );
                    }
                    return (
                      <select
                        className="b-select-filter"
                        style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontWeight: 700 }}
                        value={formData.subject}
                        onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                        required
                      >
                        {allowedSubjs.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    );
                  })()}
                </div>

                {/* 3. Schedule Pattern & Type Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#171717' }}>
                      Schedule Days *
                    </label>
                    <select
                      className="b-select-filter"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontWeight: 700 }}
                      value={formData.schedulePattern}
                      onChange={(e) => handlePatternChangeInModal(e.target.value)}
                    >
                      {PATTERNS_LIST.map(pat => (
                        <option key={pat} value={pat}>{pat}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.88rem', fontWeight: 700, display: 'block', marginBottom: '6px', color: '#171717' }}>
                      Batch Type *
                    </label>
                    <select
                      className="b-select-filter"
                      style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontWeight: 700 }}
                      value={formData.scheduleType}
                      onChange={(e) => setFormData({ ...formData, scheduleType: e.target.value })}
                    >
                      {TYPES_LIST.map(type => (
                        <option key={type} value={type}>{type}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* 4. Start Time & End Time Inputs */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#171717' }}>Start Time *</label>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1D4ED8' }}>
                        {formatTime12Hour(formData.startTime)}
                      </span>
                    </div>
                    <input
                      type="time"
                      required
                      style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    />
                  </div>

                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                      <label style={{ fontSize: '0.88rem', fontWeight: 700, color: '#171717' }}>End Time *</label>
                      <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#1D4ED8' }}>
                        {formatTime12Hour(formData.endTime)}
                      </span>
                    </div>
                    <input
                      type="time"
                      required
                      style={{ width: '100%', padding: '0.6rem 0.85rem', border: '1px solid #D1D5DB', borderRadius: '6px', fontSize: '0.9rem', color: '#171717', boxSizing: 'border-box' }}
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    />
                  </div>
                </div>

                {/* Submit / Cancel Buttons */}
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                  <button
                    type="button"
                    className="teacher-btn teacher-btn-outline"
                    onClick={closeActionModal}
                    disabled={isSubmittingAction}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="teacher-btn teacher-btn-primary"
                    disabled={isSubmittingAction || assignedClasses.length === 0}
                    style={{ minWidth: '130px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
                  >
                    {isSubmittingAction ? (
                      <>
                        <Loader2 size={16} className="spin-icon" /> Saving...
                      </>
                    ) : (
                      <>
                        <Check size={16} /> Save Timetable
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 2: DELETE CONFIRMATION MODAL */}
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
            <div
              style={{ background: '#FFF', borderRadius: '12px', border: '2px solid #DC2626', padding: '1.75rem', maxWidth: '480px', width: '95%', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
                <div style={{ background: '#FEF2F2', color: '#DC2626', width: '42px', height: '42px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.2rem', color: '#991B1B', fontWeight: 900, margin: 0 }}>Confirm Batch Deletion</h3>
                  <p style={{ margin: 0, fontSize: '0.85rem', color: '#666' }}>Are you sure you want to remove this timetable batch?</p>
                </div>
              </div>

              {formError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.75rem 1rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.88rem', fontWeight: 700 }}>
                  {formError}
                </div>
              )}

              <div style={{ background: '#FAF7F0', border: '1px solid #E5E7EB', borderRadius: '8px', padding: '1rem', marginBottom: '1.25rem' }}>
                <div style={{ fontWeight: 800, color: '#171717', marginBottom: '4px' }}>
                  {selectedBatch.standard} Class — {selectedBatch.subject}
                </div>
                <div style={{ fontSize: '0.85rem', color: '#555' }}>
                  Schedule: <strong>{selectedBatch.schedulePattern}</strong> ({formatTime12Hour(selectedBatch.startTime)} - {formatTime12Hour(selectedBatch.endTime)})
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  className="teacher-btn teacher-btn-outline"
                  onClick={closeActionModal}
                  disabled={isSubmittingAction}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteConfirm}
                  disabled={isSubmittingAction}
                  style={{ background: '#DC2626', color: '#FFF', border: 'none', padding: '0.55rem 1.25rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                >
                  {isSubmittingAction ? (
                    <>
                      <Loader2 size={16} className="spin-icon" /> Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 size={16} /> Yes, Delete Batch
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
    </TeacherLayout>
  );
};

export default MyBatches;
