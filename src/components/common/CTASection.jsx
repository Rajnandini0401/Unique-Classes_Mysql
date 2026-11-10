import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, PhoneCall, MapPin, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import ctaSuccessImg from '../../assets/illustrations/cta_success.jpg';
import { StarTrophySticker, PencilRocketSticker, SparkleStarSticker } from './EduStickers';
import { useScrollReveal, useParallax } from '../../utils/useScrollReveal';

const CTASection = () => {
  const [ctaRef, ctaVisible] = useScrollReveal({ threshold: 0.15 });
  const [ctaParallaxRef, ctaParallaxOffset] = useParallax(0.12, 45);

  return (
    <section ref={ctaRef} className="aleem-cta-section" id="admission-enquiry">
      {/* Background Soft Orbs & Starlight */}
      <div className="cosmic-starlight-overlay" aria-hidden="true" />
      <div
        style={{
          position: 'absolute',
          top: '-20%',
          right: '-10%',
          width: '450px',
          height: '450px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255, 255, 255, 0.25) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-20%',
          left: '-10%',
          width: '500px',
          height: '500px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(253, 224, 71, 0.2) 0%, transparent 70%)',
          filter: 'blur(50px)',
          pointerEvents: 'none'
        }}
      />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        <div className="aleem-cta-grid">
          {/* Left Column: Heading, Helpline, App, and Enquiry Button with Scroll Reveal */}
          <div className={`scroll-reveal reveal-left ${ctaVisible ? 'revealed' : ''}`}>
            <div className="aleem-cta-badge">
              <Sparkles size={15} color="#F4C542" />
              <span>ADMISSION 2026–27 OPEN</span>
            </div>

            <h2 className="aleem-cta-title">
              Ready to Accelerate Your <br />
              Academic Performance?
            </h2>

            <p className="aleem-cta-desc">
              Join Nilanga's premier coaching institute for 5th–12th Standard school foundations, Science stream, and Jawahar Navodaya entrance prep. Experience conceptual clarity, personal mentoring, and weekly tests that guarantee excellence.
            </p>

            {/* Quick Benefits Checklist */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#D4AF37" />
                <span>Small Personalized Batches</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#D4AF37" />
                <span>Weekly Tests & Merit Ranks</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#D4AF37" />
                <span>Official App & Online Notes</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', color: '#FFFFFF', fontWeight: 600 }}>
                <CheckCircle2 size={18} color="#D4AF37" />
                <span>Navodaya Entrance Mastery</span>
              </div>
            </div>

            {/* Helpline & Location Strip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                flexWrap: 'wrap',
                background: 'rgba(18, 19, 26, 0.75)',
                backdropFilter: 'blur(10px)',
                padding: '0.85rem 1.4rem',
                borderRadius: '1rem',
                border: '1.5px solid rgba(212, 175, 55, 0.35)',
                marginBottom: '2rem'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <PhoneCall size={18} color="#D4AF37" />
                <span style={{ fontWeight: 800, fontSize: '0.92rem' }}>
                  Helpline:{' '}
                  <a href="tel:8308433436" style={{ color: '#F4C542', textDecoration: 'none' }}>8308433436</a>
                  {' / '}
                  <a href="tel:8308433435" style={{ color: '#F4C542', textDecoration: 'none' }}>8308433435</a>
                </span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.88rem' }}>
                <MapPin size={16} color="#FFFFFF" />
                <span>Main Campus, Nilanga (Dist. Latur)</span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="aleem-cta-store-buttons">
              <Link to="/contact" className="btn-store-pill fire-accent">
                <span>Direct Admission Enquiry</span>
                <ArrowRight size={17} />
              </Link>

              <a
                href="https://play.google.com/store/apps/details?id=co.bran.vflsm"
                target="_blank"
                rel="noopener noreferrer"
                className="btn-store-pill"
              >
                <Smartphone size={18} />
                <span>Download Android App</span>
              </a>
            </div>
          </div>

          {/* Right Column: Cartoon Character Artwork with Scroll Parallax */}
          <div
            ref={ctaParallaxRef}
            className={`aleem-cta-art-box parallax-element scroll-reveal reveal-right ${ctaVisible ? 'revealed' : ''}`}
            style={{ transform: `translateY(${ctaParallaxOffset}px)` }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={ctaSuccessImg}
                alt="Happy successful students of Unique Classes"
                className="aleem-cta-art-img"
                loading="lazy"
              />

              {/* Top floating pill */}
              <div
                style={{
                  position: 'absolute',
                  top: '-15px',
                  right: '-10px',
                  background: '#12131A',
                  color: '#FFFFFF',
                  borderRadius: '9999px',
                  padding: '0.5rem 1.1rem',
                  fontWeight: 800,
                  fontSize: '0.85rem',
                  boxShadow: '0 10px 25px rgba(0, 0, 0, 0.5)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  border: '2px solid #D4AF37'
                }}
                className="animate-float-slow"
              >
                <span>🚀</span>
                <span>Admissions In Progress</span>
              </div>

              {/* Floating stickers */}
              <div style={{ position: 'absolute', bottom: '-20px', left: '-25px' }} className="animate-float-slow">
                <PencilRocketSticker size={65} />
              </div>
              <div style={{ position: 'absolute', top: '35%', right: '-30px' }} className="animate-float-reverse">
                <StarTrophySticker size={58} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
