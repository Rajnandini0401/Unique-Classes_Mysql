import React from 'react';
import { Eye } from 'lucide-react';

const GalleryCard = ({ item, onSelect }) => {
  const { title, image } = item;

  return (
    <div className="gallery-card" onClick={() => onSelect && onSelect(item)}>
      <img
        src={image}
        alt={title}
        className="gallery-img"
        onError={(e) => {
          e.target.src = 'https://images.unsplash.com/photo-1509062522246-3755977927d7?auto=format&fit=crop&q=80&w=800';
        }}
      />
      <div className="gallery-overlay">
        <div style={{ marginBottom: 'auto', textAlign: 'right' }}>
          <span
            style={{
              background: 'var(--gold-btn-gradient)',
              color: '#080808',
              borderRadius: '50%',
              width: '38px',
              height: '38px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(212, 175, 55, 0.4)'
            }}
          >
            <Eye size={18} />
          </span>
        </div>
        <h4 className="gallery-title">{title}</h4>
      </div>
    </div>
  );
};

export default GalleryCard;
