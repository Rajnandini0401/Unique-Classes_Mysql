import React from 'react';
import { Sparkles, Target, Award, Users, BookOpen, ArrowRight, PhoneCall, CheckCircle2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { StarTrophySticker, FlyingBookSticker, SparkleStarSticker, GraduationCapSticker } from '../common/EduStickers';
import { useScrollReveal, useParallax } from '../../utils/useScrollReveal';
import aboutGirlImg from '../../assets/illustrations/about_girl.jpg';
import '../../styles/about-section.css';

const AboutSection = () => {
  const [sectionRef, sectionVisible] = useScrollReveal({ threshold: 0.15 });
  const [artParallaxRef, artParallaxOffset] = useParallax(0.14, 55);

  const highlights = [
    {
      icon: Target,
      title: 'Concept-First Teaching',
      description: 'Building deep conceptual clarity in Science and Mathematics rather than rote memorization.',
      color: '#F4C542',
      bg: 'rgba(212, 175, 55, 0.15)'
    },
    {
      icon: Award,
      title: 'Weekly Test & Merit Tracking',
      description: 'Systematic assessments and test result tracking to build real exam confidence and time management.',
      color: '#D4AF37',
      bg: 'rgba(212, 175, 55, 0.15)'
    },
    {
      icon: Users,
      title: 'Personal Mentorship & Small Batches',
      description: 'Every student receives individual attention, dedicated doubt-clearing sessions, and regular guidance.',
      color: '#E6C76A',
      bg: 'rgba(230, 199, 106, 0.15)'
    },
    {
      icon: BookOpen,
      title: 'Targeted Navodaya & Board Prep',
      description: 'Specialized training for 5th & 6th Navodaya entrance, 10th Board, and 11th–12th Science stream.',
      color: '#FCF6BA',
      bg: 'rgba(212, 175, 55, 0.2)'
    }
  ];

  return (
    <section ref={sectionRef} className="aleem-intro-section" id="about">
      {/* Floating Soft Gradient Blobs (Aleem Inspiration) */}
      <div className="aleem-blob-left animate-float-blob1" aria-hidden="true" />
      <div className="aleem-blob-right animate-float-blob2" aria-hidden="true" />

      <div className="container" style={{ position: 'relative', zIndex: 5 }}>
        <div className="aleem-intro-grid">
          {/* Left Column: Narrative, Quote & Values with Scroll Reveal */}
          <div className={`scroll-reveal reveal-left ${sectionVisible ? 'revealed' : ''}`}>
            <div className="aleem-intro-badge">
              <Sparkles size={15} color="#F4C542" />
              <span>DISCOVER UNIQUE CLASSES</span>
            </div>

            <h2 className="aleem-intro-heading">
              Empowering Students With <br />
              <span style={{
                background: 'linear-gradient(135deg, #F4C542 0%, #D4AF37 50%, #B8860B 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Concept-Based Learning
              </span>{' '}
              & Top Ranks
            </h2>

            <p className="aleem-intro-desc">
              Located in the heart of Nilanga (District Latur), Unique Classes is dedicated to transforming school and junior college education. We replace rote memorization with deep visual fundamentals, disciplined study habits, and personalized attention that consistently yields top merit ranks.
            </p>

            {/* Stylized Director Quote Card (Aleem Games Pattern) */}
            <div className="aleem-quote-card">
              <svg className="aleem-quote-bg-svg" viewBox="0 0 400 160" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
                <circle cx="340" cy="-20" r="120" fill="#D4AF37" />
                <circle cx="60" cy="180" r="100" fill="#F4C542" />
                <circle cx="200" cy="80" r="60" fill="#B8860B" />
                <path d="M0 100 Q100 40 200 100 T400 100" stroke="#D4AF37" strokeWidth="2" fill="none" />
              </svg>

              <p className="aleem-quote-text">
                "Our sole mission is to awaken genuine curiosity in students, clear every conceptual hurdle, and turn their consistent hard work into top academic ranks."
              </p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
                <span className="aleem-quote-author">
                  — Faculty & Mentorship Team
                </span>
                <span style={{ fontSize: '0.8rem', fontWeight: 850, color: '#080808', background: 'var(--gold-btn-gradient)', padding: '0.2rem 0.6rem', borderRadius: '9999px' }}>
                  🏆 निकालाची फॅक्टरी
                </span>
              </div>
            </div>

            {/* 4 Feature Highlights Grid with Staggered Delays */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
              {highlights.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <div
                    key={idx}
                    className={`scroll-reveal ${sectionVisible ? 'revealed' : ''} stagger-${idx + 1}`}
                    style={{
                      background: '#12131A',
                      borderRadius: '1.25rem',
                      padding: '1.1rem',
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: '0.9rem',
                      border: '1.5px solid rgba(212, 175, 55, 0.2)',
                      boxShadow: '0 4px 15px rgba(0, 0, 0, 0.4)',
                      transition: 'transform 0.25s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; }}
                  >
                    <div
                      style={{
                        width: '42px',
                        height: '42px',
                        borderRadius: '12px',
                        background: item.bg,
                        color: item.color,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0
                      }}
                    >
                      <IconComponent size={20} strokeWidth={2.4} />
                    </div>
                    <div>
                      <h4 style={{ fontSize: '0.96rem', fontWeight: 800, color: '#FFFFFF', marginBottom: '0.25rem' }}>
                        {item.title}
                      </h4>
                      <p style={{ fontSize: '0.84rem', color: '#A3A3A3', lineHeight: 1.45, margin: 0 }}>
                        {item.description}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/courses" className="btn-fire">
                <span>Explore Academic Batches</span>
                <ArrowRight size={17} />
              </Link>

              <Link
                to="/contact"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  background: 'rgba(255, 255, 255, 0.05)',
                  color: '#F8F5EC',
                  border: '1.5px solid rgba(212, 175, 55, 0.35)',
                  padding: '0.9rem 1.7rem',
                  borderRadius: '9999px',
                  fontWeight: 750,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  transition: 'all 0.25s ease'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = 'rgba(212, 175, 55, 0.15)';
                  e.currentTarget.style.borderColor = '#F4C542';
                  e.currentTarget.style.color = '#F4C542';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                  e.currentTarget.style.borderColor = 'rgba(212, 175, 55, 0.35)';
                  e.currentTarget.style.color = '#F8F5EC';
                }}
              >
                <PhoneCall size={16} color="#F4C542" />
                <span>Visit Nilanga Branch</span>
              </Link>
            </div>
          </div>

          {/* Right Column: Cartoon Student Illustration with Parallax Scrolling & Floating Stickers */}
          <div
            ref={artParallaxRef}
            className={`aleem-intro-art-wrapper parallax-element scroll-reveal reveal-right ${sectionVisible ? 'revealed' : ''}`}
            style={{ transform: `translateY(${artParallaxOffset}px)` }}
          >
            <div className="aleem-intro-art-card">
              <img
                src={aboutGirlImg}
                alt="Student studying with focus at Unique Classes"
                className="aleem-intro-art-img"
                loading="lazy"
              />

              {/* Top Floating Badge */}
              <div
                style={{
                  position: 'absolute',
                  top: '16px',
                  right: '16px',
                  background: '#FFFFFF',
                  borderRadius: '9999px',
                  padding: '0.45rem 1rem',
                  boxShadow: '0 8px 25px rgba(0, 0, 0, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  border: '1.5px solid #FDE047',
                  fontWeight: 800,
                  fontSize: '0.82rem',
                  color: '#1E1B4B'
                }}
              >
                <span style={{ fontSize: '1.1rem' }}>⭐</span>
                <span>Top Achiever Prep</span>
              </div>

              {/* Bottom Card Glass Overlay */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '16px',
                  left: '16px',
                  right: '16px',
                  background: 'rgba(30, 27, 75, 0.88)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '1.25rem',
                  padding: '1rem 1.25rem',
                  color: '#FFFFFF',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
                  <span style={{ fontWeight: 800, fontSize: '0.92rem', color: '#FDE047' }}>
                    100% Concept Clarity
                  </span>
                  <span style={{ fontSize: '0.75rem', color: '#DDD6FE', fontWeight: 600 }}>
                    5th to 12th & Navodaya
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'rgba(255, 255, 255, 0.8)', margin: 0, lineHeight: 1.4 }}>
                  Personalized doubt solving with weekly progress tracking reports for parents.
                </p>
              </div>
            </div>

            {/* Floating Educational Stickers around the image */}
            <div style={{ position: 'absolute', top: '-20px', left: '-15px' }} className="animate-float-slow">
              <StarTrophySticker size={60} />
            </div>

            <div style={{ position: 'absolute', bottom: '40px', right: '-25px' }} className="animate-float-reverse">
              <FlyingBookSticker size={58} />
            </div>

            <div style={{ position: 'absolute', top: '45%', left: '-30px' }} className="animate-float-slow">
              <GraduationCapSticker size={54} />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
