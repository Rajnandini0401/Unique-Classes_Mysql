import React, { useState, useEffect } from 'react';
import SectionHeading from '../components/common/SectionHeading';
import FacultyCard from '../components/cards/FacultyCard';
import CTASection from '../components/common/CTASection';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../components/common/ScrollAnimation';
import { getPublicFacultyAPI } from '../services/api';
import { Award, BookOpen, HeartHandshake, Loader2, Users } from 'lucide-react';

const FacultyPage = () => {
  const [facultyList, setFacultyList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const loadFaculty = async () => {
      try {
        setLoading(true);
        const res = await getPublicFacultyAPI();
        if (res && res.success && Array.isArray(res.faculty) && isMounted) {
          setFacultyList(res.faculty);
        }
      } catch (err) {
        console.error('Error fetching dynamic faculty from MySQL database:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    loadFaculty();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="faculty-page">
      {/* Header Banner */}
      <div style={{ background: 'var(--grad-hero)', color: '#FFFFFF', padding: '4.5rem 0 3.5rem 0', position: 'relative', overflow: 'hidden' }}>
        <div className="starlight-overlay" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
          <ScrollReveal direction="up" duration={0.6}>
            <div className="aleem-hero-badge" style={{ margin: '0 auto 1rem auto' }}>
              <Users size={14} color="#F4C542" />
              <span>EXPERIENCED & DEDICATED MENTORS</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.8rem' }}>
              Faculty of <span style={{ color: '#F4C542' }}>Unique Classes</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '720px', margin: '0 auto' }}>
              Our team of subject-matter specialists is dedicated to bringing out the best academic potential in every student through concept-first teaching.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Main Faculty Grid */}
      <section className="section section-light" style={{ minHeight: '400px' }}>
        <div className="container">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
              <Loader2 size={36} style={{ color: 'var(--color-metallic-gold)', marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading official faculty directory...</p>
            </div>
          ) : facultyList.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '4rem 1rem', background: '#12131A', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '16px', maxWidth: '600px', margin: '0 auto' }}>
              <Users size={48} color="#D4AF37" style={{ marginBottom: '1rem', opacity: 0.8 }} />
              <h3 style={{ color: '#FFFFFF', marginBottom: '0.5rem' }}>No Active Faculty Members Found</h3>
              <p style={{ maxWidth: '500px', margin: '0 auto', fontSize: '0.9rem', color: '#94a3b8' }}>
                Faculty profiles will be published here upon administrative assignment.
              </p>
            </div>
          ) : (
            <StaggerContainer className="grid-3" style={{ marginBottom: '4rem' }} staggerDelay={0.09}>
              {facultyList.map((faculty) => (
                <StaggerItem key={faculty.id}>
                  <FacultyCard faculty={faculty} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          )}

          {/* Academic Philosophy */}
          <ScrollReveal direction="up" delay={0.1} glow={true}>
            <div
              style={{
                background: 'linear-gradient(135deg, #080808 0%, #151515 100%)',
                borderRadius: 'var(--radius-lg)',
                padding: '3rem 2rem',
                color: 'var(--text-light)',
                border: '1px solid var(--border-gold)'
              }}
            >
              <h3 style={{ fontSize: '1.8rem', textAlign: 'center', marginBottom: '2rem', color: 'var(--text-light)' }}>
                Our Teaching Philosophy
              </h3>

              <StaggerContainer className="grid-3" staggerDelay={0.12}>
                <StaggerItem>
                  <div style={{ textAlign: 'center' }}>
                    <BookOpen size={36} color="var(--color-metallic-gold)" style={{ margin: '0 auto 1rem auto' }} />
                    <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'white' }}>Concept Depth</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light-muted)' }}>
                      We replace rote learning with intuitive visual logic and fundamental principles.
                    </p>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div style={{ textAlign: 'center' }}>
                    <Award size={36} color="var(--color-bright-gold)" style={{ margin: '0 auto 1rem auto' }} />
                    <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'white' }}>Rigorous Practice</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light-muted)' }}>
                      Weekly assessments and step-by-step problem sessions train speed and accuracy.
                    </p>
                  </div>
                </StaggerItem>

                <StaggerItem>
                  <div style={{ textAlign: 'center' }}>
                    <HeartHandshake size={36} color="var(--color-champagne-gold)" style={{ margin: '0 auto 1rem auto' }} />
                    <h4 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', color: 'white' }}>Personal Attention</h4>
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-light-muted)' }}>
                      Individual student progress monitoring with dedicated doubt resolution sessions.
                    </p>
                  </div>
                </StaggerItem>
              </StaggerContainer>
            </div>
          </ScrollReveal>
        </div>
      </section>

      <CTASection />
    </div>
  );
};

export default FacultyPage;
