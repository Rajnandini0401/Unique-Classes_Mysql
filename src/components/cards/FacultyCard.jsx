import React from 'react';
import { Award, GraduationCap, BookOpen, Star } from 'lucide-react';
import { getPhotoUrl, DEFAULT_TEACHER_AVATAR, handleImageError } from '../../utils/photoUtils';

const FacultyCard = ({ faculty }) => {
  const { name, subject, qualification, experience, bio, photo, badge, classes } = faculty;

  return (
    <div className="aleem-faculty-card">
      <div className="aleem-faculty-avatar-box">
        <img
          src={getPhotoUrl(photo, DEFAULT_TEACHER_AVATAR)}
          alt={name}
          className="aleem-faculty-img"
          onError={(e) => handleImageError(e, DEFAULT_TEACHER_AVATAR)}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '-4px',
            right: '-4px',
            background: 'var(--gold-btn-gradient)',
            color: '#080808',
            borderRadius: '50%',
            width: '28px',
            height: '28px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.5)',
            fontSize: '0.8rem'
          }}
        >
          ⭐
        </div>
      </div>

      <h3 className="aleem-faculty-name">{name}</h3>
      <p className="aleem-faculty-subject">
        {subject || 'Expert Subject Mentor'}
      </p>

      {qualification && (
        <div className="aleem-faculty-meta">
          <GraduationCap size={15} color="#D4AF37" />
          <span>{qualification}</span>
        </div>
      )}

      {experience && (
        <div className="aleem-faculty-meta">
          <Award size={15} color="#F59E0B" />
          <span>{experience}</span>
        </div>
      )}

      {classes && (
        <div className="aleem-faculty-meta" style={{ marginBottom: '0.75rem' }}>
          <BookOpen size={15} color="#E6C76A" />
          <span>Classes: {classes}</span>
        </div>
      )}

      {bio && (
        <p style={{ fontSize: '0.85rem', color: '#94A3B8', lineHeight: 1.5, marginTop: 'auto', paddingTop: '0.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', width: '100%' }}>
          {bio}
        </p>
      )}
    </div>
  );
};

export default FacultyCard;
