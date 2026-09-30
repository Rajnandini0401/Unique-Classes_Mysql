import React, { useState, useEffect, useCallback, useRef } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Plus, Search, Filter, RotateCcw, Eye, Edit3, Trash2, GraduationCap, X, UserCheck, CheckCircle2, AlertCircle, Loader2, Check, User, Camera, Upload, Trash } from 'lucide-react';
import { getTeachersAPI, getTeacherByIdAPI, createTeacherAPI, updateTeacherAPI, deleteTeacherAPI } from '../../services/api';
import { TEACHER_SUBJECTS } from '../../utils/subjectUtils';
import { getTeacherPhotoUrl, handleImageError, DEFAULT_TEACHER_AVATAR } from '../../utils/photoUtils';
import '../../styles/admin/teachers.css';

// Master Available Subjects & Classes Lists
const ALL_SUBJECTS = TEACHER_SUBJECTS || [
  'Mathematics',
  'Science',
  'English',
  'Physics',
  'Chemistry',
  'Biology'
];

const ALL_CLASSES = [
  '5th',
  '6th',
  '7th',
  '8th',
  '9th',
  '10th',
  '11th',
  '12th',
  'Navodaya'
];

const Teachers = () => {
  const navigate = useNavigate();

  // Teachers Data List & Total Count from MongoDB API
  const [teachers, setTeachers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [apiError, setApiError] = useState('');
  const [toastMessage, setToastMessage] = useState('');

  // Filter & Search States
  const [selectedSubject, setSelectedSubject] = useState('All Subjects');
  const [selectedClass, setSelectedClass] = useState('All Classes');
  const [searchQuery, setSearchQuery] = useState('');

  // Single Action State for Mutually Exclusive Modals (null | 'create' | 'view' | 'edit' | 'delete')
  const [activeAction, setActiveAction] = useState(null);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [isSubmittingAction, setIsSubmittingAction] = useState(false);

  // Form State for Create / Edit (includes photo)
  const [formData, setFormData] = useState({
    name: '',
    mobile: '',
    email: '',
    subjects: ['Mathematics'],
    classes: ['10th'],
    education: 'M.Sc.',
    photo: ''
  });

  const fileInputRef = useRef(null);

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

  // Fetch Teachers from Backend (GET /api/teachers)
  const fetchTeachers = useCallback(async (subjFilter, classFilt, searchQ) => {
    setLoading(true);
    setApiError('');
    try {
      const res = await getTeachersAPI({
        subject: subjFilter !== 'All Subjects' ? subjFilter : undefined,
        class: classFilt !== 'All Classes' ? classFilt : undefined,
        search: searchQ
      });

      if (res && res.success) {
        setTeachers(res.teachers || []);
        setTotalCount(res.count !== undefined ? res.count : (res.teachers ? res.teachers.length : 0));
      } else {
        setTeachers([]);
        setApiError('Unable to load teachers.');
      }
    } catch (err) {
      setTeachers([]);
      setApiError(err.message || 'Unable to load teachers.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Debounced Auto Fetch
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchTeachers(selectedSubject, selectedClass, searchQuery);
    }, 300);

    return () => clearTimeout(timer);
  }, [selectedSubject, selectedClass, searchQuery, fetchTeachers]);

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
    setSelectedTeacher(null);
    setActionLoading(false);
  };

  // Handle Photo File Selection & Conversion to Base64/DataURL
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo size should be under 2MB.');
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData(prev => ({ ...prev, photo: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setFormData(prev => ({ ...prev, photo: '' }));
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Action 1: OPEN CREATE TEACHER MODAL
  const handleOpenCreate = () => {
    setActiveAction('create');
    setSelectedTeacher(null);
    setFormData({
      name: '',
      mobile: '',
      email: '',
      subjects: ['Mathematics'],
      classes: ['10th'],
      education: 'M.Sc.',
      photo: ''
    });
  };

  // Action 2: OPEN VIEW TEACHER MODAL (GET /api/teachers/:id)
  const handleOpenView = async (teacherItem) => {
    setActiveAction('view');
    setSelectedTeacher(teacherItem);
    setActionLoading(true);

    try {
      const targetId = teacherItem._id || teacherItem.id;
      const res = await getTeacherByIdAPI(targetId);
      if (res.success && res.teacher) {
        setSelectedTeacher(res.teacher);
      }
    } catch (err) {
      console.warn('Teacher view notice:', err.message);
    } finally {
      setActionLoading(false);
    }
  };

  // Action 3: OPEN EDIT TEACHER MODAL (GET /api/teachers/:id & Pre-fill)
  const handleOpenEdit = async (teacherItem) => {
    setActiveAction('edit');
    setSelectedTeacher(teacherItem);
    setActionLoading(true);

    const targetId = teacherItem._id || teacherItem.id;
    try {
      const res = await getTeacherByIdAPI(targetId);
      const data = (res.success && res.teacher) ? res.teacher : teacherItem;
      setSelectedTeacher(data);

      setFormData({
        name: data.name || '',
        mobile: data.mobile || '',
        email: data.email || '',
        subjects: Array.isArray(data.subjects) && data.subjects.length > 0 ? data.subjects : ['Mathematics'],
        classes: Array.isArray(data.classes) && data.classes.length > 0 ? data.classes : ['10th'],
        education: data.education || '',
        photo: data.photo || ''
      });
    } catch (err) {
      setFormData({
        name: teacherItem.name || '',
        mobile: teacherItem.mobile || '',
        email: teacherItem.email || '',
        subjects: Array.isArray(teacherItem.subjects) ? teacherItem.subjects : ['Mathematics'],
        classes: Array.isArray(teacherItem.classes) ? teacherItem.classes : ['10th'],
        education: teacherItem.education || '',
        photo: teacherItem.photo || ''
      });
    } finally {
      setActionLoading(false);
    }
  };

  // Action 4: OPEN DELETE CONFIRMATION
  const handleOpenDelete = (teacherItem) => {
    setActiveAction('delete');
    setSelectedTeacher(teacherItem);
  };

  // Submit Create Form (POST /api/teachers)
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim() || !formData.mobile.trim() || !formData.education.trim()) {
      alert('Please fill in all required fields (Name, Mobile, Education).');
      return;
    }

    setIsSubmittingAction(true);
    setApiError('');

    try {
      const payload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        subjects: formData.subjects.length > 0 ? formData.subjects : ['Mathematics'],
        classes: formData.classes.length > 0 ? formData.classes : ['10th'],
        education: formData.education.trim(),
        photo: formData.photo
      };

      const res = await createTeacherAPI(payload);

      if (res.success) {
        showToast('Teacher created successfully.');
        closeActionModal();
        fetchTeachers(selectedSubject, selectedClass, searchQuery);
      } else {
        setApiError(res.message || 'Unable to create teacher.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to create teacher.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Submit Update Form (PUT /api/teachers/:id)
  const handleUpdateSubmit = async (e) => {
    e.preventDefault();
    if (!selectedTeacher) return;

    setIsSubmittingAction(true);
    setApiError('');

    try {
      const targetId = selectedTeacher._id || selectedTeacher.id;
      const updatePayload = {
        name: formData.name.trim(),
        mobile: formData.mobile.trim(),
        email: formData.email.trim(),
        subjects: formData.subjects.length > 0 ? formData.subjects : ['Mathematics'],
        classes: formData.classes.length > 0 ? formData.classes : ['10th'],
        education: formData.education.trim(),
        photo: formData.photo
      };

      const res = await updateTeacherAPI(targetId, updatePayload);

      if (res.success) {
        showToast('Teacher updated successfully.');
        closeActionModal();
        fetchTeachers(selectedSubject, selectedClass, searchQuery);
      } else {
        setApiError(res.message || 'Unable to update teacher.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to update teacher.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  // Confirm Delete Action (DELETE /api/teachers/:id)
  const handleDeleteConfirm = async () => {
    if (!selectedTeacher) return;
    setIsSubmittingAction(true);
    setApiError('');

    try {
      const targetId = selectedTeacher.id || selectedTeacher._id || selectedTeacher.teacher_id;
      const res = await deleteTeacherAPI(targetId);

      if (res.success) {
        showToast('Teacher deleted successfully.');
        closeActionModal();
        fetchTeachers(selectedSubject, selectedClass, searchQuery);
      } else {
        setApiError(res.message || 'Unable to delete teacher.');
      }
    } catch (err) {
      setApiError(err.message || 'Unable to delete teacher.');
    } finally {
      setIsSubmittingAction(false);
    }
  };

  const handleClearFilters = () => {
    setSelectedSubject('All Subjects');
    setSelectedClass('All Classes');
    setSearchQuery('');
  };

  const handleToggleSubject = (sub) => {
    if (formData.subjects.includes(sub)) {
      if (formData.subjects.length > 1) {
        setFormData({ ...formData, subjects: formData.subjects.filter(s => s !== sub) });
      }
    } else {
      setFormData({ ...formData, subjects: [...formData.subjects, sub] });
    }
  };

  const handleToggleClass = (cls) => {
    if (formData.classes.includes(cls)) {
      if (formData.classes.length > 1) {
        setFormData({ ...formData, classes: formData.classes.filter(c => c !== cls) });
      }
    } else {
      setFormData({ ...formData, classes: [...formData.classes, cls] });
    }
  };

  return (
    <AdminLayout>
      <div className="teachers-container">
        {/* ==================================================
            1. PAGE HEADER BAR & CREATE NEW TEACHER BUTTON
            ================================================== */}
        <div className="teachers-top-bar">
          <div>
            <h1 className="teachers-heading">Teachers</h1>
            <p style={{ fontSize: '0.9rem', color: '#666', marginTop: '4px', marginBottom: 0 }}>
              View, add, edit, and assign subjects to teaching faculty.
            </p>
          </div>
          <button className="create-teacher-btn" onClick={handleOpenCreate}>
            <Plus size={18} /> Create New Teacher
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

        {/* ==================================================
            2. TOTAL TEACHERS SUMMARY CARD
            ================================================== */}
        <div className="teachers-summary-card">
          <div className="summary-icon-box">
            <GraduationCap size={28} />
          </div>
          <div className="summary-details">
            <span className="summary-label">Total Teachers</span>
            <span className="summary-count">{loading ? '...' : totalCount}</span>
          </div>
        </div>

        {/* ==================================================
            3. SEARCH TEACHER & FILTERS BAR
            ================================================== */}
        <div className="teachers-filter-card">
          <input
            type="text"
            placeholder="Search Teacher..."
            className="t-search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          <select
            className="t-select-filter"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="All Subjects">Subject ▼</option>
            {ALL_SUBJECTS.map((sub) => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          <select
            className="t-select-filter"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="All Classes">Class ▼</option>
            {ALL_CLASSES.map((cls) => (
              <option key={cls} value={cls}>{cls}</option>
            ))}
          </select>

          <button className="create-teacher-btn" style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}>
            <Filter size={16} /> Filter
          </button>

          <button className="t-select-filter" onClick={handleClearFilters} style={{ minWidth: 'auto', display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700 }}>
            <RotateCcw size={16} /> Clear
          </button>
        </div>

        {/* ==================================================
            4. TEACHER TABLE WITH PHOTO THUMBNAIL
            ================================================== */}
        <div className="teachers-table-card">
          {loading ? (
            <div style={{ padding: '3rem 1rem', textAlign: 'center' }}>
              <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600 }}>Loading teachers...</div>
            </div>
          ) : teachers.length > 0 ? (
            <table className="teachers-table">
              <thead>
                <tr>
                  <th style={{ width: '60px', textAlign: 'center' }}>Photo</th>
                  <th>Name</th>
                  <th>Mobile</th>
                  <th>Subject</th>
                  <th>Classes</th>
                  <th>Education</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {teachers.map((teacher) => {
                  const isViewing = activeAction === 'view' && selectedTeacher && (selectedTeacher._id === teacher._id || selectedTeacher.id === teacher.id);
                  return (
                    <tr key={teacher._id || teacher.id}>
                      <td style={{ textAlign: 'center' }}>
                        {teacher.photo ? (
                          <img
                            src={getTeacherPhotoUrl(teacher.photo)}
                            alt={teacher.name}
                            onError={(e) => handleImageError(e, DEFAULT_TEACHER_AVATAR)}
                            style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1E3A8A', display: 'block', margin: '0 auto' }}
                          />
                        ) : (
                          <div style={{ width: '38px', height: '38px', borderRadius: '50%', background: '#F8F5EC', border: '1.5px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto', color: '#1E3A8A' }}>
                            <User size={20} />
                          </div>
                        )}
                      </td>
                      <td className="t-name-cell">{teacher.name}</td>
                      <td>{teacher.mobile}</td>
                      <td>
                        <div>
                          {Array.isArray(teacher.subjects) && teacher.subjects.map((sub) => (
                            <span key={sub} className="t-badge-tag">{sub}</span>
                          ))}
                        </div>
                      </td>
                      <td>
                        <div>
                          {Array.isArray(teacher.classes) && teacher.classes.map((cls) => (
                            <span key={cls} className="t-badge-tag" style={{ background: '#FFF8E7', borderColor: '#C9A227', color: '#7A5B0B' }}>{cls}</span>
                          ))}
                        </div>
                      </td>
                      <td>{teacher.education}</td>
                      <td>
                        <div style={{ display: 'flex', gap: '0.4rem', justifyContent: 'center' }}>
                          <button
                            onClick={() => handleOpenView(teacher)}
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
                            onClick={() => handleOpenEdit(teacher)}
                            style={{ background: '#C9A227', color: '#080808', border: 'none', padding: '0.35rem 0.75rem', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '3px' }}
                          >
                            <Edit3 size={13} /> Edit
                          </button>
                          <button
                            onClick={() => handleOpenDelete(teacher)}
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
              <UserCheck size={48} color="#A3A3A3" style={{ margin: '0 auto 0.5rem auto' }} />
              <div style={{ color: '#666', fontWeight: 600, fontSize: '0.95rem' }}>No teacher records found.</div>
            </div>
          )}
        </div>

        {/* ==================================================
            5. MUTUALLY EXCLUSIVE OVERLAY MODALS (PORTALS)
            ================================================== */}

        {/* MODAL 1: CREATE TEACHER MODAL WITH PHOTO UPLOAD */}
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
              style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #1E3A8A', padding: '1.5rem', maxWidth: '650px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <h3 style={{ fontSize: '1.3rem', color: '#1E3A8A', fontWeight: 900, margin: 0 }}>Create Teacher</h3>
                <button
                  onClick={closeActionModal}
                  style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
                  title="Close Modal"
                >
                  <X size={18} />
                </button>
              </div>

              <form onSubmit={handleCreateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {/* TEACHER PHOTO UPLOAD SECTION */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: '#F8F5EC', padding: '1rem', borderRadius: '8px', border: '1px dashed #C9A227' }}>
                  <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#1E3A8A' }}>Teacher Photo</label>
                  {formData.photo ? (
                    <div style={{ position: 'relative' }}>
                      <img
                        src={getTeacherPhotoUrl(formData.photo)}
                        alt="Teacher Preview"
                        onError={(e) => handleImageError(e, DEFAULT_TEACHER_AVATAR)}
                        style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #1E3A8A' }}
                      />
                      <button
                        type="button"
                        onClick={handleRemovePhoto}
                        style={{ position: 'absolute', top: 0, right: 0, background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                        title="Remove Photo"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#FFF', border: '2px dashed #B0B0B0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                      <User size={40} />
                    </div>
                  )}

                  <input
                    type="file"
                    accept="image/*"
                    ref={fileInputRef}
                    onChange={handlePhotoChange}
                    style={{ display: 'none' }}
                  />

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      type="button"
                      className="create-teacher-btn"
                      style={{ padding: '0.4rem 1rem', fontSize: '0.82rem' }}
                      onClick={() => fileInputRef.current && fileInputRef.current.click()}
                    >
                      <Upload size={14} /> {formData.photo ? 'Change Photo' : '+ Upload Photo'}
                    </button>

                    {formData.photo && (
                      <button
                        type="button"
                        className="t-select-filter"
                        style={{ minWidth: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.82rem', color: '#DC2626', borderColor: '#DC2626' }}
                        onClick={handleRemovePhoto}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Teacher Name *</label>
                  <input
                    type="text"
                    required
                    className="t-search-input"
                    style={{ width: '100%' }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Enter teacher full name"
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
                    <input
                      type="tel"
                      required
                      className="t-search-input"
                      style={{ width: '100%' }}
                      value={formData.mobile}
                      onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      placeholder="10-digit mobile number"
                    />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Email Address</label>
                    <input
                      type="email"
                      className="t-search-input"
                      style={{ width: '100%' }}
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="Optional email"
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Subject They Teach *</label>
                  <div className="checkbox-select-grid">
                    {ALL_SUBJECTS.map((sub) => (
                      <label key={sub} className="cb-item-label">
                        <input
                          type="checkbox"
                          checked={formData.subjects.includes(sub)}
                          onChange={() => handleToggleSubject(sub)}
                        />
                        {sub}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Classes They Teach *</label>
                  <div className="checkbox-select-grid">
                    {ALL_CLASSES.map((cls) => (
                      <label key={cls} className="cb-item-label">
                        <input
                          type="checkbox"
                          checked={formData.classes.includes(cls)}
                          onChange={() => handleToggleClass(cls)}
                        />
                        {cls}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Education *</label>
                  <input
                    type="text"
                    required
                    className="t-search-input"
                    style={{ width: '100%' }}
                    value={formData.education}
                    onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    placeholder="e.g. M.Sc. Mathematics, B.Ed"
                  />
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                  <button type="button" className="t-select-filter" onClick={closeActionModal} style={{ minWidth: 'auto', fontWeight: 700 }}>Cancel</button>
                  <button type="submit" className="create-teacher-btn" disabled={isSubmittingAction}>
                    {isSubmittingAction ? 'Creating...' : 'Create Teacher'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 2: VIEW TEACHER MODAL WITH PROMINENT PHOTO */}
        {activeAction === 'view' && selectedTeacher && ReactDOM.createPortal(
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
              className="view-profile-card"
              style={{ maxWidth: '560px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #1E3A8A', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#1E3A8A', fontWeight: 900, margin: 0 }}>View Teacher</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    Faculty Profile Record
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
                  <div>Loading teacher profile...</div>
                </div>
              ) : (
                <>
                  {/* PROMINENT TEACHER PHOTO AT TOP */}
                  <div style={{ textAlign: 'center', marginBottom: '1.25rem' }}>
                    {selectedTeacher.photo ? (
                      <img
                        src={getTeacherPhotoUrl(selectedTeacher.photo)}
                        alt={selectedTeacher.name}
                        onError={(e) => handleImageError(e, DEFAULT_TEACHER_AVATAR)}
                        style={{ width: '110px', height: '110px', borderRadius: '50%', objectFit: 'cover', border: '4px solid #1E3A8A', boxShadow: '0 8px 20px rgba(30,58,138,0.2)', display: 'block', margin: '0 auto 0.5rem auto' }}
                      />
                    ) : (
                      <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: '#F8F5EC', border: '3px solid #D4AF37', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 0.5rem auto', color: '#1E3A8A' }}>
                        <User size={54} />
                      </div>
                    )}
                    <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: '#111', margin: 0 }}>{selectedTeacher.name}</h2>
                    <div style={{ fontSize: '0.9rem', fontWeight: 800, color: '#1E3A8A', margin: '4px 0 2px 0' }}>
                      Teacher ID: <span style={{ color: '#C9A227', fontWeight: 900, letterSpacing: '0.5px' }}>{selectedTeacher.teacher_id || selectedTeacher.teacherId || 'N/A'}</span>
                    </div>
                    <span style={{ fontSize: '0.88rem', fontWeight: 700, color: '#555' }}>{selectedTeacher.education || 'Faculty Member'}</span>
                  </div>

                  <div className="profile-field-item">
                    <label>Teacher ID:</label>
                    <div style={{ fontWeight: 800, color: '#1E3A8A' }}>{selectedTeacher.teacher_id || selectedTeacher.teacherId || 'N/A'}</div>
                  </div>

                  <div className="profile-field-item">
                    <label>Mobile Number:</label>
                    <div style={{ fontWeight: 700, color: '#111' }}>{selectedTeacher.mobile || 'N/A'}</div>
                  </div>

                  <div className="profile-field-item">
                    <label>Email Address:</label>
                    <div>{selectedTeacher.email || 'N/A'}</div>
                  </div>

                  <div className="profile-field-item">
                    <label>Subjects Taught:</label>
                    <div style={{ marginTop: '3px' }}>
                      {Array.isArray(selectedTeacher.subjects) && selectedTeacher.subjects.map(s => (
                        <span key={s} className="t-badge-tag">{s}</span>
                      ))}
                    </div>
                  </div>

                  <div className="profile-field-item">
                    <label>Classes Taught:</label>
                    <div style={{ marginTop: '3px' }}>
                      {Array.isArray(selectedTeacher.classes) && selectedTeacher.classes.map(c => (
                        <span key={c} className="t-badge-tag" style={{ background: '#FFF8E7', borderColor: '#C9A227', color: '#7A5B0B' }}>{c}</span>
                      ))}
                    </div>
                  </div>

                  <div style={{ textAlign: 'center', marginTop: '1.75rem' }}>
                    <button type="button" className="create-teacher-btn" onClick={closeActionModal} style={{ padding: '0.5rem 2.5rem' }}>
                      Close
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 3: EDIT TEACHER MODAL WITH PHOTO REPLACEMENT */}
        {activeAction === 'edit' && selectedTeacher && ReactDOM.createPortal(
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
              style={{ background: '#FFF', borderRadius: '8px', border: '2px solid #C9A227', padding: '1.5rem', maxWidth: '650px', width: '95%', maxHeight: '90vh', overflowY: 'auto', margin: 'auto', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
              onClick={e => e.stopPropagation()}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #C9A227', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
                <div>
                  <h3 style={{ fontSize: '1.3rem', color: '#7A5B0B', fontWeight: 900, margin: 0 }}>Edit Teacher</h3>
                  <span style={{ fontSize: '0.85rem', color: '#555', fontWeight: 700 }}>
                    Teacher Name: <strong style={{ color: '#171717' }}>{selectedTeacher.name}</strong>
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
                  <div>Loading teacher details...</div>
                </div>
              ) : (
                <form onSubmit={handleUpdateSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {/* EDIT TEACHER PHOTO SECTION */}
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', background: '#F8F5EC', padding: '1rem', borderRadius: '8px', border: '1px dashed #C9A227' }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 800, color: '#7A5B0B' }}>Teacher Photo</label>
                    {formData.photo ? (
                      <div style={{ position: 'relative' }}>
                        <img
                          src={getTeacherPhotoUrl(formData.photo)}
                          alt="Teacher Preview"
                          onError={(e) => handleImageError(e, DEFAULT_TEACHER_AVATAR)}
                          style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid #C9A227' }}
                        />
                        <button
                          type="button"
                          onClick={handleRemovePhoto}
                          style={{ position: 'absolute', top: 0, right: 0, background: '#DC2626', color: '#FFF', border: 'none', borderRadius: '50%', width: '26px', height: '26px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                          title="Remove Photo"
                        >
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <div style={{ width: '90px', height: '90px', borderRadius: '50%', background: '#FFF', border: '2px dashed #B0B0B0', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
                        <User size={40} />
                      </div>
                    )}

                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      onChange={handlePhotoChange}
                      style={{ display: 'none' }}
                    />

                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        type="button"
                        className="create-teacher-btn"
                        style={{ padding: '0.4rem 1rem', fontSize: '0.82rem', background: '#C9A227', color: '#080808' }}
                        onClick={() => fileInputRef.current && fileInputRef.current.click()}
                      >
                        <Upload size={14} /> {formData.photo ? 'Change Photo' : '+ Upload Photo'}
                      </button>

                      {formData.photo && (
                        <button
                          type="button"
                          className="t-select-filter"
                          style={{ minWidth: 'auto', padding: '0.4rem 0.8rem', fontSize: '0.82rem', color: '#DC2626', borderColor: '#DC2626' }}
                          onClick={handleRemovePhoto}
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Teacher Name *</label>
                    <input
                      type="text"
                      required
                      className="t-search-input"
                      style={{ width: '100%' }}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        className="t-search-input"
                        style={{ width: '100%' }}
                        value={formData.mobile}
                        onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Email Address</label>
                      <input
                        type="email"
                        className="t-search-input"
                        style={{ width: '100%' }}
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Subject They Teach *</label>
                    <div className="checkbox-select-grid">
                      {ALL_SUBJECTS.map((sub) => (
                        <label key={sub} className="cb-item-label">
                          <input
                            type="checkbox"
                            checked={formData.subjects.includes(sub)}
                            onChange={() => handleToggleSubject(sub)}
                          />
                          {sub}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Classes They Teach *</label>
                    <div className="checkbox-select-grid">
                      {ALL_CLASSES.map((cls) => (
                        <label key={cls} className="cb-item-label">
                          <input
                            type="checkbox"
                            checked={formData.classes.includes(cls)}
                            onChange={() => handleToggleClass(cls)}
                          />
                          {cls}
                        </label>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: '0.85rem', fontWeight: 700, display: 'block', marginBottom: '4px' }}>Education *</label>
                    <input
                      type="text"
                      required
                      className="t-search-input"
                      style={{ width: '100%' }}
                      value={formData.education}
                      onChange={(e) => setFormData({ ...formData, education: e.target.value })}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
                    <button type="button" className="t-select-filter" onClick={closeActionModal} style={{ minWidth: 'auto', fontWeight: 700 }}>Cancel</button>
                    <button type="submit" className="create-teacher-btn" disabled={isSubmittingAction} style={{ background: '#C9A227', color: '#080808' }}>
                      {isSubmittingAction ? 'Updating...' : 'Update Teacher'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

        {/* MODAL 4: DELETE CONFIRMATION MODAL */}
        {activeAction === 'delete' && selectedTeacher && ReactDOM.createPortal(
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
                Delete Teacher
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', marginBottom: '1.25rem' }}>
                Are you sure you want to delete this teacher?
                <br />
                <strong style={{ color: '#171717', fontSize: '1rem', marginTop: '4px', display: 'block' }}>{selectedTeacher.name}</strong>
              </p>

              {apiError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.5rem 0.75rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
                  {apiError}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.85rem', justifyContent: 'center' }}>
                <button className="t-select-filter" onClick={closeActionModal} style={{ minWidth: 'auto', fontWeight: 700 }}>
                  Cancel
                </button>
                <button className="create-teacher-btn" onClick={handleDeleteConfirm} disabled={isSubmittingAction} style={{ background: '#DC2626', padding: '0.5rem 1.5rem' }}>
                  {isSubmittingAction ? 'Deleting...' : 'Delete'}
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

export default Teachers;
