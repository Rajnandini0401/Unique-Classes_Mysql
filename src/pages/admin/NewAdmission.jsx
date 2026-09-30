import React, { useState, useEffect } from 'react';
import ReactDOM from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import AdminLayout from '../../layouts/AdminLayout';
import { Printer, ShieldCheck, AlertCircle, Loader2, CheckCircle2, Eye, X, Upload, Camera } from 'lucide-react';
import logoImg from '../../assets/logo.png';
import { createStudentAPI, getNextStudentIdAPI, getStudentByIdAPI, updateStudentAPI } from '../../services/api';
import { getStudentPhotoUrl, handleImageError } from '../../utils/photoUtils';
import { SUPPORTED_CLASSES, SUPPORTED_SUBJECTS } from '../../config/academicConstants';
import '../../styles/admin/admission.css';

// Helper for dynamic current date string (YYYY-MM-DD)
const getTodayDateString = () => {
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const NewAdmission = ({
  isModal = false,
  editStudentId = null,
  onClose,
  onSuccess,
  layoutWrapper: LayoutComponent = AdminLayout,
  redirectPath = '/admin/students'
}) => {
  const navigate = useNavigate();
  const urlParams = useParams();
  const targetId = editStudentId || urlParams.id;
  const isEditMode = Boolean(targetId);

  // Form States
  const [fullName, setFullName] = useState('');
  const [selectedClass, setSelectedClass] = useState('10th');
  const [medium, setMedium] = useState('Semi-English');
  const [subjects, setSubjects] = useState(['Mathematics']);
  const [schoolSelect, setSchoolSelect] = useState('Select School');
  const [customSchoolName, setCustomSchoolName] = useState('');
  const [address, setAddress] = useState('');
  const [dob, setDob] = useState('');
  const [studentMobile, setStudentMobile] = useState('');
  const [whatsAppNumber, setWhatsAppNumber] = useState('');
  const [totalFees, setTotalFees] = useState(25000);
  const [amountPaid, setAmountPaid] = useState(10000);
  const [paymentMode, setPaymentMode] = useState('Cash');
  const [date, setDate] = useState(getTodayDateString());

  // Dynamic Class-wise Student ID & Roll No Preview / Stored Values
  const [previewStudentId, setPreviewStudentId] = useState('');
  const [previewRollNo, setPreviewRollNo] = useState('');

  // Photo Upload States
  const [photo, setPhoto] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');

  // Loading, Success & Field Error States
  const [isLoadingExisting, setIsLoadingExisting] = useState(isEditMode);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [createdStudentData, setCreatedStudentData] = useState(null);

  const SCHOOL_OPTIONS = [
    'Select School',
    'Jay Bharat Vidyalaya',
    'Lalbahadur Shastri Vidyalaya',
    'Maharashtra Vidyalaya',
    'Shivaji Vidyalaya',
    'Modern English School',
    'Other'
  ];

  const availableSubjects = SUPPORTED_SUBJECTS;

  // Load Existing Student Data when in EDIT MODE
  useEffect(() => {
    if (!isEditMode || !targetId) return;

    const fetchExistingStudent = async () => {
      setIsLoadingExisting(true);
      setApiError('');
      try {
        const res = await getStudentByIdAPI(targetId);
        if (res && res.success && res.student) {
          const st = res.student;
          setFullName(st.fullname || st.name || '');
          setSelectedClass(st.standard || '10th');
          setMedium(st.medium || 'Semi-English');
          setSubjects(Array.isArray(st.subjects) && st.subjects.length > 0 ? st.subjects : ['Mathematics']);
          
          const sch = st.schoolName || '';
          if (SCHOOL_OPTIONS.includes(sch) && sch !== 'Select School' && sch !== 'Other') {
            setSchoolSelect(sch);
            setCustomSchoolName('');
          } else if (sch) {
            setSchoolSelect('Other');
            setCustomSchoolName(sch);
          } else {
            setSchoolSelect('Select School');
            setCustomSchoolName('');
          }

          setAddress(st.address || '');
          if (st.dateOfBirth) {
            setDob(new Date(st.dateOfBirth).toISOString().split('T')[0]);
          }
          setStudentMobile(st.mobile || '');
          setWhatsAppNumber(st.parentMobile || st.mobile || '');
          setTotalFees(st.totalFees !== undefined ? st.totalFees : 25000);
          setAmountPaid(st.amountPaid !== undefined ? st.amountPaid : 10000);
          setPaymentMode(st.paymentMode || 'Cash');
          if (st.admissionDate) {
            setDate(new Date(st.admissionDate).toISOString().split('T')[0]);
          }
          setPreviewStudentId(st.studentId || '');
          setPreviewRollNo(st.rollNo || '');

          if (st.photo) {
            setPhoto(st.photo);
            setPhotoPreview(getStudentPhotoUrl(st.photo));
          }
        } else {
          setApiError('Unable to load student details for editing.');
        }
      } catch (err) {
        setApiError('Unable to load student details. Please check backend connection.');
      } finally {
        setIsLoadingExisting(false);
      }
    };

    fetchExistingStudent();
  }, [targetId, isEditMode]);

  // Auto-fetch next class-wise Student ID whenever selectedClass changes (ADD MODE ONLY)
  useEffect(() => {
    if (isEditMode) return; // Strictly skip ID counter increment in Edit mode

    const fetchNextStudentId = async () => {
      try {
        const res = await getNextStudentIdAPI(selectedClass);
        if (res && res.success) {
          if (res.studentId) setPreviewStudentId(res.studentId);
          if (res.rollNo) setPreviewRollNo(res.rollNo);
        }
      } catch (err) {
        console.error('Error fetching next student ID:', err);
      }
    };

    fetchNextStudentId();
  }, [selectedClass, isEditMode]);

  // Lock background body scrolling when modal is open
  useEffect(() => {
    if (showSuccessModal || showProfileModal) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [showSuccessModal, showProfileModal]);

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    setShowProfileModal(false);
    if (isEditMode) {
      navigate('/admin/students');
    } else {
      resetForm();
    }
  };

  // Handle Photo Selection with format and size validation
  const handlePhotoChange = (e) => {
    setApiError('');
    setFieldErrors(prev => ({ ...prev, photo: '' }));
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    const validTypes = ['image/jpeg', 'image/jpg', 'image/png'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      setApiError('Invalid image format. Only JPG, JPEG, and PNG images are allowed.');
      e.target.value = '';
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setApiError('Image size exceeds allowed limit (5MB max).');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setPhoto(reader.result);
      setPhotoPreview(reader.result);
    };
    reader.readAsDataURL(file);
  };

  // Auto-calculated Balance Fees
  const balanceFees = Math.max(0, (Number(totalFees) || 0) - (Number(amountPaid) || 0));

  const handleSubjectToggle = (subj) => {
    setFieldErrors(prev => ({ ...prev, subjects: '' }));
    if (subjects.includes(subj)) {
      setSubjects(subjects.filter(s => s !== subj));
    } else {
      setSubjects([...subjects, subj]);
    }
  };

  const resetForm = () => {
    setFullName('');
    setSelectedClass('10th');
    setMedium('Semi-English');
    setSubjects(['Mathematics']);
    setSchoolSelect('Select School');
    setCustomSchoolName('');
    setAddress('');
    setDob('');
    setStudentMobile('');
    setWhatsAppNumber('');
    setTotalFees(25000);
    setAmountPaid(10000);
    setPaymentMode('Cash');
    setDate(getTodayDateString());
    setPhoto('');
    setPhotoPreview('');
    setFieldErrors({});
    setApiError('');
  };

  // Form Submission Handler (Connects to POST /api/students or PUT /api/students/:id)
  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    setFieldErrors({});

    const errors = {};

    if (!photo || !String(photo).trim()) {
      errors.photo = 'Student Photo is required.';
    }
    if (!fullName || !String(fullName).trim()) {
      errors.fullname = 'fullname is required.';
    }
    if (!selectedClass || !String(selectedClass).trim()) {
      errors.selectedClass = 'Class / Standard selection is required.';
    }
    if (!medium || !String(medium).trim()) {
      errors.medium = 'Medium selection is required.';
    }
    if (!Array.isArray(subjects) || subjects.length === 0) {
      errors.subjects = 'At least one subject must be selected.';
    }
    let resolvedSchoolName = '';
    if (schoolSelect === 'Select School') {
      errors.schoolName = 'School Name selection is required.';
    } else if (schoolSelect === 'Other') {
      if (!customSchoolName || !String(customSchoolName).trim()) {
        errors.schoolName = 'Please enter school name.';
      } else {
        resolvedSchoolName = customSchoolName.trim();
      }
    } else {
      resolvedSchoolName = schoolSelect;
    }
    if (!address || !String(address).trim()) {
      errors.address = 'Address is required.';
    }
    if (!dob || !String(dob).trim()) {
      errors.dob = 'Date of Birth is required.';
    }

    const mobileClean = String(studentMobile || '').trim();
    if (!mobileClean) {
      errors.studentMobile = 'Student Mobile Number is required.';
    } else if (!/^[0-9]{10}$/.test(mobileClean)) {
      errors.studentMobile = 'Student Mobile Number must be exactly 10 digits (e.g. 9876543210).';
    }

    const whatsAppClean = String(whatsAppNumber || '').trim();
    if (!whatsAppClean) {
      errors.whatsAppNumber = 'WhatsApp Number is required.';
    } else if (!/^[0-9]{10}$/.test(whatsAppClean)) {
      errors.whatsAppNumber = 'WhatsApp Number must be exactly 10 digits (e.g. 9876543210).';
    }

    if (!date || !String(date).trim()) {
      errors.date = 'Admission Date is required.';
    }

    if (totalFees === '' || totalFees === null || totalFees === undefined || isNaN(Number(totalFees))) {
      errors.totalFees = 'Total Fees is required.';
    } else if (Number(totalFees) < 0) {
      errors.totalFees = 'Total Fees cannot be negative.';
    }

    if (amountPaid === '' || amountPaid === null || amountPaid === undefined || isNaN(Number(amountPaid))) {
      errors.amountPaid = 'Amount Paid is required.';
    } else if (Number(amountPaid) < 0) {
      errors.amountPaid = 'Amount Paid cannot be negative.';
    } else if (Number(amountPaid) > Number(totalFees)) {
      errors.amountPaid = 'Amount Paid cannot exceed Total Fees.';
    }

    if (!paymentMode || !String(paymentMode).trim()) {
      errors.paymentMode = 'Payment Mode is required.';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      const firstErrorMsg = Object.values(errors)[0];
      setApiError(`Validation Error: ${firstErrorMsg}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const studentPayload = {
        studentId: previewStudentId || undefined,
        fullname: fullName.trim(),
        name: fullName.trim(),
        standard: selectedClass.trim(),
        medium: medium.trim(),
        subjects: subjects,
        mobile: mobileClean,
        parentName: fullName.trim() + ' (Parent/Guardian)',
        parentMobile: whatsAppClean,
        address: address.trim(),
        dateOfBirth: dob,
        schoolName: resolvedSchoolName,
        courseStream: (selectedClass === '11th' || selectedClass === '12th') ? 'PCM' : null,
        admissionDate: date,
        totalFees: Number(totalFees),
        amountPaid: Number(amountPaid),
        paymentMode: paymentMode.trim(),
        photo: photo,
        status: 'Active'
      };

      let res;
      if (isEditMode) {
        res = await updateStudentAPI(targetId, studentPayload);
      } else {
        res = await createStudentAPI(studentPayload);
      }

      if (res && res.success && res.student) {
        setCreatedStudentData(res.student);
        if (isModal && onSuccess) {
          onSuccess(res.student);
        } else {
          setShowSuccessModal(true);
        }
      } else {
        setApiError(res.message || (isEditMode ? 'Unable to update student.' : 'Unable to save student admission.'));
      }
    } catch (err) {
      setApiError(err.message || (isEditMode ? 'Unable to update student.' : 'Unable to save student admission. Please check backend connection.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formContent = (
    <div className="admission-form-wrapper" style={isModal ? { maxHeight: '85vh', overflowY: 'auto', padding: '1.25rem' } : {}}>
      {/* MODAL HEADER FOR ISMODAL MODE */}
      {isModal && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '2px solid #233F8F', paddingBottom: '0.6rem', marginBottom: '0.85rem' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', color: '#233F8F', fontWeight: 900, margin: 0 }}>
              Edit Student
            </h2>
            <span style={{ fontSize: '0.82rem', color: '#666', fontWeight: 600 }}>
              Update registered student details
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#EF4444', width: '32px', height: '32px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontWeight: 800 }}
            title="Close Modal"
          >
            <X size={18} />
          </button>
        </div>
      )}

      {/* API Error Banner */}
        {apiError && (
          <div style={{ background: '#FEF2F2', border: '1px solid #EF4444', color: '#991B1B', padding: '0.75rem 1.25rem', borderRadius: '6px', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 700, fontSize: '0.9rem' }}>
            <AlertCircle size={20} />
            <span>{apiError}</span>
          </div>
        )}

        {isLoadingExisting ? (
          <div style={{ textAlign: 'center', padding: '4rem 1rem' }}>
            <Loader2 size={42} className="spin-icon" color="#233F8F" style={{ margin: '0 auto 0.85rem auto' }} />
            <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#233F8F' }}>Loading existing student record...</div>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {/* 1. TOP HEADER */}
            <div className="template-header">
              <div className="template-header-left">
                <img src={logoImg} alt="Unique Classes Logo" className="template-logo" />
              </div>

              <div className="template-header-center">
                <h1 className="template-brand-title">UNIQUE CLASSES</h1>
                <p className="template-brand-tagline">Proper Application of Knowledge Moves to Progress</p>
              </div>

              <div className="template-header-right">
                <div><strong>Date *:</strong> 
                  <input 
                    type="date" 
                    value={date} 
                    onChange={e => setDate(e.target.value)} 
                    style={{ border: '1px solid #CCC', borderRadius: '4px', padding: '2px 4px', fontSize: '0.85rem', marginLeft: '4px' }} 
                  />
                </div>
                <div style={{ marginTop: '4px', display: 'flex', flexDirection: 'column', gap: '2px', textAlign: 'right' }}>
                  <div><strong>Roll No:</strong> <span style={{ color: '#233F8F', fontWeight: 900 }}>{createdStudentData && createdStudentData.rollNo ? createdStudentData.rollNo : (previewRollNo || 1)}</span></div>
                  <div><strong>Student ID:</strong> <span style={{ color: '#233F8F', fontWeight: 900 }}>{createdStudentData && createdStudentData.studentId ? createdStudentData.studentId : (previewStudentId || 'Loading...')}</span></div>
                </div>
              </div>
            </div>

            <div className="template-blue-divider"></div>
            <div className="template-doc-heading">{isEditMode ? 'EDIT STUDENT ADMISSION FORM' : 'ADMISSION FORM'}</div>

            {/* 2. STUDENT INFORMATION SECTION */}
            <div className="template-section-box">
              <div className="template-section-badge">Student Information</div>

              {/* STUDENT PHOTO FIELD */}
              <div style={{ marginBottom: '1rem', background: '#FAF7F0', border: fieldErrors.photo ? '1.5px solid #EF4444' : '1px dashed #D4AF37', padding: '0.85rem 1rem', borderRadius: '8px' }}>
                <label className="t-label" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.5rem' }}>
                  <Camera size={16} color="#233F8F" /> Student Photo *
                </label>

                {photoPreview ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div style={{ width: '95px', height: '95px', borderRadius: '8px', border: '2px solid #233F8F', overflow: 'hidden', background: '#F1F5F9', boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
                      <img src={photoPreview} alt="Student Photo Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                    </div>
                    <div>
                      <label
                        htmlFor="student-photo-input"
                        style={{ background: '#233F8F', color: '#FFF', padding: '0.45rem 1rem', borderRadius: '6px', fontSize: '0.82rem', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
                      >
                        <Upload size={14} /> Change Photo
                      </label>
                      <div style={{ fontSize: '0.73rem', color: '#64748B', marginTop: '0.4rem', fontWeight: 600 }}>
                        JPG, JPEG, or PNG (Max 5MB)
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <label
                      htmlFor="student-photo-input"
                      style={{ background: '#FFFFFF', border: '1.5px dashed #233F8F', borderRadius: '8px', padding: '0.65rem 1.15rem', display: 'inline-flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', color: '#233F8F', fontWeight: 800, fontSize: '0.85rem' }}
                    >
                      <Upload size={16} /> Choose Photo *
                    </label>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>
                      Supported: JPG, JPEG, PNG (Max 5MB)
                    </span>
                  </div>
                )}

                <input
                  id="student-photo-input"
                  type="file"
                  accept="image/jpeg,image/png,image/jpg"
                  onChange={handlePhotoChange}
                  style={{ display: 'none' }}
                />
                {fieldErrors.photo && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.35rem', fontWeight: 700 }}>{fieldErrors.photo}</div>}
              </div>

              {/* FULL NAME */}
              <div className="t-grid-full" style={{ marginBottom: '0.75rem' }}>
                <label className="t-label">fullname *</label>
                <input
                  type="text"
                  name="fullname"
                  required
                  placeholder="Enter Student Full Name"
                  className="t-input"
                  value={fullName}
                  onChange={e => {
                    setFullName(e.target.value);
                    setFieldErrors(prev => ({ ...prev, fullname: '', fullName: '' }));
                  }}
                  style={{ borderColor: (fieldErrors.fullname || fieldErrors.fullName) ? '#EF4444' : undefined }}
                />
                {(fieldErrors.fullname || fieldErrors.fullName) && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 700 }}>{fieldErrors.fullname || fieldErrors.fullName}</div>}
              </div>

              {/* CLASS & MEDIUM ROW */}
              <div className="t-grid-2" style={{ marginBottom: '0.75rem' }}>
                <div>
                  <label className="t-label">Class / Standard *</label>
                  <select
                    disabled={isEditMode}
                    className="t-select"
                    style={{ width: '100%', borderColor: fieldErrors.selectedClass ? '#EF4444' : undefined, background: isEditMode ? '#F8F5EC' : undefined, cursor: isEditMode ? 'not-allowed' : 'pointer' }}
                    value={selectedClass}
                    onChange={e => {
                      setSelectedClass(e.target.value);
                      setFieldErrors(prev => ({ ...prev, selectedClass: '' }));
                    }}
                  >
                    {SUPPORTED_CLASSES.map((cls) => (
                      <option key={cls} value={cls}>{cls}</option>
                    ))}
                  </select>
                  {isEditMode && <span style={{ fontSize: '0.72rem', color: '#6B7280', fontWeight: 600, marginTop: '2px', display: 'block' }}>(Class cannot be changed during editing)</span>}
                  {fieldErrors.selectedClass && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 700 }}>{fieldErrors.selectedClass}</div>}
                </div>

                <div>
                  <label className="t-label">Medium *</label>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '0.35rem' }}>
                    {['Marathi', 'English', 'Semi-English'].map((med) => (
                      <label key={med} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                        <input
                          type="radio"
                          name="medium"
                          value={med}
                          checked={medium === med}
                          onChange={e => {
                            setMedium(e.target.value);
                            setFieldErrors(prev => ({ ...prev, medium: '' }));
                          }}
                          style={{ accentColor: '#233F8F' }}
                        />
                        <span>{med}</span>
                      </label>
                    ))}
                  </div>
                  {fieldErrors.medium && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 700 }}>{fieldErrors.medium}</div>}
                </div>
              </div>

              {/* SUBJECTS CHECKBOXES */}
              <div style={{ marginBottom: '0.75rem' }}>
                <label className="t-label">Subjects * (Select at least one):</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.15rem', marginTop: '0.25rem' }}>
                  {availableSubjects.map((subj) => (
                    <label key={subj} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.85rem', cursor: 'pointer', fontWeight: 600 }}>
                      <input
                        type="checkbox"
                        checked={subjects.includes(subj)}
                        onChange={() => handleSubjectToggle(subj)}
                        style={{ width: '15px', height: '15px', accentColor: '#233F8F', cursor: 'pointer' }}
                      />
                      <span>{subj}</span>
                    </label>
                  ))}
                </div>
                {fieldErrors.subjects && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 700 }}>{fieldErrors.subjects}</div>}
              </div>

              {/* SCHOOL NAME DROPDOWN & OTHER CUSTOM INPUT */}
              <div className="t-grid-full" style={{ marginBottom: '0.75rem' }}>
                <label className="t-label">School Name *</label>
                <select
                  className="t-select"
                  style={{ width: '100%', borderColor: fieldErrors.schoolName ? '#EF4444' : undefined }}
                  value={schoolSelect}
                  onChange={e => {
                    setSchoolSelect(e.target.value);
                    setFieldErrors(prev => ({ ...prev, schoolName: '' }));
                  }}
                >
                  {SCHOOL_OPTIONS.map((sch) => (
                    <option key={sch} value={sch} disabled={sch === 'Select School'}>
                      {sch}
                    </option>
                  ))}
                </select>

                {schoolSelect === 'Other' && (
                  <div style={{ marginTop: '0.5rem' }}>
                    <label className="t-label">Other School Name *</label>
                    <input
                      type="text"
                      placeholder="Enter school name"
                      className="t-input"
                      value={customSchoolName}
                      onChange={e => {
                        setCustomSchoolName(e.target.value);
                        setFieldErrors(prev => ({ ...prev, schoolName: '' }));
                      }}
                      style={{ width: '100%', borderColor: fieldErrors.schoolName ? '#EF4444' : undefined }}
                    />
                  </div>
                )}
                {fieldErrors.schoolName && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 700 }}>{fieldErrors.schoolName}</div>}
              </div>

              {/* ADDRESS & DATE OF BIRTH ROW */}
              <div className="t-grid-2">
                <div>
                  <label className="t-label">Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Street / Village address"
                    className="t-input"
                    value={address}
                    onChange={e => {
                      setAddress(e.target.value);
                      setFieldErrors(prev => ({ ...prev, address: '' }));
                    }}
                    style={{ width: '100%', borderColor: fieldErrors.address ? '#EF4444' : undefined }}
                  />
                  {fieldErrors.address && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 700 }}>{fieldErrors.address}</div>}
                </div>

                <div>
                  <label className="t-label">Date of Birth *</label>
                  <input
                    type="date"
                    required
                    className="t-input"
                    value={dob}
                    onChange={e => {
                      setDob(e.target.value);
                      setFieldErrors(prev => ({ ...prev, dob: '' }));
                    }}
                    style={{ width: '100%', borderColor: fieldErrors.dob ? '#EF4444' : undefined }}
                  />
                  {fieldErrors.dob && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 700 }}>{fieldErrors.dob}</div>}
                </div>
              </div>
            </div>

            {/* 3. CONTACT DETAILS SECTION */}
            <div className="template-section-box">
              <div className="template-section-badge">Contact Details</div>

              <div className="t-grid-2">
                <div>
                  <label className="t-label">Student Mobile * (10 Digits)</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    className="t-input"
                    value={studentMobile}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setStudentMobile(val);
                      setFieldErrors(prev => ({ ...prev, studentMobile: '' }));
                    }}
                    style={{ width: '100%', borderColor: fieldErrors.studentMobile ? '#EF4444' : undefined }}
                  />
                  {fieldErrors.studentMobile && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 700 }}>{fieldErrors.studentMobile}</div>}
                </div>

                <div>
                  <label className="t-label">WhatsApp Number * (10 Digits)</label>
                  <input
                    type="tel"
                    required
                    maxLength={10}
                    placeholder="e.g. 9876543210"
                    className="t-input"
                    value={whatsAppNumber}
                    onChange={e => {
                      const val = e.target.value.replace(/\D/g, '').slice(0, 10);
                      setWhatsAppNumber(val);
                      setFieldErrors(prev => ({ ...prev, whatsAppNumber: '' }));
                    }}
                    style={{ width: '100%', borderColor: fieldErrors.whatsAppNumber ? '#EF4444' : undefined }}
                  />
                  {fieldErrors.whatsAppNumber && <div style={{ color: '#DC2626', fontSize: '0.78rem', marginTop: '0.25rem', fontWeight: 700 }}>{fieldErrors.whatsAppNumber}</div>}
                </div>
              </div>
            </div>

            {/* 4. FEE DETAILS SECTION */}
            <div className="template-section-box">
              <div className="template-section-badge">Fee Details</div>

              <div className="t-grid-4">
                <div className="t-fee-field">
                  <label className="t-fee-label">Total Fees *</label>
                  <input
                    type="number"
                    required
                    className="t-input"
                    value={totalFees}
                    onChange={e => {
                      setTotalFees(e.target.value);
                      setFieldErrors(prev => ({ ...prev, totalFees: '' }));
                    }}
                    style={{ borderColor: fieldErrors.totalFees ? '#EF4444' : undefined }}
                  />
                  {fieldErrors.totalFees && <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', fontWeight: 700 }}>{fieldErrors.totalFees}</div>}
                </div>

                <div className="t-fee-field">
                  <label className="t-fee-label">Amount Paid *</label>
                  <input
                    type="number"
                    required
                    className="t-input"
                    value={amountPaid}
                    onChange={e => {
                      setAmountPaid(e.target.value);
                      setFieldErrors(prev => ({ ...prev, amountPaid: '' }));
                    }}
                    style={{ borderColor: fieldErrors.amountPaid ? '#EF4444' : undefined }}
                  />
                  {fieldErrors.amountPaid && <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', fontWeight: 700 }}>{fieldErrors.amountPaid}</div>}
                </div>

                <div className="t-fee-field">
                  <label className="t-fee-label">Payment Mode *</label>
                  <select
                    className="t-select"
                    value={paymentMode}
                    onChange={e => {
                      setPaymentMode(e.target.value);
                      setFieldErrors(prev => ({ ...prev, paymentMode: '' }));
                    }}
                    style={{ borderColor: fieldErrors.paymentMode ? '#EF4444' : undefined }}
                  >
                    <option value="Cash">Cash</option>
                    <option value="Online">Online</option>
                    <option value="UPI">UPI</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                  </select>
                  {fieldErrors.paymentMode && <div style={{ color: '#DC2626', fontSize: '0.75rem', marginTop: '0.2rem', fontWeight: 700 }}>{fieldErrors.paymentMode}</div>}
                </div>

                <div className="t-fee-field">
                  <label className="t-fee-label">Balance Fees</label>
                  <input
                    type="number"
                    readOnly
                    className="t-input"
                    value={balanceFees}
                    style={{ background: '#F8F5EC', fontWeight: 800, color: '#EF4444' }}
                  />
                </div>
              </div>
            </div>

            {/* 5. DECLARATION & SIGNATURES SECTION */}
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

            {/* FOOTER SECTION INSIDE FORM */}
            <div className="t-footer-block">
              <div className="t-footer-address">
                <strong>UNIQUE CLASSES</strong><br />
                Bank Colony Road, Nilanga<br />
                Contact: +91 8308433436
              </div>

              {/* CENTERED ACTION BUTTON GROUP */}
              <div className="admission-actions no-print">
                <button type="submit" className="t-submit-btn" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                      <Loader2 size={16} className="spin-icon" /> {isEditMode ? 'Updating...' : 'Saving...'}
                    </span>
                  ) : (
                    isEditMode ? 'Update Student' : 'Submit Admission'
                  )}
                </button>

                <button type="button" onClick={handlePrint} className="t-print-btn">
                  <Printer size={16} /> Print
                </button>

                {!isModal ? (
                  <span className="t-back-link" onClick={() => navigate('/admin/students')}>
                    Back to All Students
                  </span>
                ) : (
                  <button type="button" onClick={onClose} className="t-back-link">
                    Close
                  </button>
                )}
              </div>
            </div>
          </form>
        )}

        {/* SUCCESS MODAL WITH REAL BACKEND STUDENT ID */}
        {showSuccessModal && createdStudentData && ReactDOM.createPortal(
          <div
            className="no-print"
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
            onClick={handleCloseSuccessModal}
          >
            <div
              style={{
                background: '#FFFFFF',
                border: '2px solid #D4AF37',
                borderRadius: '12px',
                padding: '1.75rem',
                maxWidth: '540px',
                width: '92%',
                boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                textAlign: 'center',
                position: 'relative'
              }}
              onClick={e => e.stopPropagation()}
            >
              <CheckCircle2 size={56} color="#10B981" style={{ margin: '0 auto 0.75rem auto' }} />
              <h3 style={{ fontSize: '1.45rem', fontWeight: 900, color: '#171717', margin: '0 0 0.3rem 0' }}>
                {isEditMode ? 'Student Details Updated ✓' : 'Admission Successful ✓'}
              </h3>
              <p style={{ fontSize: '0.92rem', color: '#555', margin: '0 0 1.25rem 0', fontWeight: 600 }}>
                {isEditMode ? 'Student details updated successfully.' : 'Student has been registered successfully.'}
              </p>

              <div style={{ background: '#FAF7F0', border: '1px solid #E2DBD0', borderRadius: '8px', padding: '1rem', textAlign: 'left', marginBottom: '1.5rem', fontSize: '0.88rem', lineHeight: 1.6 }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem 1rem' }}>
                  <div><strong>fullname:</strong> <span style={{ color: '#1E3A8A', fontWeight: 800 }}>{createdStudentData.fullname || createdStudentData.name}</span></div>
                  <div><strong>Student ID:</strong> <span style={{ color: '#233F8F', fontWeight: 900 }}>{createdStudentData.studentId || 'N/A'}</span></div>
                  <div><strong>Roll No:</strong> <span style={{ color: '#233F8F', fontWeight: 900 }}>{createdStudentData.rollNo || 'N/A'}</span></div>
                  <div><strong>Class:</strong> {createdStudentData.standard} ({createdStudentData.medium || 'Semi-English'})</div>
                  <div><strong>School:</strong> {createdStudentData.schoolName || 'N/A'}</div>
                  <div><strong>Subjects:</strong> {Array.isArray(createdStudentData.subjects) ? createdStudentData.subjects.join(', ') : 'N/A'}</div>
                  <div><strong>Mobile:</strong> {createdStudentData.mobile}</div>
                  <div><strong>WhatsApp:</strong> {createdStudentData.parentMobile || createdStudentData.mobile}</div>
                  <div><strong>Admission Date:</strong> {new Date(createdStudentData.admissionDate).toLocaleDateString('en-GB')}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'center', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => navigate('/admin/students')}
                  style={{ background: '#1E3A8A', color: '#FFF', border: 'none', padding: '0.6rem 1.15rem', borderRadius: '6px', fontWeight: 800, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.88rem' }}
                >
                  <Eye size={16} /> Back to All Students
                </button>
                <button
                  type="button"
                  onClick={handlePrint}
                  style={{ background: '#D4AF37', color: '#080808', border: 'none', padding: '0.6rem 1.15rem', borderRadius: '6px', fontWeight: 900, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '5px', fontSize: '0.88rem' }}
                >
                  <Printer size={16} /> Print
                </button>
                <button
                  type="button"
                  onClick={handleCloseSuccessModal}
                  style={{ background: '#F8F5EC', border: '1px solid #C4C4C4', color: '#171717', padding: '0.6rem 1.15rem', borderRadius: '6px', fontWeight: 700, cursor: 'pointer', fontSize: '0.88rem' }}
                >
                  Close
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
      </div>
  );

  if (isModal) {
    return formContent;
  }

  return (
    <LayoutComponent>
      {formContent}
    </LayoutComponent>
  );
};

export default NewAdmission;
