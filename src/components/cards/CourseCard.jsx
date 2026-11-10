import React from 'react';
import { ArrowRight, BookOpen, Star, Users, Smartphone, Sparkles } from 'lucide-react';
import coursesBoyImg from '../../assets/illustrations/courses_boy.jpg';

const CourseCard = ({ course, minimal = false }) => {
  const {
    id,
    title,
    targetAudience,
    badge,
    shortDescription,
    subjects,
    price,
    pricePeriod,
    enrollUrl,
    appUrl,
    enrollBtnText,
    appBtnText,
    mode
  } = course;

  // Map subjects to attractive Aleem-style pill classes
  const getPillClass = (index) => {
    const classes = ['pill-math', 'pill-science', 'pill-english', 'pill-navodaya', 'pill-pink'];
    return classes[index % classes.length];
  };

  return (
    <div className="aleem-class-card" style={minimal ? { display: 'flex', flexDirection: 'column', height: '100%' } : {}}>
      {/* Top Banner Image with Hover Zoom */}
      <div className="aleem-card-banner">
        <img
          src={coursesBoyImg}
          alt={title}
          loading="eager"
        />
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, rgba(18, 19, 26, 0.05) 0%, rgba(18, 19, 26, 0.8) 100%)',
          pointerEvents: 'none'
        }} />

        {badge && (
          <div className="aleem-card-badge">
            ✨ {badge}
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="aleem-card-body" style={minimal ? { display: 'flex', flexDirection: 'column', flex: 1, padding: '1.8rem 1.6rem' } : {}}>
        {/* Class / Standard / Mode Tag */}
        {minimal && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.76rem', fontWeight: 800, color: '#F4C542', background: 'rgba(212, 175, 55, 0.12)', padding: '0.22rem 0.7rem', borderRadius: '9999px', border: '1px solid rgba(212, 175, 55, 0.3)' }}>
              {mode?.includes('Online') || mode?.includes('ऑनलाइन') ? '🌐 ONLINE BATCH' : '🏫 CLASSROOM'}
            </span>
            <span style={{ fontSize: '0.82rem', fontWeight: 700, color: '#CBD5E1' }}>
              {targetAudience || (badge?.includes('मराठी') ? 'इ. १० वी (SSC बोर्ड)' : 'Class 10th (SSC Board)')}
            </span>
          </div>
        )}

        {/* Course Title */}
        <h3 className="aleem-card-title" style={minimal ? { fontSize: 'clamp(1.4rem, 2.3vw, 1.75rem)', fontWeight: 850, color: '#FFFFFF', marginBottom: '0.85rem', lineHeight: 1.25 } : {}}>
          {title}
        </h3>

        {/* Non-minimal target audience */}
        {!minimal && targetAudience && (
          <p style={{ fontSize: '0.85rem', fontWeight: 700, color: '#E6C76A', marginBottom: '0.4rem' }}>
            {targetAudience}
          </p>
        )}

        {/* Subject Pills */}
        {subjects && subjects.length > 0 && (
          <div style={minimal ? { marginBottom: '1.25rem' } : {}}>
            {minimal && (
              <span style={{ display: 'block', fontSize: '0.74rem', fontWeight: 700, color: '#9FB0A6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.45rem' }}>
                Relevant Subjects:
              </span>
            )}
            <div className="aleem-subject-pills" style={minimal ? { marginBottom: 0 } : {}}>
              {subjects.map((sub, idx) => (
                <span key={idx} className={`subject-pill ${getPillClass(idx)}`} style={minimal ? { fontSize: '0.82rem', fontWeight: 750, padding: '0.3rem 0.8rem' } : {}}>
                  {sub.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Pricing / Academic Year */}
        {price && (
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.4rem', marginBottom: '1.25rem', marginTop: 'auto' }}>
            <span style={{ fontSize: '1.75rem', fontWeight: 900, color: '#F4C542' }}>
              {price}
            </span>
            <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>
              {pricePeriod || '/ वर्ष (12 महिने)'}
            </span>
          </div>
        )}

        {/* Only show description in non-minimal mode */}
        {!minimal && shortDescription && (
          <p className="aleem-card-desc">{shortDescription}</p>
        )}

        {/* Card Footer: Buttons */}
        {minimal ? (
          <div style={{
            marginTop: price ? 0 : 'auto',
            paddingTop: '1.1rem',
            borderTop: '1px solid rgba(212, 175, 55, 0.18)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: '0.65rem'
          }}>
            {enrollUrl ? (
              <>
                <a
                  href={enrollUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-card-action"
                  style={{
                    justifyContent: 'center',
                    padding: '0.72rem 0.6rem',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    textAlign: 'center'
                  }}
                >
                  <span>Explore Course</span>
                  <ArrowRight size={14} />
                </a>
                <a
                  href="#admission-enquiry"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                    background: 'rgba(212, 175, 55, 0.08)',
                    border: '1px solid rgba(212, 175, 55, 0.45)',
                    color: '#F4C542',
                    padding: '0.72rem 0.6rem',
                    borderRadius: '9999px',
                    fontSize: '0.88rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                    textAlign: 'center',
                    transition: 'all 0.25s ease'
                  }}
                >
                  <span>Enquire Now</span>
                </a>
              </>
            ) : (
              <a
                href="#admission-enquiry"
                className="btn-card-action"
                style={{ width: '100%', justifyContent: 'center', padding: '0.75rem 1.2rem', fontSize: '0.92rem', fontWeight: 800 }}
              >
                <span>Enquire Now</span>
                <ArrowRight size={15} />
              </a>
            )}
          </div>
        ) : (
          <div className="aleem-card-footer">
            <div className="aleem-card-meta">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem', color: '#FFFFFF', fontWeight: 800 }}>
                <Star size={15} color="#FBBF24" fill="#FBBF24" />
                <span>5.0</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', color: '#94A3B8', fontSize: '0.8rem' }}>
                <Users size={14} />
                <span>Full Batch</span>
              </div>
            </div>

            {enrollUrl ? (
              <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                <a
                  href={enrollUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-card-action"
                >
                  <span>{enrollBtnText || 'प्रवेश घ्या'}</span>
                  <ArrowRight size={14} />
                </a>
              </div>
            ) : (
              <a
                href="#admission-enquiry"
                className="btn-card-action"
              >
                <span>Explore Class</span>
                <ArrowRight size={14} />
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseCard;
