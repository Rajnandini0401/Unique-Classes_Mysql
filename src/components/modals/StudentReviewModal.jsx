import React, { useEffect } from 'react';
import { X, Quote, Award, Sparkles, PhoneCall, CheckCircle } from 'lucide-react';
import { getPhotoUrl, handleImageError } from '../../utils/photoUtils';
import { Link } from 'react-router-dom';

const StudentReviewModal = ({ student, isOpen, onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !student) return null;

  return (
    <div className="review-modal-backdrop" onClick={onClose}>
      <div
        className="review-modal-box"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Close Button */}
        <button
          className="review-modal-close"
          onClick={onClose}
          aria-label="Close review dialog"
        >
          <X size={20} />
        </button>

        {/* Student Hero Header */}
        <div className="modal-student-hero">
          <img
            src={getPhotoUrl(student.photo)}
            alt={student.name}
            className="modal-student-avatar"
            onError={(e) => handleImageError(e)}
          />
          <div className="modal-student-info">
            <div className="modal-badges-row" style={{ marginBottom: '0.4rem' }}>
              <span className="topper-class-badge">{student.board || student.category || 'Topper'}</span>
              <span className="modal-badge-rank">
                <Award size={13} style={{ display: 'inline', marginRight: '4px', verticalAlign: '-1px' }} />
                {student.rank || '1st Rank'}
              </span>
              <span className="modal-badge-score">{student.percentage}</span>
            </div>
            <h3>{student.name}</h3>
            <p>{student.school}</p>
          </div>
        </div>

        {/* Student Testimonial Quote */}
        <div className="modal-quote-wrapper">
          <Quote size={24} color="#D4AF37" style={{ opacity: 0.35, position: 'absolute', top: '10px', right: '12px' }} />
          <p className="modal-quote-text">
            "{student.review || `${student.name} consistently excelled with conceptual clarity, weekly assessments, and mentor guidance at Unique Classes.`}"
          </p>
        </div>

        {/* Subject Score Breakdown */}
        {student.subjects && student.subjects.length > 0 && (
          <div>
            <div className="modal-scores-title">
              <Sparkles size={14} style={{ display: 'inline', marginRight: '5px', verticalAlign: '-1px', color: '#F4C542' }} />
              Key Subject Performance
            </div>
            <div className="modal-scores-grid">
              {student.subjects.map((sub, idx) => (
                <div key={idx} className="modal-score-item">
                  <span className="modal-score-sub">{sub.name}</span>
                  <span className="modal-score-val">{sub.score}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Highlights bullets */}
        <div style={{ marginBottom: '1.6rem', background: 'rgba(255, 255, 255, 0.04)', border: '1px solid rgba(255, 255, 255, 0.08)', padding: '0.85rem 1rem', borderRadius: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', color: '#E2E8F0', marginBottom: '0.4rem' }}>
            <CheckCircle size={15} color="#D4AF37" />
            <span>Regular attendance in weekly mock exam series</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.86rem', color: '#E2E8F0' }}>
            <CheckCircle size={15} color="#D4AF37" />
            <span>Personalized doubt-solving with Nilanga faculty</span>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="modal-actions-bar">
          <Link
            to="/contact"
            className="modal-action-btn-gold"
            onClick={onClose}
          >
            <PhoneCall size={16} />
            <span>Inquire for Admission</span>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default StudentReviewModal;
