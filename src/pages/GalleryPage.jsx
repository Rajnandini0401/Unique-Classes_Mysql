import React, { useState } from 'react';
import SectionHeading from '../components/common/SectionHeading';
import GalleryCard from '../components/cards/GalleryCard';
import CTASection from '../components/common/CTASection';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../components/common/ScrollAnimation';
import { galleryData } from '../data/gallery';
import { X } from 'lucide-react';

const GalleryPage = () => {
  const [activeModalItem, setActiveModalItem] = useState(null);

  return (
    <div className="gallery-page">
      {/* Header Banner */}
      <div style={{ background: 'var(--grad-hero)', color: '#FFFFFF', padding: '4.5rem 0 3.5rem 0', position: 'relative', overflow: 'hidden' }}>
        <div className="starlight-overlay" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
          <ScrollReveal direction="up" duration={0.6}>
            <div className="aleem-hero-badge" style={{ margin: '0 auto 1rem auto' }}>
              <span>📸 INSTITUTE MOMENTS & HIGHLIGHTS</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.8rem' }}>
              Photo Gallery — <span style={{ color: '#F4C542' }}>Unique Classes</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '720px', margin: '0 auto' }}>
              A visual look inside smart classroom sessions, award felicitations, practical experiments, and academic celebrations.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Pure Photo Grid Section */}
      <section className="section section-light">
        <div className="container">
          <StaggerContainer className="grid-3" staggerDelay={0.08}>
            {galleryData.map((item) => (
              <StaggerItem key={item.id} direction="scale" duration={0.45}>
                <GalleryCard
                  item={item}
                  onSelect={(selected) => setActiveModalItem(selected)}
                />
              </StaggerItem>
            ))}
          </StaggerContainer>
        </div>
      </section>

      {/* Full Screen Image Lightbox Modal */}
      {activeModalItem && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: 'rgba(5, 5, 8, 0.92)',
            backdropFilter: 'blur(12px)',
            zIndex: 2000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '2rem'
          }}
          onClick={() => setActiveModalItem(null)}
        >
          <div
            style={{
              position: 'relative',
              maxWidth: '850px',
              width: '100%',
              background: 'var(--bg-secondary-black)',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--border-gold)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.7)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setActiveModalItem(null)}
              aria-label="Close Lightbox"
              style={{
                position: 'absolute',
                top: '1rem',
                right: '1rem',
                background: 'var(--gold-btn-gradient)',
                color: '#080808',
                border: 'none',
                width: '38px',
                height: '38px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                zIndex: 10,
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.5)'
              }}
            >
              <X size={20} />
            </button>

            <img
              src={activeModalItem.image}
              alt={activeModalItem.title}
              style={{ width: '100%', maxHeight: '540px', objectFit: 'cover' }}
            />

            <div style={{ padding: '1.5rem', background: '#0D0E14' }}>
              <h3 style={{ fontSize: '1.3rem', color: 'var(--text-light)', marginBottom: '0.4rem' }}>
                {activeModalItem.title}
              </h3>
              <p style={{ color: 'var(--text-light-muted)', fontSize: '0.95rem' }}>
                {activeModalItem.caption}
              </p>
            </div>
          </div>
        </div>
      )}

      <CTASection />
    </div>
  );
};

export default GalleryPage;
