import React from 'react';
import { Calendar, BellRing } from 'lucide-react';

const AnnouncementCard = ({ announcement }) => {
  const message = announcement.content || announcement.message || announcement.description || '';
  const date = announcement.announcementDate || announcement.date || '';

  // Format date cleanly if present
  let formattedDate = date;
  if (date) {
    try {
      const d = new Date(date);
      if (!isNaN(d.getTime())) {
        formattedDate = d.toLocaleDateString('en-GB', {
          day: '2-digit',
          month: 'short',
          year: 'numeric'
        });
      }
    } catch {
      formattedDate = date;
    }
  }

  return (
    <div className="public-announcement-card">
      <div className="public-announcement-header">
        <span className="public-announcement-badge">
          <BellRing size={13} color="var(--color-metallic-gold)" /> Notice
        </span>
        {formattedDate && (
          <span className="public-announcement-date">
            <Calendar size={13} />
            {formattedDate}
          </span>
        )}
      </div>

      <div className="public-announcement-message">
        {message}
      </div>
    </div>
  );
};

export default AnnouncementCard;
