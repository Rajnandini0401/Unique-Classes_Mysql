import React, { useState, useEffect, useContext } from 'react';
import TeacherLayout from '../../layouts/TeacherLayout';
import { AuthContext } from '../../context/AuthContext';
import { getTeacherDashboardAPI } from '../../services/api';
import { Calendar as CalendarIcon, Clock, Sparkles, BookOpen, RotateCw } from 'lucide-react';
import '../../styles/teacher/teacher-pages.css';

const MySchedule = () => {
  const { teacherProfile, user } = useContext(AuthContext) || {};
  const teacherId = teacherProfile?.id || teacherProfile?._id || user?.teacher_id;
  const [activeTab, setActiveTab] = useState('regular'); // 'regular', 'saturday', 'sunday'
  const [todaySchedule, setTodaySchedule] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSchedule = async () => {
      setLoading(true);
      try {
        const res = await getTeacherDashboardAPI(teacherId);
        if (res && res.success && res.data) {
          setTodaySchedule(res.data.todaySchedule || []);
        }
      } catch (err) {
        console.warn('MySchedule: Fetch error notice', err);
      } finally {
        setLoading(false);
      }
    };
    fetchSchedule();
  }, [teacherId]);

  return (
    <TeacherLayout>
      <div className="teacher-page-container">
        {/* Header */}
        <div className="teacher-welcome-banner">
          <div className="teacher-welcome-text">
            <h2>My Teaching Schedule 🗓️</h2>
            <p>View your complete lecture timetable, doubt-solving sessions, and exam supervision duties.</p>
          </div>
          <div className="teacher-welcome-actions">
            <span className="teacher-badge-pill" style={{ background: 'rgba(212,175,55,0.2)', color: '#F4C542', border: '1px solid #D4AF37' }}>
              Academic Year 2026-2027
            </span>
          </div>
        </div>

        {/* Tab Navigation & Timetable Container */}
        <div className="teacher-card-panel">
          <div className="teacher-panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
            <div className="teacher-panel-title-group">
              <CalendarIcon size={22} color="#D4AF37" />
              <div>
                <h3 className="teacher-panel-title">Weekly Timetable</h3>
                <p className="teacher-panel-subtitle">Select day category to inspect class timings</p>
              </div>
            </div>

            {/* Timetable Filter Tabs */}
            <div className="teacher-tab-navigation">
              <button
                className={`teacher-tab-btn ${activeTab === 'regular' ? 'active' : ''}`}
                onClick={() => setActiveTab('regular')}
              >
                Monday - Friday
              </button>
              <button
                className={`teacher-tab-btn ${activeTab === 'saturday' ? 'active' : ''}`}
                onClick={() => setActiveTab('saturday')}
              >
                Saturday
              </button>
              <button
                className={`teacher-tab-btn ${activeTab === 'sunday' ? 'active' : ''}`}
                onClick={() => setActiveTab('sunday')}
              >
                Sunday
              </button>
            </div>
          </div>

          {/* Timetable Description Note */}
          <div
            style={{
              background: '#FAF7F0',
              padding: '0.85rem 1.25rem',
              borderRadius: '10px',
              marginBottom: '1.25rem',
              border: '1px solid var(--border-light)',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem',
              color: '#4B5563'
            }}
          >
            <Sparkles size={18} color="#D4AF37" />
            {activeTab === 'regular' && (
              <span><strong>Monday to Friday:</strong> Standard daily recurring batch lectures.</span>
            )}
            {activeTab === 'saturday' && (
              <span><strong>Saturday Schedule:</strong> Special revision workshops, doubt clearing, and practical labs.</span>
            )}
            {activeTab === 'sunday' && (
              <span><strong>Sunday Schedule:</strong> Periodic test series supervision and board pattern weekly exams.</span>
            )}
          </div>

          {/* Schedule Table */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
              <RotateCw size={24} color="#D4AF37" className="spin-icon" style={{ animation: 'spin 1s linear infinite' }} />
              <p style={{ marginTop: '0.75rem', color: '#666' }}>Loading schedule from MongoDB...</p>
              <style>{`@keyframes spin { 100% { transform: rotate(360deg); } }`}</style>
            </div>
          ) : (
            <div className="teacher-table-responsive">
              <table className="teacher-table">
                <thead>
                  <tr>
                    <th>Time Slot (12-Hour Format)</th>
                    <th>Class / Standard</th>
                    <th>Subject & Lecture Module</th>
                    <th>Session Type</th>
                  </tr>
                </thead>
                <tbody>
                  {todaySchedule.length > 0 ? (
                    todaySchedule.map((item, idx) => (
                      <tr key={item.id || idx}>
                        <td>
                          <span className="timetable-time-badge">{item.time}</span>
                        </td>
                        <td style={{ fontWeight: 800, color: '#171717', fontSize: '1rem' }}>
                          {item.className || item.standard} Standard
                        </td>
                        <td style={{ fontWeight: 600 }}>{item.subject}</td>
                        <td>
                          <span className="teacher-badge scheduled">
                            {item.type || 'Regular Class'}
                          </span>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', padding: '2rem', color: '#777' }}>
                        No schedule entries found for this category.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </TeacherLayout>
  );
};

export default MySchedule;
