import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const getFullDateTooltip = (yearStr, monthStr, dayNum, status = null) => {
  try {
    const y = parseInt(yearStr, 10);
    const m = parseInt(monthStr, 10) - 1;
    const d = new Date(Date.UTC(y, m, dayNum));
    const dayStr = String(dayNum).padStart(2, '0');
    const monthName = MONTH_NAMES[m] || '';
    const weekdayName = d.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'UTC' });
    const fullDate = `${dayStr} ${monthName} ${y} - ${weekdayName}`;
    if (status) {
      return `${fullDate}: ${status}`;
    }
    return fullDate;
  } catch (e) {
    return '';
  }
};

const MonthlyAttendanceGrid = ({
  monthlyGrid,
  loading,
  selectedStandard,
  selectedSubject,
  selectedMonth,
  selectedYear,
  onStudentClick
}) => {
  const monthName = selectedMonth ? (MONTH_NAMES[parseInt(selectedMonth, 10) - 1] || 'Month') : '';

  if (loading) {
    return (
      <div style={{ padding: '3.5rem 1rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
        <Loader2 size={32} className="spin-icon" color="#1E3A8A" style={{ margin: '0 auto 0.5rem auto' }} />
        <div style={{ color: '#1E3A8A', fontWeight: 700, fontSize: '1rem' }}>Loading monthly attendance...</div>
      </div>
    );
  }

  if (!monthlyGrid || !monthlyGrid.gridData) {
    return (
      <div style={{ padding: '3rem 1rem', textAlign: 'center', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB' }}>
        <Calendar size={36} color="#9CA3AF" style={{ margin: '0 auto 0.5rem auto' }} />
        <div style={{ color: '#4B5563', fontWeight: 600 }}>Select Class, Subject, and Month to view attendance.</div>
      </div>
    );
  }

  const { daysInMonth, recordedDaysCount, gridData } = monthlyGrid;
  const daysArray = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="monthly-grid-container" style={{ fontFamily: 'inherit' }}>
      {/* Simplified Clean Header */}
      <div style={{ marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div>
          <h2 style={{ margin: 0, color: '#1E3A8A', fontSize: '1.3rem', fontWeight: 900 }}>
            Monthly Attendance
          </h2>
          <div style={{ color: '#4B5563', fontSize: '0.92rem', fontWeight: 700, marginTop: '0.2rem' }}>
            {selectedStandard} • {selectedSubject} • {monthName} {selectedYear}
          </div>
        </div>
      </div>

      {/* Empty / Unrecorded Month Banner */}
      {recordedDaysCount === 0 && (
        <div style={{ background: '#FFFBEB', border: '1px solid #FCD34D', color: '#92400E', padding: '0.6rem 0.9rem', borderRadius: '6px', marginBottom: '1rem', fontSize: '0.85rem', fontWeight: 600 }}>
          No attendance recorded for this month.
        </div>
      )}

      {/* Clean Register Grid */}
      <div style={{ background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E5E7EB', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.04)', overflow: 'hidden' }}>
        {gridData.length === 0 ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#6B7280', fontWeight: 600 }}>
            No students found in <strong>{selectedStandard}</strong>.
          </div>
        ) : (
          <div style={{ overflowX: 'auto', width: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem', textAlign: 'center', borderSpacing: 0 }}>
              <thead>
                <tr style={{ background: '#1E3A8A', color: '#FFFFFF' }}>
                  <th style={{ position: 'sticky', left: 0, zIndex: 10, background: '#1E3A8A', padding: '0.6rem 0.5rem', width: '50px', borderRight: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }}>
                    Roll
                  </th>
                  <th style={{ position: 'sticky', left: '50px', zIndex: 10, background: '#1E3A8A', padding: '0.6rem 0.75rem', textAlign: 'left', minWidth: '150px', borderRight: '1px solid rgba(255,255,255,0.15)', fontWeight: 800 }}>
                    Student Name
                  </th>

                  {/* Date Header: ONLY Numbers 1..N */}
                  {daysArray.map(dayNum => {
                    const tooltipText = getFullDateTooltip(selectedYear, selectedMonth, dayNum);

                    return (
                      <th
                        key={dayNum}
                        title={tooltipText}
                        style={{
                          padding: '0.55rem 0.2rem',
                          minWidth: '28px',
                          borderRight: '1px solid rgba(255,255,255,0.1)',
                          fontWeight: 800,
                          fontSize: '0.83rem',
                          cursor: 'pointer'
                        }}
                      >
                        {dayNum}
                      </th>
                    );
                  })}

                  <th style={{ padding: '0.6rem 0.5rem', background: '#0F766E', minWidth: '50px', fontWeight: 800, borderLeft: '1px solid rgba(255,255,255,0.15)' }}>
                    Present
                  </th>
                  <th style={{ padding: '0.6rem 0.5rem', background: '#991B1B', minWidth: '50px', fontWeight: 800 }}>
                    Absent
                  </th>
                  <th style={{ padding: '0.6rem 0.5rem', background: '#B45309', minWidth: '50px', fontWeight: 800 }}>
                    %
                  </th>
                </tr>
              </thead>
              <tbody>
                {gridData.map((rowItem, idx) => {
                  const s = rowItem.student || {};
                  const isEven = idx % 2 === 0;
                  const rowBg = isEven ? '#FFFFFF' : '#F9FAFB';

                  return (
                    <tr key={s._id || idx} style={{ borderBottom: '1px solid #E5E7EB', background: rowBg }}>
                      
                      {/* Sticky Roll No */}
                      <td style={{ position: 'sticky', left: 0, zIndex: 5, background: rowBg, padding: '0.5rem 0.4rem', fontWeight: 800, color: '#1E3A8A', borderRight: '1px solid #E5E7EB' }}>
                        {s.rollNo || '-'}
                      </td>

                      {/* Sticky Student Name */}
                      <td style={{ position: 'sticky', left: '50px', zIndex: 5, background: rowBg, padding: '0.5rem 0.75rem', textAlign: 'left', fontWeight: 700, color: '#111827', borderRight: '1px solid #E5E7EB', whiteSpace: 'nowrap' }}>
                        {onStudentClick ? (
                          <span
                            onClick={() => onStudentClick(s)}
                            style={{ color: '#1E3A8A', cursor: 'pointer' }}
                            title="Click to view student details"
                          >
                            {s.name}
                          </span>
                        ) : (
                          s.name
                        )}
                      </td>

                      {/* Date Cells: Simple Symbols ✓, ×, − without colored square boxes */}
                      {daysArray.map(dayNum => {
                        const status = rowItem.days[dayNum]; // 'Present' | 'Absent' | null
                        const tooltipText = getFullDateTooltip(selectedYear, selectedMonth, dayNum, status || 'Not Recorded');

                        return (
                          <td
                            key={dayNum}
                            title={tooltipText}
                            style={{
                              padding: '0.45rem 0.1rem',
                              borderRight: '1px solid #F3F4F6',
                              verticalAlign: 'middle',
                              userSelect: 'none'
                            }}
                          >
                            {status === 'Present' ? (
                              <span style={{ color: '#059669', fontWeight: 900, fontSize: '1.05rem', lineHeight: 1 }} title={tooltipText}>
                                ✓
                              </span>
                            ) : status === 'Absent' ? (
                              <span style={{ color: '#DC2626', fontWeight: 900, fontSize: '1.05rem', lineHeight: 1 }} title={tooltipText}>
                                ×
                              </span>
                            ) : (
                              <span style={{ color: '#9CA3AF', fontWeight: 700, fontSize: '0.95rem', lineHeight: 1 }} title={tooltipText}>
                                −
                              </span>
                            )}
                          </td>
                        );
                      })}

                      {/* Student Totals */}
                      <td style={{ padding: '0.5rem 0.4rem', fontWeight: 800, color: '#059669', background: isEven ? '#F0FDF4' : '#E6F4EA', borderLeft: '1px solid #E5E7EB' }}>
                        {rowItem.presentCount}
                      </td>
                      <td style={{ padding: '0.5rem 0.4rem', fontWeight: 800, color: '#DC2626', background: isEven ? '#FEF2F2' : '#FCE8E8' }}>
                        {rowItem.absentCount}
                      </td>
                      <td style={{ padding: '0.5rem 0.4rem', fontWeight: 800, color: '#D97706', background: isEven ? '#FFFBEB' : '#FEF3C7' }}>
                        {rowItem.pct}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Simple Text Legend */}
      <div style={{ marginTop: '0.85rem', display: 'flex', gap: '1.5rem', fontSize: '0.88rem', fontWeight: 700, color: '#4B5563', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <strong style={{ color: '#059669', fontSize: '1.1rem' }}>✓</strong> Present
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <strong style={{ color: '#DC2626', fontSize: '1.1rem' }}>×</strong> Absent
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <strong style={{ color: '#9CA3AF', fontSize: '1.1rem' }}>−</strong> Not Recorded
        </div>
      </div>
    </div>
  );
};

export default MonthlyAttendanceGrid;
