import React, { useState, useEffect } from 'react';
import SectionHeading from '../components/common/SectionHeading';
import AnnouncementCard from '../components/cards/AnnouncementCard';
import CTASection from '../components/common/CTASection';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../components/common/ScrollAnimation';
import { getPublicAnnouncementsAPI } from '../services/api';
import { Megaphone, Loader2 } from 'lucide-react';

const AnnouncementsPage = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchPublicAnnouncements = async () => {
      try {
        setLoading(true);
        const res = await getPublicAnnouncementsAPI();
        if (res && res.success && Array.isArray(res.announcements) && isMounted) {
          setAnnouncements(res.announcements);
        }
      } catch (err) {
        console.error('Error fetching dynamic public announcements:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchPublicAnnouncements();
    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="announcements-page">
      {/* Banner */}
      <div style={{ background: 'var(--grad-hero)', color: '#FFFFFF', padding: '4.5rem 0 3.5rem 0', position: 'relative', overflow: 'hidden' }}>
        <div className="starlight-overlay" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
          <ScrollReveal direction="up" duration={0.6}>
            <div className="aleem-hero-badge" style={{ margin: '0 auto 1rem auto' }}>
              <Megaphone size={14} color="#F4C542" />
              <span>OFFICIAL UPDATES & NOTICES</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.8rem' }}>
              Institute Announcements — <span style={{ color: '#F4C542' }}>Unique Classes</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '720px', margin: '0 auto' }}>
              सार्वजनिक सूचना व महत्त्वाचे अपडेट्स. Stay informed about active test schedules, exam announcements, and holiday schedules.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Announcements List */}
      <section className="section section-black" style={{ background: '#080808', minHeight: '400px' }}>
        <div className="container">
          {loading ? (
            <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--color-metallic-gold)' }}>
              <Loader2 size={36} className="spinner" style={{ animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
              <p style={{ color: '#94a3b8' }}>सार्वजनिक सूचना लोड होत आहेत...</p>
            </div>
          ) : announcements.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#0d1117', borderRadius: '12px', border: '1px solid rgba(212, 175, 55, 0.2)' }}>
              <Megaphone size={42} color="var(--color-metallic-gold)" style={{ margin: '0 auto 1.2rem', opacity: 0.8 }} />
              <h3 style={{ fontSize: '1.3rem', color: '#f8fafc', marginBottom: '0.5rem' }}>सध्या कोणतीही नवीन सार्वजनिक सूचना उपलब्ध नाही</h3>
              <p style={{ fontSize: '0.95rem', color: '#64748b' }}>No active public announcements at the moment. Please check back later.</p>
            </div>
          ) : (
            <StaggerContainer className="grid-2" staggerDelay={0.09}>
              {announcements.map((item) => (
                <StaggerItem key={item.id || item._id}>
                  <AnnouncementCard announcement={item} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}
        </div>
      </section>

      <CTASection />
    </div>
  );
};

export default AnnouncementsPage;
