import React, { useState, useEffect, useCallback } from 'react';
import StudentLayout from '../../layouts/StudentLayout';
import {
  FileCheck2,
  Award,
  Calendar,
  Filter,
  CheckCircle2,
  XCircle,
  AlertCircle,
  TrendingUp,
  Loader2,
  BookOpen
} from 'lucide-react';
import { getCurrentStudentProfileAPI, getStudentDashboardAPI, getStudentResultsAPI } from '../../services/api';
import { normalizeSubject, getStudentAcademicSubjects } from '../../utils/subjectUtils';

const StudentTests = () => {
  const [student, setStudent] = useState(null);
  const [loadingStudent, setLoadingStudent] = useState(true);

  const [testResults, setTestResults] = useState([]);
  const [avgMarksPct, setAvgMarksPct] = useState('--');
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  const [selectedSubject, setSelectedSubject] = useState('All');

  const fetchStudentData = useCallback(async () => {
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
      const dashRes = await getStudentDashboardAPI({ studentId: savedStudentId || undefined });

      if (dashRes.success && dashRes.student) {
        setStudent(dashRes.student);

        const sId = dashRes.student._id || dashRes.student.id || dashRes.student.studentId;
        const resultsRes = await getStudentResultsAPI(sId);

        if (resultsRes && resultsRes.success && Array.isArray(resultsRes.results)) {
          setTestResults(resultsRes.results);

          // Calculate Overall Average Percentage dynamically
          const presentResults = resultsRes.results.filter(r => r.status !== 'ABSENT' && r.marksObtained !== 'ABSENT' && r.totalMarks > 0);
          if (presentResults.length > 0) {
            const sumPct = presentResults.reduce((acc, r) => {
              const obt = typeof r.marksObtained === 'number' ? r.marksObtained : parseFloat(r.marksObtained) || 0;
              const tot = Number(r.totalMarks) || 100;
              return acc + ((obt / tot) * 100);
            }, 0);
            setAvgMarksPct(`${Math.round(sumPct / presentResults.length)}%`);
          } else {
            setAvgMarksPct('--');
          }
        } else if (Array.isArray(dashRes.testResults)) {
          setTestResults(dashRes.testResults);
          if (dashRes.avgMarksPct) {
            setAvgMarksPct(dashRes.avgMarksPct);
          }
        }
      } else {
        setErrorMsg('Unable to fetch test records.');
      }
    } catch (err) {
      console.error('Error loading student tests:', err);
      setErrorMsg('Server connection failed while loading test results.');
    } finally {
      setLoadingStudent(false);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStudentData();
  }, [fetchStudentData]);

  if (loadingStudent || loading) {
    return (
      <StudentLayout>
        <div style={{ padding: '4rem 1rem', textAlign: 'center' }}>
          <Loader2 size={36} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.75rem auto' }} />
          <div style={{ color: '#1E3A8A', fontWeight: 800 }}>Loading Tests & Marks...</div>
        </div>
      </StudentLayout>
    );
  }

  if (errorMsg || !student) {
    return (
      <StudentLayout>
        <div className="student-card" style={{ textAlign: 'center', padding: '3rem 1rem' }}>
          <AlertCircle size={48} color="#DC2626" style={{ margin: '0 auto 0.5rem auto' }} />
          <h3 style={{ color: '#1E293B', margin: 0 }}>{errorMsg || 'Student Record Not Found'}</h3>
          <p style={{ color: '#64748B', fontSize: '0.88rem', marginTop: '0.3rem' }}>Please verify account status or try refreshing.</p>
        </div>
      </StudentLayout>
    );
  }

  // Registered Student Subjects
  const resolvedSubs = getStudentAcademicSubjects(student);
  const studentSubjects = resolvedSubs.length > 0
    ? resolvedSubs
    : (Array.isArray(student.subjects) && student.subjects.length > 0 ? student.subjects : ['Math', 'Science', 'English']);

  // Filter test results by subject with class-aware normalization
  const filteredResults = testResults.filter((t) => {
    if (selectedSubject === 'All') return true;
    const normTSub = normalizeSubject(t.subject, student.standard);
    const normSelSub = normalizeSubject(selectedSubject, student.standard);
    return normTSub.toLowerCase() === normSelSub.toLowerCase();
  });

  // Calculate subject-wise metrics with class-aware normalization
  const subjectPerformance = studentSubjects.map((sub) => {
    const normSub = normalizeSubject(sub, student.standard).toLowerCase();
    const subResults = testResults.filter(r => {
      if (!r || r.marksObtained === 'ABSENT' || r.status === 'ABSENT') return false;
      const normRSub = normalizeSubject(r.subject, student.standard).toLowerCase();
      return normRSub === normSub;
    });

    if (subResults.length === 0) {
      return { subject: sub, avg: '--', best: '--', total: 0 };
    }
    const pcts = subResults.map(r => {
      const obt = typeof r.marksObtained === 'number' ? r.marksObtained : parseFloat(r.marksObtained) || 0;
      const tot = r.totalMarks || 100;
      return (obt / tot) * 100;
    });

    const avgVal = Math.round(pcts.reduce((a, b) => a + b, 0) / pcts.length);
    const maxVal = Math.round(Math.max(...pcts));

    return {
      subject: sub,
      avg: `${avgVal}%`,
      best: `${maxVal}%`,
      total: subResults.length
    };
  });

  return (
    <StudentLayout student={student}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

        {/* HEADER OVERVIEW */}
        <div className="student-card" style={{ background: 'linear-gradient(135deg, #1E3A8A 0%, #0F172A 100%)', color: '#FFFFFF' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <div style={{ fontSize: '0.72rem', fontWeight: 900, color: '#D4AF37', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                ACADEMIC PERFORMANCE SCORECARD
              </div>
              <h2 style={{ margin: '0.2rem 0 0', color: '#FFFFFF', fontSize: '1.3rem', fontWeight: 900 }}>
                Tests & Examination Marks
              </h2>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.82rem', opacity: 0.9 }}>
                {student.name} • Class {student.standard}
              </p>
            </div>

            <div style={{ background: 'rgba(255, 255, 255, 0.12)', padding: '0.75rem 1.25rem', borderRadius: '12px', border: '1px solid rgba(255, 255, 255, 0.2)', textAlign: 'center' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#D4AF37' }}>OVERALL AVERAGE</div>
              <div style={{ fontSize: '1.4rem', fontWeight: 900, color: '#FFFFFF', marginTop: '2px' }}>{avgMarksPct}</div>
            </div>
          </div>
        </div>

        {/* SUBJECT PERFORMANCE SUMMARY CARDS */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.85rem', marginBottom: '1.25rem' }}>
          {subjectPerformance.map((item, idx) => (
            <div
              key={idx}
              style={{
                background: '#FFFFFF',
                borderRadius: '12px',
                border: '1px solid #E2E8F0',
                padding: '0.85rem 1rem',
                boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.4rem' }}>
                <span style={{ fontSize: '0.75rem', fontWeight: 900, color: '#1E3A8A', background: '#DBEAFE', padding: '0.15rem 0.5rem', borderRadius: '4px' }}>
                  {item.subject}
                </span>
                <span style={{ fontSize: '0.7rem', fontWeight: 700, color: '#64748B' }}>
                  {item.total} {item.total === 1 ? 'Test' : 'Tests'}
                </span>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: '0.5rem' }}>
                <div>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#64748B' }}>AVERAGE</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 900, color: '#0F172A' }}>{item.avg}</div>
                </div>

                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.68rem', fontWeight: 800, color: '#059669' }}>BEST SCORE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: '#059669' }}>{item.best}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* DETAILED TEST RESULTS LIST (SINGLE RESPONSIVE TABLE VIEW ONLY) */}
        <div className="student-card">
          <div className="student-card-title" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
            <h3>
              <FileCheck2 size={18} color="#D97706" /> All Test Scorecards
            </h3>

            {/* Subject Filter Dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={14} color="#64748B" />
              <select
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                style={{
                  padding: '0.35rem 0.7rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  borderRadius: '6px',
                  border: '1px solid #CBD5E1',
                  background: '#F8FAFC',
                  color: '#1E293B'
                }}
              >
                <option value="All">All Subjects</option>
                {studentSubjects.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredResults.length > 0 ? (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', minWidth: '600px', borderCollapse: 'collapse', fontSize: '0.86rem', textAlign: 'left' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '2px solid #E2E8F0', color: '#475569', fontWeight: 800 }}>
                    <th style={{ padding: '0.65rem' }}>Test Name</th>
                    <th style={{ padding: '0.65rem' }}>Subject</th>
                    <th style={{ padding: '0.65rem' }}>Date</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Marks Obtained</th>
                    <th style={{ padding: '0.65rem', textAlign: 'center' }}>Percentage</th>
                    <th style={{ padding: '0.65rem', textAlign: 'right' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredResults.map((r) => {
                    const dateStr = r.testDate
                      ? new Date(r.testDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
                      : '--';
                    const isAbsent = r.marksObtained === 'ABSENT' || r.status === 'ABSENT';

                    return (
                      <tr key={r._id} style={{ borderBottom: '1px solid #F1F5F9' }}>
                        <td style={{ padding: '0.65rem', fontWeight: 800, color: '#0F172A' }}>{r.testTitle}</td>
                        <td style={{ padding: '0.65rem' }}>
                          <span style={{ fontSize: '0.72rem', fontWeight: 800, color: '#1E3A8A', background: '#DBEAFE', padding: '0.15rem 0.45rem', borderRadius: '4px' }}>
                            {r.subject}
                          </span>
                        </td>
                        <td style={{ padding: '0.65rem', color: '#64748B' }}>{dateStr}</td>
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 800 }}>
                          {isAbsent ? (
                            <span style={{ color: '#DC2626' }}>ABSENT</span>
                          ) : (
                            <span>{r.marksObtained} / {r.totalMarks}</span>
                          )}
                        </td>
                        <td style={{ padding: '0.65rem', textAlign: 'center', fontWeight: 900, color: isAbsent ? '#DC2626' : (parseFloat(r.percentage) >= 75 ? '#059669' : '#D97706') }}>
                          {isAbsent ? 'ABSENT' : r.percentage}
                        </td>
                        <td style={{ padding: '0.65rem', textAlign: 'right' }}>
                          <span
                            style={{
                              fontSize: '0.72rem',
                              fontWeight: 800,
                              padding: '0.15rem 0.5rem',
                              borderRadius: '4px',
                              background: isAbsent ? '#FEF2F2' : (r.status === 'FAILED' ? '#FEF2F2' : '#ECFDF5'),
                              color: isAbsent ? '#DC2626' : (r.status === 'FAILED' ? '#DC2626' : '#059669')
                            }}
                          >
                            {isAbsent ? 'ABSENT' : (r.status || 'PASSED')}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: '#64748B', padding: '1rem 0', textAlign: 'center' }}>
              No test results available for the selected subject.
            </div>
          )}
        </div>
      </div>
    </StudentLayout>
  );
};

export default StudentTests;
