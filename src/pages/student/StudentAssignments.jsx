import React, { useState, useEffect, useCallback } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import {
  FileText,
  Calendar,
  Clock,
  Paperclip,
  Eye,
  Loader2,
  AlertCircle,
  X,
  User,
  CheckCircle2,
  FileCheck
} from 'lucide-react';
import {
  getCurrentStudentProfileAPI,
  getStudentAssignmentsAPI
} from '../../services/api';
import { getStudentAcademicSubjects } from '../../utils/subjectUtils';

const StudentAssignments = () => {
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Selected assignment for Modal View
  const [selectedAssignment, setSelectedAssignment] = useState(null);

  // Filter state (Subject filter within student's class)
  const [subjectFilter, setSubjectFilter] = useState('All');

  // Step 1: Resolve Authenticated Student Identity & Fetch Assignments
  const loadData = useCallback(async () => {
    setLoadingStudent(true);
    setLoading(true);
    setErrorMsg('');

    try {
      const searchParams = new URLSearchParams(window.location.search);
      const queryStudentId = searchParams.get('studentId') || searchParams.get('id');
      if (queryStudentId) {
        localStorage.setItem('studentId', queryStudentId);
        localStorage.setItem('currentStudentId', queryStudentId);
      }
      const savedStudentId = queryStudentId || localStorage.getItem('studentId') || localStorage.getItem('currentStudentId');

      const meRes = await getCurrentStudentProfileAPI(savedStudentId || undefined);

      if (meRes && meRes.success && meRes.student) {
        const stdDoc = meRes.student;
        setStudent(stdDoc);

        const sId = stdDoc._id || stdDoc.id || stdDoc.studentId;
        const res = await getStudentAssignmentsAPI(sId);
        if (res && res.success && Array.isArray(res.assignments)) {
          setAssignments(res.assignments);
        } else {
          setAssignments([]);
        }
      } else {
        setStudent(null);
        setErrorMsg('Unable to locate active student profile. Please log in again.');
      }
    } catch (err) {
      console.error('Error loading student assignments:', err);
      setErrorMsg('Unable to load assignments. Please check your connection.');
    } finally {
      setLoadingStudent(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const registeredSubjects = student ? getStudentAcademicSubjects(student) : [];
  const filterOptions = registeredSubjects.length > 0 ? ['All', ...registeredSubjects] : [];

  // Reset invalid filter to 'All' if student/class changes
  useEffect(() => {
    if (subjectFilter !== 'All' && !filterOptions.includes(subjectFilter)) {
      setSubjectFilter('All');
    }
  }, [filterOptions, subjectFilter]);

  // Filter assignments locally by Subject if requested
  const filteredAssignments = assignments.filter((item) => {
    if (subjectFilter === 'All') return true;
    return item.subject && item.subject.toLowerCase() === subjectFilter.toLowerCase();
  });

  if (loadingStudent) {
    return (
      <StudentLayout>
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ color: '#1E3A8A', fontWeight: 800 }}>Loading Assignments...</div>
        </div>
      </StudentLayout>
    );
  }

  if (!student) {
    return (
      <StudentLayout>
        <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0' }}>
          <User size={48} color="#94A3B8" style={{ margin: '0 auto 0.5rem auto' }} />
          <h3 style={{ color: '#1E293B', margin: 0 }}>No Student Record Found</h3>
        </div>
      </StudentLayout>
    );
  }

  return (
    <StudentLayout student={student}>
      <div style={{ padding: '0.5rem 0 2rem 0' }}>
        {/* Page Header */}
        <div style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #1E40AF 100%)', padding: '1.25rem', borderRadius: '14px', color: '#FFFFFF', marginBottom: '1.25rem', boxShadow: '0 4px 14px rgba(30, 58, 138, 0.2)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div>
              <h2 style={{ margin: 0, fontWeight: 900, fontSize: '1.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                📚 Assignments
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                Class: <strong>{student.standard} Standard</strong> • Complete your homework on time
              </p>
            </div>
            <span style={{ background: 'rgba(255, 255, 255, 0.2)', padding: '0.35rem 0.75rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 800 }}>
              {filteredAssignments.length} Assignments Available
            </span>
          </div>
        </div>

        {/* Dynamic Subject Filter Bar */}
        {filterOptions.length === 0 ? (
          <div style={{ padding: '0.75rem 1rem', background: '#F8FAFC', borderRadius: '10px', border: '1px solid #E2E8F0', color: '#64748B', fontSize: '0.85rem', fontWeight: 800, marginBottom: '1rem' }}>
            No subjects registered
          </div>
        ) : (
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
            {filterOptions.map((sub) => (
              <button
                key={sub}
                onClick={() => setSubjectFilter(sub)}
                style={{
                  padding: '0.5rem 0.9rem',
                  borderRadius: '8px',
                  border: subjectFilter === sub ? '1px solid #1E3A8A' : '1px solid #CBD5E1',
                  background: subjectFilter === sub ? '#1E3A8A' : '#FFFFFF',
                  color: subjectFilter === sub ? '#FFFFFF' : '#475569',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease'
                }}
              >
                {sub}
              </button>
            ))}
          </div>
        )}

        {/* Main Content Area */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem 1rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', color: '#64748B' }}>
            <Loader2 size={32} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.75rem auto' }} />
            <div style={{ fontWeight: 800, color: '#1E3A8A' }}>Loading assignments...</div>
          </div>
        ) : errorMsg ? (
          <div style={{ padding: '1.25rem', background: '#FEF2F2', border: '1px solid #FCA5A5', borderRadius: '12px', color: '#DC2626', fontWeight: 700, fontSize: '0.9rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={20} />
            <span>{errorMsg}</span>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#FFFFFF', borderRadius: '14px', border: '1px solid #E2E8F0', color: '#64748B' }}>
            <FileText size={52} color="#94A3B8" style={{ margin: '0 auto 0.75rem auto' }} />
            <h3 style={{ margin: 0, color: '#1E293B', fontWeight: 800 }}>No assignments available.</h3>
            <p style={{ margin: '0.35rem 0 0 0', fontSize: '0.85rem' }}>Check back later for new homework posted by your teachers.</p>
          </div>
        ) : (
          /* RESPONSIVE ASSIGNMENT CARDS GRID (1-col mobile, 2/3-col laptop) */
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(290px, 1fr))', gap: '1rem' }}>
            {filteredAssignments.map((item) => {
              const postedDateFormatted = new Date(item.postedDate || item.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
              const dueDateFormatted = new Date(item.dueDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });

              const isOverdue = item.status === 'Overdue';
              const isDueSoon = item.status === 'Due Soon';

              return (
                <div
                  key={item._id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '14px',
                    border: '1px solid #E2E8F0',
                    padding: '1.15rem',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between'
                  }}
                >
                  <div>
                    {/* Top Metadata Badges */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ background: '#EFF6FF', color: '#1E3A8A', fontWeight: 900, fontSize: '0.75rem', padding: '0.2rem 0.6rem', borderRadius: '6px', border: '1px solid #BFDBFE' }}>
                        {item.subject}
                      </span>

                      <span
                        style={{
                          fontWeight: 800,
                          fontSize: '0.72rem',
                          padding: '0.2rem 0.6rem',
                          borderRadius: '6px',
                          background: isOverdue ? '#FEF2F2' : isDueSoon ? '#FFFBEB' : '#ECFDF5',
                          color: isOverdue ? '#DC2626' : isDueSoon ? '#D97706' : '#059669',
                          border: `1px solid ${isOverdue ? '#FCA5A5' : isDueSoon ? '#FCD34D' : '#6EE7B7'}`
                        }}
                      >
                        {item.status}
                      </span>
                    </div>

                    <h4 style={{ margin: '0 0 0.4rem 0', color: '#0F172A', fontSize: '1.05rem', fontWeight: 900 }}>
                      📚 {item.title}
                    </h4>

                    <div style={{ fontSize: '0.75rem', color: '#64748B', marginBottom: '0.65rem', display: 'flex', gap: '0.8rem' }}>
                      <span>Class: <strong>{item.standard}</strong></span>
                      <span>Posted: <strong>{postedDateFormatted}</strong></span>
                    </div>

                    {item.description && (
                      <p style={{ color: '#475569', fontSize: '0.85rem', margin: '0 0 0.85rem 0', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.4' }}>
                        {item.description}
                      </p>
                    )}

                    <div style={{ fontSize: '0.82rem', color: '#1E293B', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.75rem' }}>
                      <Calendar size={15} color="#1E3A8A" /> Due: <span style={{ color: isOverdue ? '#DC2626' : '#1E3A8A' }}>{dueDateFormatted}</span>
                    </div>

                    {/* Attachment Indicator */}
                    {item.attachmentUrl ? (
                      <div style={{ background: '#F8FAFC', padding: '0.45rem 0.65rem', borderRadius: '6px', border: '1px solid #E2E8F0', fontSize: '0.78rem', fontWeight: 800, color: '#2563EB', display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.9rem' }}>
                        <Paperclip size={14} />
                        <span>{item.attachmentType === 'PDF' ? '📄 PDF Document' : '🖼️ Image File'}</span>
                      </div>
                    ) : (
                      <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic', marginBottom: '0.9rem' }}>
                        No file attached
                      </div>
                    )}
                  </div>

                  {/* Open Assignment CTA Button */}
                  <button
                    onClick={() => setSelectedAssignment(item)}
                    style={{
                      width: '100%',
                      padding: '0.65rem',
                      background: '#1E3A8A',
                      color: '#FFFFFF',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 800,
                      fontSize: '0.85rem',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: '0.4rem',
                      boxShadow: '0 2px 6px rgba(30, 58, 138, 0.15)'
                    }}
                  >
                    <Eye size={16} /> Open Assignment
                  </button>
                </div>
              );
            })}
          </div>
        )}

        {/* STUDENT ASSIGNMENT DETAIL MODAL */}
        {selectedAssignment && (
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(15, 23, 42, 0.75)',
              backdropFilter: 'blur(3px)',
              zIndex: 9999,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '1rem'
            }}
            onClick={() => setSelectedAssignment(null)}
          >
            <div
              style={{
                background: '#FFFFFF',
                borderRadius: '16px',
                maxWidth: '620px',
                width: '100%',
                padding: '1.5rem',
                maxHeight: '90vh',
                overflowY: 'auto',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.2)'
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '0.75rem' }}>
                <div>
                  <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', marginBottom: '0.3rem' }}>
                    <span style={{ background: '#EFF6FF', color: '#1E3A8A', fontWeight: 900, fontSize: '0.78rem', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                      {selectedAssignment.subject} • {selectedAssignment.standard} Standard
                    </span>
                    <span
                      style={{
                        fontWeight: 800,
                        fontSize: '0.72rem',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '6px',
                        background: selectedAssignment.status === 'Overdue' ? '#FEF2F2' : selectedAssignment.status === 'Due Soon' ? '#FFFBEB' : '#ECFDF5',
                        color: selectedAssignment.status === 'Overdue' ? '#DC2626' : selectedAssignment.status === 'Due Soon' ? '#D97706' : '#059669'
                      }}
                    >
                      {selectedAssignment.status}
                    </span>
                  </div>

                  <h3 style={{ margin: 0, color: '#0F172A', fontWeight: 900, fontSize: '1.25rem' }}>
                    📚 {selectedAssignment.title}
                  </h3>
                </div>

                <button
                  onClick={() => setSelectedAssignment(null)}
                  style={{ background: '#F1F5F9', border: 'none', borderRadius: '50%', width: '32px', height: '32px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  <X size={18} color="#64748B" />
                </button>
              </div>

              {/* Assignment Meta */}
              <div style={{ background: '#F8FAFC', padding: '0.75rem', borderRadius: '10px', border: '1px solid #E2E8F0', marginBottom: '1.25rem', fontSize: '0.82rem', color: '#475569', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '0.5rem' }}>
                <div>Teacher: <strong style={{ color: '#0F172A' }}>{selectedAssignment.teacher || 'Unique Classes Faculty'}</strong></div>
                <div>Posted: <strong style={{ color: '#0F172A' }}>{new Date(selectedAssignment.postedDate || selectedAssignment.createdAt).toLocaleDateString('en-GB')}</strong></div>
                <div>Due Date: <strong style={{ color: '#1E3A8A' }}>{new Date(selectedAssignment.dueDate).toLocaleDateString('en-GB')}</strong></div>
              </div>

              {/* Full Description */}
              <div style={{ marginBottom: '1.25rem' }}>
                <h4 style={{ margin: '0 0 0.4rem 0', color: '#1E3A8A', fontSize: '0.92rem', fontWeight: 800 }}>
                  Instructions / Description:
                </h4>
                <p style={{ margin: 0, color: '#334155', fontSize: '0.9rem', lineHeight: '1.5', whiteSpace: 'pre-line' }}>
                  {selectedAssignment.description || 'No detailed instructions provided.'}
                </p>
              </div>

              {/* Attachment Preview Section */}
              {selectedAssignment.attachmentUrl && (
                <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1rem' }}>
                  <h4 style={{ margin: '0 0 0.75rem 0', color: '#1E3A8A', fontSize: '0.95rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Paperclip size={16} /> Attachment ({selectedAssignment.attachmentType})
                  </h4>

                  {selectedAssignment.attachmentType === 'Image' ? (
                    <div style={{ textAlign: 'center', background: '#F8FAFC', padding: '0.75rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                      <img
                        src={selectedAssignment.attachmentUrl}
                        alt={selectedAssignment.title}
                        style={{ maxWidth: '100%', maxHeight: '380px', borderRadius: '8px', objectFit: 'contain' }}
                      />
                    </div>
                  ) : (
                    <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', padding: '1.1rem', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#1E3A8A', fontWeight: 800, fontSize: '0.92rem' }}>
                        <Paperclip size={22} /> PDF Attachment Document
                      </div>
                      <a
                        href={selectedAssignment.attachmentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#1E3A8A',
                          color: '#FFFFFF',
                          padding: '0.65rem 1.25rem',
                          borderRadius: '8px',
                          textDecoration: 'none',
                          fontWeight: 800,
                          fontSize: '0.88rem',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                          boxShadow: '0 2px 8px rgba(30, 58, 138, 0.2)'
                        }}
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
    </StudentLayout>
  );
};

export default StudentAssignments;
