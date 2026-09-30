import React, { useState, useEffect, useCallback } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Search, Filter, RotateCcw, Eye, Edit3, Trash2, UserCheck, X, Printer, CheckCircle2, Save, AlertCircle, Loader2, Check, FileSpreadsheet, Download } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { getStudentsAPI, getStudentByIdAPI, updateStudentAPI, deleteStudentAPI, exportStudentsAPI } from '../../services/api';
import { getStudentPhotoUrl, handleImageError } from '../../utils/photoUtils';
import NewAdmission from './NewAdmission';
import '../../styles/admin/students.css';
import '../../styles/admin/admission.css';

import { SUPPORTED_CLASSES, SUPPORTED_SUBJECTS } from '../../config/academicConstants';

const STANDARDS_LIST = SUPPORTED_CLASSES;

const AllStudents = ({ layoutWrapper: LayoutComponent = AdminLayout, readOnly = false }) => {
  const navigate = useNavigate();

  // Students Data List & Loading States
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Filter & Search States
  const [selectedClass, setSelectedClass] = useState('Select Class');
  const [searchQuery, setSearchQuery] = useState('');

  // Single Action State for Mutually Exclusive Modals (null | 'view' | 'delete')
  const [activeAction, setActiveAction] = useState(null);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [actionError, setActionError] = useState('');
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Export Excel Handler
  const handleExportExcel = async (scope = 'all') => {
    setIsExporting(true);
    setApiError('');
    try {
      showToast('Downloading Excel report...');
      await exportStudentsAPI({
        scope,
        standard: selectedClass,
        search: searchQuery
      });
      showToast('Excel report downloaded successfully!');
    } catch (err) {
      setApiError(err.message || 'Unable to export student data.');
    } finally {
      setIsExporting(false);
    }
  };

  // Lock background body scrolling when any modal is active & handle ESC key press
  useEffect(() => {
    if (activeAction) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }

    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && activeAction) {
        closeActionModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeAction]);

  // Fetch Students from Backend API (GET /api/students)
  const fetchStudents = useCallback(async (stdFilter, queryStr) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getStudentsAPI({
        standard: stdFilter !== 'Select Class' ? stdFilter : undefined,
        search: queryStr
      });

      if (res.success) {
        setStudents(res.students || []);
      } else {
        setApiError('Unable to load students.');
      }
    } catch (err) {
      setApiError('Unable to load students. Please check backend connection.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Auto Fetch on Filter / Search Change
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchStudents(selectedClass, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedClass, searchQuery, fetchStudents]);

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
    setSelectedStudent(null);
    setActionLoading(false);
    setActionError('');
  };

  // Action 1: OPEN VIEW MODAL (GET /api/students/:id)
  const handleOpenView = async (studentItem) => {
    setActiveAction('view');
    setSelectedStudent(studentItem);
    setActionLoading(true);
    setActionError('');

    try {
      const targetId = studentItem.id || studentItem.studentId || studentItem._id;
      const res = await getStudentByIdAPI(targetId);
      if (res.success && res.student) {
        setSelectedStudent(res.student);
      } else {
        setActionError('Unable to load student details.');
      }
    } catch (err) {
      setActionError('Unable to load student details.');
    } finally {
      setActionLoading(false);
    }
  };

  // Action 2: OPEN EDIT OVERLAY MODAL (REUSES NEW ADMISSION FORM)
  const handleOpenEdit = (studentItem) => {
    setActiveAction('edit');
    setSelectedStudent(studentItem);
  };

  // Action 3: OPEN DELETE CONFIRMATION
  const handleOpenDelete = (studentItem) => {
    setActiveAction('delete');
    setSelectedStudent(studentItem);
  };

  // Confirm Delete Action (DELETE /api/students/:id)
  const handleDeleteConfirm = async () => {
    if (!selectedStudent) return;
    setIsSubmittingAction(true);
    setApiError('');

    try {
      const targetId = selectedStudent.id || selectedStudent.studentId || selectedStudent._id;
      const res = await deleteStudentAPI(targetId);

      if (res.success) {
        showToast('Student deleted successfully.');
        closeActionModal();
        fetchStudents(selectedClass, searchQuery);
      } else {
        setApiError(res.message || 'Unable to delete student.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to delete student.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedClass('Select Class');
    setSearchQuery('');
  };

  return (
    <LayoutComponent>
      <div className="students-container">
        {/* Header Banner */}
        <div className="students-header-banner">
          <div>
            <h1 className="students-title">All Students</h1>
            <p className="students-subtitle">{readOnly ? 'View all registered students class-wise from MongoDB.' : 'View and manage all registered students class-wise from MongoDB.'}</p>
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
            SEARCH & CLASS FILTER BAR
            ================================================== */}
        <div className="filter-bar-card">
          <input
            type="text"
            placeholder="Search Name / Student ID / Mobile..."
            className="search-input-field"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="class-select-dropdown"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="Select Class">Select Class ▼</option>
            {STANDARDS_LIST.map((std) => (
              <option key={std} value={std}>{std}</option>
            ))}
          </select>

          <button className="filter-btn-submit">
            <Filter size={16} style={{ display: 'inline', marginRight: '4px' }} /> Filter
          </button>

          <button className="clear-btn-submit" onClick={handleClearFilters}>
            <RotateCcw size={16} style={{ display: 'inline', marginRight: '4px' }} /> Clear
          </button>

          <div style={{ display: 'flex', gap: '0.5rem', marginLeft: 'auto' }}>
            <button
              type="button"
              className="export-btn-all"
              onClick={() => handleExportExcel('all')}
              disabled={isExporting}
              style={{
                background: '#10B981',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: isExporting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem'
              }}
              title="Export all student records from MySQL to Excel"
            >
              {isExporting ? <Loader2 size={16} className="spin-icon" /> : <FileSpreadsheet size={16} />}
              Export All
            </button>

            <button
              type="button"
              className="export-btn-filtered"
              onClick={() => handleExportExcel('filtered')}
              disabled={isExporting}
              style={{
                background: '#059669',
                color: '#FFFFFF',
                border: 'none',
                padding: '0.5rem 0.9rem',
                borderRadius: '6px',
                fontWeight: 700,
                cursor: isExporting ? 'not-allowed' : 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                fontSize: '0.85rem'
              }}
              title="Export filtered student records to Excel"
            >
              {isExporting ? <Loader2 size={16} className="spin-icon" /> : <Download size={16} />}
              Export Filtered
            </button>
          </div>
        </div>

        {/* Students Table */}
        <div className="students-table-card">
          {loading ? (
            <div className="loading-state-box">
              <Loader2 size={32} className="spin-icon" color="#D4AF37" />
              <div className="loading-text">Loading students from MongoDB...</div>
            </div>
          ) : students.length > 0 ? (
            <table className="students-table">
              <thead>
                <tr>
                  <th>Roll No</th>
                  <th>Student ID</th>
                  <th>fullname</th>
                  <th>Class</th>
                  <th>Medium</th>
                  <th>Parent Mobile</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {students.map((student) => {
                  const isViewing = activeAction === 'view' && selectedStudent?._id === student._id;

                  return (
                    <tr key={student._id || student.studentId}>
                      <td style={{ fontWeight: 800 }}>{student.rollNo || '-'}</td>
                      <td style={{ fontWeight: 600, color: '#4B5563' }}>{student.studentId || '-'}</td>
                      <td style={{ fontWeight: 700, color: '#111827' }}>{student.fullname || student.name}</td>
                      <td>
                        <span className="badge-class">{student.standard}</span>
                      </td>
                      <td>{student.medium || 'Semi-English'}</td>
                      <td>{student.parentMobile || student.mobile || '-'}</td>
                      <td>
                        <span className={`status-pill ${student.status ? student.status.toLowerCase() : 'active'}`}>
                          {student.status || 'Active'}
                        </span>
                      </td>
                      <td>
                        <div className="action-buttons-group">
                          <button
                            className="btn-act-view"
                            onClick={() => handleOpenView(student)}
                            style={isViewing ? { background: '#1D4ED8', boxShadow: '0 0 0 2px #93C5FD' } : {}}
                          >
                            {isViewing ? (
                              <>
                                <Check size={14} style={{ display: 'inline', marginRight: '3px' }} /> Viewing
                              </>
                            ) : (
                              <>
                                <Eye size={14} style={{ display: 'inline', marginRight: '3px' }} /> View
                              </>
                            )}
                          </button>
                          {!readOnly && (
                            <>
                              <button className="btn-act-edit" onClick={() => handleOpenEdit(student)}>
                                <Edit3 size={14} style={{ display: 'inline', marginRight: '3px' }} /> Edit
                              </button>
                              <button className="btn-act-delete" onClick={() => handleOpenDelete(student)}>
                                <Trash2 size={14} style={{ display: 'inline', marginRight: '3px' }} /> Delete
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="empty-state-box">
              <UserCheck size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
              <div className="empty-state-text">
                {selectedClass === 'Select Class'
                  ? 'No student records found in MongoDB.'
                  : `No students registered for ${selectedClass} class in MongoDB.`}
              </div>
            </div>
          )}
        </div>

        {/* ==================================================
            MUTUALLY EXCLUSIVE CENTERED OVERLAY MODALS (VIA REACT PORTAL DIRECTLY ON BODY)
            ================================================== */}

        {/* MODAL 1: VIEW STUDENT (REGISTRATION FORM STRUCTURE - READONLY) */}
        {activeAction === 'view' && selectedStudent && ReactDOM.createPortal(
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
              className="admission-form-wrapper"
              style={{
                maxHeight: '90vh',
                overflowY: 'auto',
                width: '95%',
                maxWidth: '860px',
                margin: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative'
              }}
              onClick={e => e.stopPropagation()}
            >
              {/* CLEAR MODAL ACTION HEADER */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #233F8F', paddingBottom: '0.6rem', marginBottom: '0.85rem' }}>
                <div>
                  <h2 style={{ fontSize: '1.35rem', color: '#233F8F', fontWeight: 900, margin: 0 }}>
                    View Student
                  </h2>
                  <span style={{ fontSize: '0.88rem', color: '#333', fontWeight: 700 }}>
                    fullname: <strong style={{ color: '#171717' }}>{selectedStudent.fullname || selectedStudent.name}</strong> | Student ID: <strong style={{ color: '#233F8F' }}>{selectedStudent.studentId || 'N/A'}</strong>
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
                <div style={{ textAlign: 'center', padding: '3.5rem 1rem' }}>
                  <Loader2 size={40} className="spin-icon" color="#233F8F" style={{ margin: '0 auto 0.75rem auto' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#233F8F' }}>Loading student details...</div>
                </div>
              ) : actionError ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <AlertCircle size={40} color="#EF4444" style={{ margin: '0 auto 0.5rem auto' }} />
                  <div style={{ fontSize: '1rem', fontWeight: 700, color: '#991B1B', marginBottom: '1rem' }}>
                    {actionError}
                  </div>
                  <button className="t-submit-btn" onClick={() => handleOpenView(selectedStudent)} style={{ padding: '0.5rem 1.5rem' }}>
                    Retry
                  </button>
                </div>
              ) : (
                <>
                  {/* REGISTRATION FORM HEADER */}
                  <div className="template-header">
                    <div className="template-header-left">
                      <img src={logoImg} alt="Unique Classes Logo" className="template-logo" />
                    </div>
                    <div className="template-header-center">
                      <h1 className="template-brand-title">UNIQUE CLASSES</h1>
                      <p className="template-brand-tagline">Proper Application of Knowledge Moves to Progress</p>
                    </div>
                    <div className="template-header-right">
                      <div><strong>Date:</strong> {selectedStudent.admissionDate ? new Date(selectedStudent.admissionDate).toLocaleDateString('en-GB') : '22/08/2026'}</div>
                      <div style={{ marginTop: '3px' }}><strong>Serial No:</strong> {selectedStudent.studentId || 'UC-2026-016'}</div>
                    </div>
                  </div>

                  <div className="template-blue-divider"></div>
                  <div className="template-doc-heading">STUDENT ADMISSION RECORD (READ-ONLY)</div>

                  {/* SECTION 1: STUDENT INFORMATION */}
                  <div className="template-section-box">
                    <div className="template-section-badge">Student Information</div>

                    {/* STUDENT PHOTO DISPLAY IF AVAILABLE */}
                    {selectedStudent.photo && getStudentPhotoUrl(selectedStudent.photo) && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.85rem', background: '#F8FAFC', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1' }}>
                        <div style={{ width: '80px', height: '80px', borderRadius: '8px', border: '2px solid #233F8F', overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 6px rgba(0,0,0,0.15)' }}>
                          <img
                            src={getStudentPhotoUrl(selectedStudent.photo)}
                            alt={selectedStudent.name}
                            onError={(e) => handleImageError(e, '')}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        </div>
                        <div>
                          <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B', textTransform: 'uppercase' }}>Student Photo</div>
                          <div style={{ fontSize: '0.92rem', fontWeight: 900, color: '#1E3A8A' }}>{selectedStudent.name}</div>
                          <div style={{ fontSize: '0.75rem', color: '#10B981', fontWeight: 700, marginTop: '2px' }}>✓ Verified Registered Student Photo</div>
                        </div>
                      </div>
                    )}

                    <div className="t-grid-full" style={{ marginBottom: '0.75rem' }}>
                      <label className="t-label">fullname</label>
                      <input type="text" readOnly className="t-input" value={selectedStudent.fullname || selectedStudent.name || ''} style={{ background: '#F8F5EC' }} />
                    </div>

                    <div className="t-grid-2" style={{ marginBottom: '0.75rem' }}>
                      <div>
                        <label className="t-label">Class</label>
                        <input type="text" readOnly className="t-input" value={selectedStudent.standard || '10th'} style={{ background: '#F8F5EC', width: '100%' }} />
                      </div>
                      <div>
                        <label className="t-label">Medium</label>
                        <input type="text" readOnly className="t-input" value={selectedStudent.medium || 'Semi-English'} style={{ background: '#F8F5EC', width: '100%' }} />
                      </div>
                    </div>

                    <div style={{ marginBottom: '0.75rem' }}>
                      <label className="t-label">Subjects Enrolled:</label>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.25rem' }}>
                        {Array.isArray(selectedStudent.subjects) && selectedStudent.subjects.length > 0 ? (
                          selectedStudent.subjects.map(subj => (
                            <span key={subj} style={{ background: '#233F8F', color: '#FFF', padding: '2px 10px', borderRadius: '4px', fontSize: '0.82rem', fontWeight: 700 }}>
                              ✓ {subj}
                            </span>
                          ))
                        ) : (
                          <span style={{ fontSize: '0.85rem', color: '#666' }}>Mathematics, Science, English</span>
                        )}
                      </div>
                    </div>

                    <div className="t-grid-full" style={{ marginBottom: '0.75rem' }}>
                      <label className="t-label">School Name</label>
                      <input type="text" readOnly className="t-input" value={selectedStudent.schoolName || 'N/A'} style={{ background: '#F8F5EC' }} />
                    </div>

                    <div className="t-grid-2">
                      <div>
                        <label className="t-label">Address</label>
                        <input type="text" readOnly className="t-input" value={selectedStudent.address || 'N/A'} style={{ background: '#F8F5EC', width: '100%' }} />
                      </div>
                      <div>
                        <label className="t-label">Date of Birth</label>
                        <input type="text" readOnly className="t-input" value={selectedStudent.dateOfBirth ? new Date(selectedStudent.dateOfBirth).toLocaleDateString('en-GB') : 'N/A'} style={{ background: '#F8F5EC', width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 2: CONTACT DETAILS */}
                  <div className="template-section-box">
                    <div className="template-section-badge">Contact Details</div>
                    <div className="t-grid-2">
                      <div>
                        <label className="t-label">Student Mobile</label>
                        <input type="text" readOnly className="t-input" value={selectedStudent.mobile || 'N/A'} style={{ background: '#F8F5EC', width: '100%' }} />
                      </div>
                      <div>
                        <label className="t-label">WhatsApp Number</label>
                        <input type="text" readOnly className="t-input" value={selectedStudent.parentMobile || selectedStudent.mobile || 'N/A'} style={{ background: '#F8F5EC', width: '100%' }} />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 3: FEE DETAILS */}
                  <div className="template-section-box">
                    <div className="template-section-badge">Fee Details</div>
                    <div className="t-grid-4">
                      <div className="t-fee-field">
                        <label className="t-fee-label">Total Fees</label>
                        <input type="text" readOnly className="t-input" value={`₹${(Number(selectedStudent.totalFees) || 25000).toLocaleString()}`} style={{ background: '#F8F5EC' }} />
                      </div>
                      <div className="t-fee-field">
                        <label className="t-fee-label">Amount Paid</label>
                        <input type="text" readOnly className="t-input" value={`₹${(Number(selectedStudent.amountPaid) || 10000).toLocaleString()}`} style={{ background: '#F8F5EC' }} />
                      </div>
                      <div className="t-fee-field">
                        <label className="t-fee-label">Payment Mode</label>
                        <input type="text" readOnly className="t-input" value={selectedStudent.paymentMode || 'Cash'} style={{ background: '#F8F5EC' }} />
                      </div>
                      <div className="t-fee-field">
                        <label className="t-fee-label">Balance Fees</label>
                        <input type="text" readOnly className="t-input" value={`₹${Math.max(0, (Number(selectedStudent.totalFees) || 25000) - (Number(selectedStudent.amountPaid) || 10000)).toLocaleString()}`} style={{ background: '#F8F5EC', color: '#EF4444', fontWeight: 800 }} />
                      </div>
                    </div>
                  </div>

                  {/* SECTION 4: DECLARATION */}
                  <div className="template-section-box">
                    <div className="template-section-badge">Declaration</div>
                    <p className="t-declaration-text">
                      I hereby declare that the above information provided is true and correct.
                    </p>
                    <div className="t-signatures-row">
                      <div className="t-sig-box">
                        <div className="t-sig-line"></div>
                        <span className="t-sig-text">Student Signature</span>
                      </div>
                      <div className="t-sig-box">
                        <div className="t-sig-line"></div>
                        <span className="t-sig-text">Parent / Guardian Signature</span>
                      </div>
                      <div className="t-sig-box">
                        <div className="t-sig-line"></div>
                        <span className="t-sig-text">Authorized Signatory</span>
                      </div>
                    </div>
                  </div>

                  {/* BOTTOM CLOSE ACTION BUTTON */}
                  <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1.25rem' }}>
                    <button className="t-submit-btn" onClick={closeActionModal} style={{ padding: '0.6rem 2.5rem' }}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 3: DELETE CONFIRMATION (VIA PORTAL) */}
        {activeAction === 'delete' && selectedStudent && ReactDOM.createPortal(
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
            <div className="action-modal-card" style={{ maxWidth: '420px', width: '90%', textAlign: 'center', margin: 'auto' }} onClick={e => e.stopPropagation()}>
              <Trash2 size={46} color="#EF4444" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.3rem', color: '#171717', fontWeight: 900, marginBottom: '0.4rem' }}>
                Confirm Delete Student?
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', marginBottom: '1.25rem' }}>
                Are you sure you want to delete student <strong>{selectedStudent.fullname || selectedStudent.name}</strong> ({selectedStudent.studentId || 'N/A'}) from database?
              </p>

              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                <button className="clear-btn-submit" onClick={closeActionModal} style={{ padding: '0.5rem 1.5rem' }}>
                  Cancel
                </button>
                <button className="btn-act-delete" onClick={handleDeleteConfirm} disabled={isSubmittingAction} style={{ padding: '0.5rem 1.5rem' }}>
                  {isSubmittingAction ? 'Deleting...' : 'Yes, Delete'}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 2: EDIT STUDENT (NEW ADMISSION FORM OVERLAY MODAL) */}
        {activeAction === 'edit' && selectedStudent && ReactDOM.createPortal(
          <div
            className="edit-modal-overlay"
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
              backdropFilter: 'blur(4px)',
              padding: '1rem',
              boxSizing: 'border-box'
            }}
          >
            <div
              className="edit-modal-container"
              style={{
                maxHeight: '92vh',
                overflowY: 'auto',
                width: '95%',
                maxWidth: '880px',
                margin: 'auto',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                position: 'relative',
                borderRadius: '12px',
                background: '#FFFFFF'
              }}
              onClick={e => e.stopPropagation()}
            >
              <NewAdmission
                isModal={true}
                editStudentId={selectedStudent.id || selectedStudent.studentId || selectedStudent._id}
                onClose={closeActionModal}
                onSuccess={() => {
                  closeActionModal();
                  fetchStudents(selectedClass, searchQuery);
                  showToast('Student details updated successfully.');
                }}
              />
            </div>
          </div>,
          document.body
        )}
      </div>
    </LayoutComponent>
  );
};

export default AllStudents;
