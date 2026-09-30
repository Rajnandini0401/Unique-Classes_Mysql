import React from 'react';
import { Calendar, Paperclip, ChevronRight, Edit2, Trash2 } from 'lucide-react';

/**
 * Reusable AnnouncementCard Component for Student, Teacher, and Staff Panels.
 */
const AnnouncementCard = ({
  announcement,
  onView,
  onEdit,
  onDelete,
  isMine = false,
  role = 'Student'
}) => {
  if (!announcement) return null;

  const {
    title,
    content,
    message,
    description,
    targetClass,
    targetSubject,
    audience,
    announcementDate,
    createdAt,
    date,
    createdByName,
    createdByRole,
    attachment
  } = announcement;

  const actualContent = content || message || description || '';

  // Format publication date
  const dateFormatted = (announcementDate || createdAt || date)
    ? new Date(announcementDate || createdAt || date).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      })
    : '--';

  // Determine badge label
  let badgeText = 'General';
  if (role === 'Staff') {
    badgeText = audience || 'Institute Notice';
  } else if (targetClass && targetClass !== '') {
    badgeText = targetClass;
  } else if (targetSubject) {
    badgeText = targetSubject;
  } else if (audience) {
    badgeText = audience;
  }

  // Creator badge
  const creatorName = createdByName || (createdByRole === 'Teacher' ? 'Teacher' : 'Admin');
  const isTeacherCreator = createdByRole === 'Teacher';

  return (
    <div
      className="announcement-card-v2"
      onClick={() => onView && onView(announcement)}
    >
      <div>
        {/* Top Header Row */}
        <div className="ann-card-header">
          <span className="ann-card-badge">
            {badgeText}
          </span>
          <span
            className="ann-card-creator"
            style={{
              background: isTeacherCreator ? '#D1FAE5' : '#FEF3C7',
              color: isTeacherCreator ? '#047857' : '#B45309'
            }}
          >
            By: {creatorName}
          </span>
        </div>

        {/* Title */}
        <h4 className="ann-card-title">
          {title}
        </h4>

        {/* Short Content Preview */}
        <p className="ann-card-content">
          {actualContent}
        </p>
      </div>

      {/* Footer Row */}
      <div>
        <div className="ann-card-footer">
          <div className="ann-card-date">
            <Calendar size={13} color="#1E3A8A" />
            <span>{dateFormatted}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            {attachment && (
              <span className="ann-card-attach-icon" title="Has Attachment">
                <Paperclip size={12} /> <span>File</span>
              </span>
            )}
            <button
              type="button"
              className="ann-card-view-btn"
              onClick={(e) => {
                e.stopPropagation();
                if (onView) onView(announcement);
              }}
            >
              View Details <ChevronRight size={14} />
            </button>
          </div>
        </div>

        {/* Teacher / Owner Actions Bar */}
        {isMine && (onEdit || onDelete) && (
          <div
            style={{
              marginTop: '0.65rem',
              paddingTop: '0.5rem',
              borderTop: '1px dashed #E2E8F0',
              display: 'flex',
              gap: '0.5rem',
              justifyContent: 'flex-end'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            {onEdit && (
              <button
                type="button"
                className="btn-act-edit"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '4px',
                  border: '1px solid #3B82F6',
                  background: '#EFF6FF',
                  color: '#1D4ED8',
                  cursor: 'pointer'
                }}
                onClick={() => onEdit(announcement)}
              >
                <Edit2 size={13} /> Edit
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                className="btn-act-delete"
                style={{
                  padding: '0.35rem 0.75rem',
                  fontSize: '0.8rem',
                  fontWeight: 700,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '4px',
                  borderRadius: '4px',
                  border: '1px solid #EF4444',
                  background: '#FEF2F2',
                  color: '#B91C1C',
                  cursor: 'pointer'
                }}
                onClick={() => onDelete(announcement)}
              >
                <Trash2 size={13} /> Delete
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AnnouncementCard;
