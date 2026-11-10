import React from 'react';
import { Bookmark, ChevronRight } from 'lucide-react';
import { getPhotoUrl, handleImageError } from '../../utils/photoUtils';

const TopperCard = ({ student, onOpenReview }) => {
  const {
    name,
    board,
    category,
    school,
    percentage,
    photo
  } = student;

  const displayBadge = board || category || 'Merit';

  const handleCardClick = (e) => {
    // If user clicked bookmark, prevent opening modal
    if (e.target.closest('.topper-bookmark-btn')) return;
    if (onOpenReview) {
      onOpenReview(student);
    }
  };

  return (
    <div className="topper-light-card" onClick={handleCardClick}>
      {/* Top Bar: Badge & Ribbon Bookmark */}
      <div className="topper-card-topbar">
        <span className="topper-class-badge">{displayBadge}</span>
        <button
          type="button"
          className="topper-bookmark-btn"
          aria-label="Bookmark topper"
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <Bookmark size={17} strokeWidth={2.2} />
        </button>
      </div>

      {/* Student Portrait Frame */}
      <div className="topper-photo-frame">
        <img
          src={getPhotoUrl(photo)}
          alt={name}
          className="topper-student-image"
          onError={(e) => handleImageError(e)}
          loading="lazy"
        />
      </div>

      {/* Student Name & School */}
      <div className="topper-card-meta">
        <h3 className="topper-card-name" title={name}>{name}</h3>
        <p className="topper-card-school" title={school}>{school}</p>
      </div>

      {/* Bottom Row: Large Percentage & Review Action */}
      <div className="topper-card-footer">
        <span className="topper-card-percentage">{percentage}</span>
        <button
          type="button"
          className="topper-review-link"
          onClick={(e) => {
            e.stopPropagation();
            if (onOpenReview) onOpenReview(student);
          }}
        >
          <span>REVIEW</span>
          <ChevronRight size={14} strokeWidth={3} />
        </button>
      </div>
    </div>
  );
};

export default TopperCard;
