import React, { useState, useEffect, useContext } from 'react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { AuthContext } from '../../context/AuthContext';
import {
  FileText,
  Plus,
  Trash2,
  FileCheck,
  Paperclip,
  Calendar,
  BookOpen,
  Loader2,
  X,
  Eye,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { getAssignmentsAPI, createAssignmentAPI, deleteAssignmentAPI, getTeacherAssignmentAllocationsAPI, getAuthenticatedTeacherProfileAPI } from '../../services/api';
import { getActiveTeacherId } from '../../config/teacherConfig';
import { CANONICAL_SUBJECTS, JUNIOR_SUBJECTS, SENIOR_SUBJECTS, isSeniorStandard, normalizeSubject } from '../../utils/subjectUtils';

const SUPPORTED_CLASSES = ['5th', '6th', '7th', '8th', '9th', '10th', '11th', '12th'];

const TeacherAssignments = () => {
  const { teacherProfile, user } = useContext(AuthContext) || {};
  const currentTeacherId = teacherProfile?.id || teacherProfile?._id || user?.teacher_id;
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterClass, setFilterClass] = useState('All');
  const [filterSubject, setFilterSubject] = useState('All');

  // Teacher Allocations state
  const [teacherAllocations, setTeacherAllocations] = useState([]);
  const [allocatedClasses, setAllocatedClasses] = useState([]);
  const [loadingAllocations, setLoadingAllocations] = useState(true);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Form State
  const [title, setTitle] = useState('');
  const [standard, setStandard] = useState('10th');
  const [subject, setSubject] = useState('Mathematics');
  const [description, setDescription] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [attachmentBase64, setAttachmentBase64] = useState('');
  const [attachmentName, setAttachmentName] = useState('');
  const [attachmentType, setAttachmentType] = useState('');

  // Detail Modal State
  const [viewAssignment, setViewAssignment] = useState(null);

  // Fetch Teacher Class + Subject Allocations
  const fetchAllocations = async () => {
    setLoadingAllocations(true);
    try {
      const profRes = await getAuthenticatedTeacherProfileAPI();
      if (profRes && profRes.success && profRes.teacher) {
        const t = profRes.teacher;
        const classes = Array.isArray(t.classes) ? t.classes : ['10th'];
        const subjects = Array.isArray(t.subjects) ? t.subjects : ['Mathematics'];
        const allocs = classes.map(cls => ({ standard: cls, subjects }));
        setTeacherAllocations(allocs);
        setAllocatedClasses(classes);
        if (classes.length > 0) {
          setStandard(classes[0]);
          const firstSub = subjects.length > 0 ? subjects[0] : 'Mathematics';
          setSubject(firstSub);
        }
      }
    } catch (err) {
      console.warn('Teacher allocations fetch notice:', err);
    } finally {
      setLoadingAllocations(false);
    }
  };

  useEffect(() => {
    fetchAllocations();
  }, []);

  // Compute available subjects strictly for selected form class
  const currentAllocation = teacherAllocations.find(a => a.standard === standard);
  const availableFormSubjects = currentAllocation && Array.isArray(currentAllocation.subjects)
    ? currentAllocation.subjects
    : [];

  // Filter options strictly based on teacher allocations
  const filterClassOptions = allocatedClasses.length > 0 ? allocatedClasses : SUPPORTED_CLASSES;

  const availableFilterSubjects = (() => {
    if (teacherAllocations.length === 0) {
      return filterClass === 'All'
        ? CANONICAL_SUBJECTS
        : (isSeniorStandard(filterClass) ? SENIOR_SUBJECTS : JUNIOR_SUBJECTS);
    }

    if (filterClass === 'All') {
      const allSubjs = teacherAllocations.flatMap(a => a.subjects || []);
      return [...new Set(allSubjs)];
    }

    const matchedAlloc = teacherAllocations.find(a => a.standard === filterClass);
    return matchedAlloc && Array.isArray(matchedAlloc.subjects) ? matchedAlloc.subjects : [];
  })();

  // Reset filterSubject if no longer available when filterClass changes
  useEffect(() => {
    if (filterSubject !== 'All' && availableFilterSubjects.length > 0 && !availableFilterSubjects.includes(filterSubject)) {
      setFilterSubject('All');
    }
  }, [filterClass, availableFilterSubjects, filterSubject]);

  // Reset subject if stale / not available for new standard
  useEffect(() => {
    if (availableFormSubjects.length > 0) {
      if (!availableFormSubjects.includes(subject)) {
        setSubject(availableFormSubjects[0]);
      }
    } else {
      setSubject('');
    }
  }, [standard, teacherAllocations]);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await getAssignmentsAPI({ teacherId: currentTeacherId, standard: filterClass, subject: filterSubject });
      if (res.success && Array.isArray(res.assignments)) {
        setAssignments(res.assignments);
      } else {
        setAssignments([]);
      }
    } catch (err) {
      console.error('Error fetching assignments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAssignments();
  }, [filterClass, filterSubject, currentTeacherId]);

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFormError('');

    // Validate file type
    const validExtensions = ['jpg', 'jpeg', 'png', 'pdf'];
    const ext = file.name.split('.').pop().toLowerCase();
    if (!validExtensions.includes(ext)) {
      setFormError('Invalid file format. Only JPG, JPEG, PNG, and PDF files are allowed.');
      e.target.value = '';
      return;
    }

    // Validate file size (10MB)
    if (file.size > 10 * 1024 * 1024) {
      setFormError('File size exceeds 10MB limit. Please select a smaller file.');
      e.target.value = '';
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAttachmentBase64(reader.result);
      setAttachmentName(file.name);
      setAttachmentType(ext === 'pdf' ? 'PDF' : 'Image');
    };
    reader.onerror = () => {
      setFormError('Failed to read file. Please try again.');
    };
    reader.readAsDataURL(file);
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!title.trim()) {
      setFormError('Assignment title is required');
      return;
    }
    if (!dueDate) {
      setFormError('Due date is required');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: title.trim(),
        standard,
        subject: normalizeSubject(subject, standard),
        description: description.trim(),
        dueDate,
        attachment: attachmentBase64,
        attachmentName
      };

      const res = await createAssignmentAPI(payload);
      if (res.success) {
        setSuccessMsg('Assignment published successfully!');
        setTimeout(() => setSuccessMsg(''), 4000);
        setShowModal(false);
        // Reset Form
        setTitle('');
        setDescription('');
        setDueDate('');
        setAttachmentBase64('');
        setAttachmentName('');
        setAttachmentType('');
        fetchAssignments();
      } else {
        setFormError(res.message || 'Failed to create assignment');
      }
    } catch (err) {
      setFormError(err.message || 'Error publishing assignment');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this assignment?')) return;
    try {
      const res = await deleteAssignmentAPI(id);
      if (res.success) {
        setAssignments(prev => prev.filter(a => a._id !== id));
      }
    } catch (err) {
      alert(err.message || 'Error deleting assignment');
    }
  };

  return (
    <TeacherLayout>
      <div style={{ padding: '1.25rem 1rem 3rem 1rem', maxWidth: '1200px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.5rem' }}>
          <div>
            <h2 style={{ margin: 0, color: '#1E3A8A', fontWeight: 900, fontSize: '1.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={24} color="#1E3A8A" /> Teacher Assignments
            </h2>
            <p style={{ margin: '0.2rem 0 0 0', color: '#64748B', fontSize: '0.85rem' }}>
              Create homework & assignments with PDF / Photo attachments for students.
            </p>
          </div>

          <button
            onClick={() => {
              setFormError('');
              setShowModal(true);
            }}
            style={{
              background: '#1E3A8A',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: '10px',
              padding: '0.75rem 1.25rem',
              fontWeight: 800,
              fontSize: '0.9rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              boxShadow: '0 4px 12px rgba(30, 58, 138, 0.2)'
            }}
          >
            <Plus size={18} /> Create Assignment
          </button>
        </div>

        {/* Success Alert */}
        {successMsg && (
          <div style={{ background: '#ECFDF5', border: '1px solid #6EE7B7', color: '#065F46', padding: '0.85rem 1rem', borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <CheckCircle2 size={18} /> {successMsg}
          </div>
        )}

        {/* Filters */}
        <div style={{ background: '#FFFFFF', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569' }}>Class:</span>
            <select
              value={filterClass}
              onChange={(e) => setFilterClass(e.target.value)}
              style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, background: '#F8FAFC' }}
            >
              <option value="All">All Classes</option>
              {filterClassOptions.map(cls => (
                <option key={cls} value={cls}>{cls}</option>
              ))}
            </select>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.82rem', fontWeight: 800, color: '#475569' }}>Subject:</span>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value)}
              style={{ padding: '0.5rem 0.8rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.85rem', fontWeight: 700, background: '#F8FAFC' }}
            >
              <option value="All">All Subjects</option>
              {availableFilterSubjects.map(sub => (
                <option key={sub} value={sub}>{sub}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Assignment List Grid */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#64748B', fontWeight: 700 }}>
            <Loader2 size={32} className="spin-icon" style={{ margin: '0 auto 0.5rem auto' }} />
            <div>Loading assignments...</div>
          </div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', color: '#64748B' }}>
            <FileText size={48} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ margin: 0, color: '#1E293B' }}>No assignments published yet</h3>
            <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.88rem' }}>Click "Create Assignment" to add homework for students.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '1.25rem' }}>
            {assignments.map((item) => {
              const formattedDue = new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              const isOverdue = item.status === 'Overdue';
              const isDueSoon = item.status === 'Due Soon';

              return (
                <div
                  key={item._id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    padding: '1.25rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    position: 'relative'
                  }}
                >
                  <div>
                    {/* Header tags */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ background: '#EFF6FF', color: '#1E3A8A', fontWeight: 800, fontSize: '0.75rem', padding: '0.25rem 0.65rem', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                        {item.standard} • {item.subject}
                      </span>

                      <span style={{
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '6px',
                        background: isOverdue ? '#FEF2F2' : isDueSoon ? '#FFFBEB' : '#ECFDF5',
                        color: isOverdue ? '#DC2626' : isDueSoon ? '#D97706' : '#059669',
                        border: `1px solid ${isOverdue ? '#FCA5A5' : isDueSoon ? '#FCD34D' : '#6EE7B7'}`
                      }}>
                        {item.status}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.5rem 0', color: '#0F172A', fontSize: '1.05rem', fontWeight: 800 }}>
                      📚 {item.title}
                    </h4>

                    {item.description && (
                      <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0 0 0.85rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ fontSize: '0.8rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.5rem' }}>
                      <Calendar size={14} color="#1E3A8A" /> Due: <strong style={{ color: '#1E293B' }}>{formattedDue}</strong>
                    </div>

                    {item.attachmentUrl && (
                      <div style={{ fontSize: '0.78rem', color: '#2563EB', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '0.3rem', marginBottom: '0.85rem' }}>
                        <Paperclip size={14} /> Attachment: {item.attachmentType === 'PDF' ? '📄 PDF Document' : '🖼️ Image Photo'}
                      </div>
                    )}
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.85rem', borderTop: '1px solid #F1F5F9' }}>
                    <button
                      onClick={() => setViewAssignment(item)}
                      style={{ flex: 1, padding: '0.55rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', color: '#1E293B', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.3rem' }}
                    >
                      <Eye size={15} /> View Details
                    </button>
                    <button
                      onClick={() => handleDelete(item._id)}
                      style={{ padding: '0.55rem 0.8rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '8px', color: '#DC2626', fontWeight: 700, fontSize: '0.82rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CREATE ASSIGNMENT MODAL */}
        {showModal && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.7)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '520px', width: '100%', padding: '1.5rem', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <h3 style={{ margin: 0, color: '#1E3A8A', fontWeight: 900, fontSize: '1.2rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FileText size={20} color="#1E3A8A" /> Publish New Assignment
                </h3>
                <button onClick={() => setShowModal(false)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} color="#64748B" />
                </button>
              </div>

              {formError && (
                <div style={{ background: '#FEF2F2', border: '1px solid #FCA5A5', color: '#DC2626', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <AlertCircle size={16} /> {formError}
                </div>
              )}

              <form onSubmit={handleCreateSubmit}>
                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                    Assignment Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chapter 2 Practice Problems"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                      Class / Standard *
                    </label>
                    <select
                      value={standard}
                      onChange={(e) => setStandard(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#FFFFFF', boxSizing: 'border-box' }}
                    >
                      {loadingAllocations ? (
                        <option value="">Loading classes...</option>
                      ) : allocatedClasses.length > 0 ? (
                        allocatedClasses.map(cls => (
                          <option key={cls} value={cls}>{cls}</option>
                        ))
                      ) : (
                        <option value="">No classes allocated</option>
                      )}
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                      Subject *
                    </label>
                    <select
                      value={subject}
                      onChange={(e) => setSubject(e.target.value)}
                      style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', background: '#FFFFFF', boxSizing: 'border-box' }}
                    >
                      {loadingAllocations ? (
                        <option value="">Loading subjects...</option>
                      ) : availableFormSubjects.length > 0 ? (
                        availableFormSubjects.map(sub => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))
                      ) : (
                        <option value="">No subjects allocated</option>
                      )}
                    </select>
                  </div>
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                    Due Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box' }}
                  />
                </div>

                <div style={{ marginBottom: '1rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                    Description
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Provide instructions for students..."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: '8px', border: '1px solid #CBD5E1', fontSize: '0.9rem', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                <div style={{ marginBottom: '1.5rem' }}>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 800, color: '#334155', marginBottom: '0.3rem' }}>
                    Attachment (Optional: JPG, PNG, PDF max 10MB)
                  </label>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileChange}
                    style={{ width: '100%', fontSize: '0.85rem' }}
                  />
                  {attachmentName && (
                    <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginTop: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <CheckCircle2 size={14} /> Selected: {attachmentName} ({attachmentType})
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    style={{ padding: '0.65rem 1.25rem', background: '#F1F5F9', border: '1px solid #CBD5E1', borderRadius: '8px', fontWeight: 700, color: '#475569', cursor: 'pointer' }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    style={{ padding: '0.65rem 1.5rem', background: '#1E3A8A', color: '#FFFFFF', border: 'none', borderRadius: '8px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem' }}
                  >
                    {submitting ? <Loader2 size={16} className="spin-icon" /> : 'Publish Assignment'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* VIEW ASSIGNMENT DETAIL MODAL */}
        {viewAssignment && (
          <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
            <div style={{ background: '#FFFFFF', borderRadius: '16px', maxWidth: '600px', width: '100%', padding: '1.5rem', maxHeight: '90vh', overflowY: 'auto' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <div>
                  <span style={{ background: '#EFF6FF', color: '#1E3A8A', fontWeight: 800, fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                    {viewAssignment.standard} Standard • {viewAssignment.subject}
                  </span>
                  <h3 style={{ margin: '0.4rem 0 0 0', color: '#0F172A', fontWeight: 900, fontSize: '1.25rem' }}>
                    📚 {viewAssignment.title}
                  </h3>
                </div>
                <button onClick={() => setViewAssignment(null)} style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <X size={18} color="#64748B" />
                </button>
              </div>

              <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '1rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                <span>📅 Posted: <strong>{new Date(viewAssignment.postedDate || viewAssignment.createdAt).toLocaleDateString('en-GB')}</strong></span>
                <span>⏰ Due: <strong>{new Date(viewAssignment.dueDate).toLocaleDateString('en-GB')}</strong></span>
                <span>Teacher: <strong>{viewAssignment.teacher || 'Unique Classes Faculty'}</strong></span>
              </div>

              {viewAssignment.description && (
                <div style={{ background: '#F8FAFC', padding: '1rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', color: '#334155', fontSize: '0.9rem', lineHeight: '1.5' }}>
                  <strong>Description:</strong>
                  <p style={{ margin: '0.4rem 0 0 0' }}>{viewAssignment.description}</p>
                </div>
              )}

              {/* Attachment Preview / View Button */}
              {viewAssignment.attachmentUrl && (
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#1E3A8A', fontSize: '0.95rem', fontWeight: 800 }}>
                    📎 Attachment ({viewAssignment.attachmentType})
                  </h4>

                  {viewAssignment.attachmentType === 'Image' ? (
                    <div style={{ textAlign: 'center', background: '#F8FAFC', padding: '0.5rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                      <img
                        src={viewAssignment.attachmentUrl}
                        alt="Assignment attachment"
                        style={{ maxWidth: '100%', maxHeight: '350px', borderRadius: '8px', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1rem', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#1E3A8A', fontWeight: 800, fontSize: '0.9rem' }}>
                        <Paperclip size={20} /> PDF Document
                      </div>
                      <a
                        href={viewAssignment.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ background: '#1E3A8A', color: '#FFFFFF', padding: '0.55rem 1.1rem', borderRadius: '8px', textDecoration: 'none', fontWeight: 800, fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                      >
                        Open PDF In Browser
                      </a>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </TeacherLayout>
  );
};

export default TeacherAssignments;
