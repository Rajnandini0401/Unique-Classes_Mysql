import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import CourseCard from '../components/cards/CourseCard';
import TopOnePercentCard from '../components/cards/TopOnePercentCard';
import FacultyCard from '../components/cards/FacultyCard';
import CTASection from '../components/common/CTASection';
import StatsRibbon from '../components/home/StatsRibbon';
import TeachingJourney from '../components/home/TeachingJourney';
import CosmicResultsSection from '../components/home/CosmicResultsSection';
import FormulaMeshCanvas from '../components/common/FormulaMeshCanvas';
import StudentPortalGateway from '../components/home/StudentPortalGateway';
import {
  StarTrophySticker,
  FlyingBookSticker,
  GraduationCapSticker,
  ScienceFlaskSticker,
  MathCompassSticker,
  SparkleStarSticker,
  PencilRocketSticker
} from '../components/common/EduStickers';

import { useScrollReveal, useParallax } from '../utils/useScrollReveal';
import { ScrollReveal, StaggerContainer, StaggerItem, AnimatedCounter } from '../components/common/ScrollAnimation';
import { getPublicFacultyAPI } from '../services/api';
import { coursesData } from '../data/courses';
import heroTeacherImg from '../assets/illustrations/hero_teacher.png';

import {
  ArrowRight,
  Sparkles,
  Trophy,
  Award,
  Users,
  Image as ImageIcon,
  Megaphone,
  Calendar,
  PhoneCall,
  CheckCircle2,
  X
} from 'lucide-react';

const HomePage = () => {
  // All verified courses for display
  const [courses] = useState(coursesData);
  const [faculty, setFaculty] = useState([]);

  // Typewriter effect for Hero Title ("Unique" in large font on Line 1, "Classes, Nilanga" on Line 2)
  const line1Target = 'Unique';
  const line2Target = 'Classes, Nilanga';
  const totalLength = line1Target.length + line2Target.length; // 6 + 16 = 22

  const [typedHeroCount, setTypedHeroCount] = useState(totalLength);
  const [isDeletingHeroText, setIsDeletingHeroText] = useState(false);

  useEffect(() => {
    let timer;
    const typingSpeed = isDeletingHeroText ? 40 : 90;

    if (!isDeletingHeroText && typedHeroCount === totalLength) {
      // Pause when fully typed
      timer = setTimeout(() => setIsDeletingHeroText(true), 2400);
    } else if (isDeletingHeroText && typedHeroCount === 0) {
      // Pause when fully deleted before typing again
      setIsDeletingHeroText(false);
      timer = setTimeout(() => {}, 400);
    } else {
      timer = setTimeout(() => {
        setTypedHeroCount(prev =>
          isDeletingHeroText ? prev - 1 : prev + 1
        );
      }, typingSpeed);
    }

    return () => clearTimeout(timer);
  }, [typedHeroCount, isDeletingHeroText]);

  const typedLine1 = line1Target.substring(0, Math.min(typedHeroCount, line1Target.length));
  const typedLine2 = typedHeroCount > line1Target.length
    ? line2Target.substring(0, typedHeroCount - line1Target.length)
    : '';

  // Scroll Reveal & Parallax Hooks
  const [heroParallaxRef, heroParallaxOffset] = useParallax(0.12, 50);
  const [classesRef, classesVisible] = useScrollReveal({ threshold: 0.1 });
  const [facultyRef, facultyVisible] = useScrollReveal({ threshold: 0.1 });

  // Fetch verified faculty from MySQL database
  useEffect(() => {
    let isMounted = true;

    const loadPublicData = async () => {
      try {
        const facultyRes = await getPublicFacultyAPI();
        if (facultyRes?.success && Array.isArray(facultyRes.faculty) && isMounted) {
          setFaculty(facultyRes.faculty);
        }
      } catch (err) {
        console.error('Error fetching faculty dynamic data from MySQL:', err);
      }
    };

    loadPublicData();
    return () => { isMounted = false; };
  }, []);

  return (
    <div className="home-page" style={{ overflowX: 'hidden' }}>
      {/* =================================================================
          1. IMMERSIVE HERO SECTION WITH PARALLAX & STICKERS
          ================================================================= */}
      <section className="aleem-hero-wrapper" id="hero">
        <FormulaMeshCanvas accentColor="249, 115, 22" />
        <div className="hero-dark-vignette" aria-hidden="true" />

        {/* Large Atmospheric Ghost Watermark (Reference-inspired) */}
        <div className="hero-watermark-text" aria-hidden="true">
          <span>UNIQUE</span>
          <span>CLASSES</span>
        </div>

        <div className="container hero-split-container">
          {/* LEFT COLUMN: Typing Title ("Unique Classes, Nilanga") and Dual Action Buttons */}
          <div className="hero-left-content">
            {/* Bold Left-Aligned Two-Line Typewriter Headline with "Unique" in large font on Line 1 and "Classes, Nilanga" on Line 2 */}
            <h1
              className="hero-main-title typing-hero-title"
              style={{
                minHeight: 'clamp(4.8rem, 11vw, 10.5rem)',
                marginBottom: '2rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '0.25rem'
              }}
            >
              {/* LINE 1: "Unique" in huge bold font */}
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 'clamp(2.5rem, 8vw, 5.8rem)',
                  fontWeight: 950,
                  lineHeight: 1.05,
                  letterSpacing: '-0.035em',
                  color: '#F4C542',
                  textShadow: '0 4px 30px rgba(244, 197, 66, 0.35)'
                }}
              >
                {typedLine1}
                {typedHeroCount <= line1Target.length && (
                  <span className="typing-cursor">|</span>
                )}
              </span>

              {/* LINE 2: "Classes, Nilanga" right below it */}
              <span
                style={{
                  display: 'inline-block',
                  fontSize: 'clamp(1.6rem, 4.4vw, 3.4rem)',
                  fontWeight: 850,
                  lineHeight: 1.2,
                  letterSpacing: '-0.02em'
                }}
              >
                <span style={{ color: '#FFFFFF' }}>
                  {typedLine2.slice(0, 7)}
                </span>
                <span className="hero-title-gradient">
                  {typedLine2.slice(7)}
                </span>
                {typedHeroCount > line1Target.length && (
                  <span className="typing-cursor">|</span>
                )}
              </span>
            </h1>

            {/* Dual Action Buttons */}
            <div className="hero-button-group" style={{ marginBottom: 0 }}>
              <a href="#classes" className="hero-btn-primary">
                <span>🚀 Explore Classes &amp; Batches</span>
                <ArrowRight size={18} />
              </a>
              <Link
                to="/login"
                className="hero-btn-secondary"
              >
                <Sparkles size={17} color="#F97316" />
                <span>Student Portal Login</span>
              </Link>
            </div>
          </div>

          {/* RIGHT COLUMN: Teacher Portrait with Warm Orange Glow & Floating Animation */}
          <div
            ref={heroParallaxRef}
            className="hero-right-portrait-area"
            style={{ transform: `translateY(${heroParallaxOffset}px)` }}
          >
            {/* Subtle Warm Orange Glow directly behind teacher */}
            <div className="hero-portrait-glow-core" aria-hidden="true" />
            <div className="hero-portrait-glow-outer" aria-hidden="true" />

            {/* Teacher Cutout Frame with Smooth Entrance & Float Animations */}
            <div className="hero-portrait-frame">
              <img
                src={heroTeacherImg}
                alt="Kishor Mane - Director of Unique Classes Nilanga"
                className="hero-teacher-portrait-img"
                loading="eager"
              />

              {/* Floating Director Badge - Bottom Left */}
              <div className="hero-floating-glass-chip chip-bottom-left">
                <div className="chip-icon-box">
                  <Award size={18} color="#F4C542" />
                </div>
                <div className="chip-text-content">
                  <span className="chip-title">Kishor Mane</span>
                  <span className="chip-subtitle">Director, Unique Classes</span>
                </div>
              </div>

              {/* Floating Experience Badge - Top Right */}
              <div className="hero-floating-glass-chip chip-top-right">
                <div className="chip-icon-box">
                  <Sparkles size={16} color="#F4C542" />
                </div>
                <div className="chip-text-content">
                  <span className="chip-title">
                    <AnimatedCounter value="10+" /> Years
                  </span>
                  <span className="chip-subtitle">Teaching Experience</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Organic Curved Wave Divider at Bottom */}
        <div className="wave-bottom-divider">
          <svg viewBox="0 0 1200 120" preserveAspectRatio="none" fill="#07080A">
            <path d="M0,0 C150,90 350,-40 500,45 C650,130 900,10 1200,50 L1200,120 L0,120 Z" />
          </svg>
        </div>
      </section>

      {/* =================================================================
          LIVE SCROLL-BASED STATS RIBBON (COUNTING UP ON SCROLL)
          ================================================================= */}
      <StatsRibbon />

      {/* =================================================================
          4-STEP TEACHING JOURNEY & METHODOLOGY LOOP
          ================================================================= */}
      <TeachingJourney />

      {/* =================================================================
          ONLINE COURSES SECTION (MINIMAL, WELL-ALIGNED, ROYAL BLACK & GOLD)
          ================================================================= */}
      <section className="aleem-classes-section" id="classes" style={{ background: '#090B10', padding: '5.5rem 0' }}>
        <div className="container">
          {/* Prominent Online Courses Heading with Royal Gold Accents */}
          <ScrollReveal direction="up" duration={0.6}>
            <div className="aleem-section-header" style={{ marginBottom: '3.5rem' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(212, 175, 55, 0.12)',
                color: '#F4C542',
                padding: '0.4rem 1.2rem',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '0.9rem',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}>
                <Sparkles size={14} color="#F4C542" />
                <span>DIGITAL LEARNING &amp; LIVE APP BATCHES</span>
              </div>

              <h2 className="aleem-section-title" style={{ fontSize: 'clamp(2.3rem, 4.5vw, 3.4rem)', fontWeight: 900, letterSpacing: '-0.02em', color: '#FFFFFF', marginBottom: '1rem' }}>
                Online <span style={{ color: '#F4C542' }}>Courses</span>
              </h2>

              <div className="aleem-section-divider" style={{ marginBottom: '1.25rem' }} />
            </div>
          </ScrollReveal>

          {/* Prominent Featured Course: TOP 1% CLUB */}
          <ScrollReveal direction="up" delay={0.1} glow={true} style={{ maxWidth: '1050px', margin: '0 auto 3rem auto' }}>
            <TopOnePercentCard />
          </ScrollReveal>

          {/* Label for Academic Year Online Batches */}
          <div style={{ textAlign: 'center', marginBottom: '2.25rem' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              background: 'rgba(212, 175, 55, 0.08)',
              border: '1px solid rgba(212, 175, 55, 0.25)',
              padding: '0.35rem 1.1rem',
              borderRadius: '9999px',
              color: '#CBD5E1',
              fontSize: '0.8rem',
              fontWeight: 800,
              letterSpacing: '0.05em',
              textTransform: 'uppercase'
            }}>
              <span>10th Standard Full-Year Online Batches</span>
            </div>
          </div>

          {/* Attractive, Well-Aligned Minimal Online Course Cards */}
          <StaggerContainer
            className="grid-2"
            style={{
              maxWidth: '1050px',
              margin: '0 auto 3rem auto',
              gap: '2.5rem'
            }}
            staggerDelay={0.12}
          >
            {courses
              .filter(course => course.mode?.toLowerCase().includes('online') || course.id.toLowerCase().includes('online'))
              .map((course) => (
                <StaggerItem key={course.id}>
                  <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                    <CourseCard course={course} minimal={true} />
                  </div>
                </StaggerItem>
              ))}
          </StaggerContainer>

          {/* Classroom & Offline Batches Gateway */}
          <div style={{ textAlign: 'center', padding: '0 0.5rem' }}>
            <Link
              to="/courses"
              className="btn-fire"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.6rem',
                maxWidth: '100%',
                textAlign: 'center',
                whiteSpace: 'normal',
                lineHeight: 1.35,
                padding: '0.85rem 1.6rem',
                fontSize: '0.95rem'
              }}
            >
              <span>Explore All Classroom Batches (5th–12th)</span>
              <ArrowRight size={17} style={{ flexShrink: 0 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================================
          STORYTELLING STAGE 4: ACADEMIC RESULTS & TEST TOPPERS (COSMIC DARK)
          ================================================================= */}
      <CosmicResultsSection />

      {/* =================================================================
          STORYTELLING STAGE 5: MEET THE SPECIALIST TEACHERS (STAGGERED)
          ================================================================= */}
      <section className="aleem-faculty-section" id="teachers">
        <div className="container">
          <ScrollReveal direction="up" duration={0.6}>
            <div className="aleem-section-header">
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.45rem',
                background: 'rgba(212, 175, 55, 0.12)',
                color: '#F4C542',
                padding: '0.35rem 1.1rem',
                borderRadius: '9999px',
                fontSize: '0.82rem',
                fontWeight: 800,
                marginBottom: '0.8rem',
                border: '1px solid rgba(212, 175, 55, 0.3)'
              }}>
                <span>👨‍🏫 EXPERIENCED EDUCATORS</span>
              </div>

              <h2 className="aleem-section-title">
                Meet Our Expert <span style={{ color: '#F4C542' }}>Mentors</span>
              </h2>

              <div className="aleem-section-divider" />
            </div>
          </ScrollReveal>

          {faculty.length > 0 ? (
            <StaggerContainer
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
                gap: '1.75rem',
                marginBottom: '3rem'
              }}
              staggerDelay={0.09}
            >
              {faculty.slice(0, 4).map((member) => (
                <StaggerItem key={member.id || member.teacherId}>
                  <FacultyCard faculty={member} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          ) : (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#9CA3AF' }}>
              <p>Faculty members are assigned directly per batch. View our complete faculty directory.</p>
            </div>
          )}

          <div style={{ textAlign: 'center' }}>
            <Link
              to="/faculty"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                border: '1.5px solid #D4AF37',
                color: '#F4C542',
                padding: '0.8rem 2rem',
                borderRadius: '9999px',
                fontWeight: 750,
                fontSize: '0.95rem',
                textDecoration: 'none',
                transition: 'all 0.25s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--gold-btn-gradient)';
                e.currentTarget.style.color = '#080808';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.color = '#F4C542';
              }}
            >
              <Users size={17} />
              <span>View All Faculty Profiles</span>
            </Link>
          </div>
        </div>
      </section>

      {/* =================================================================
          STUDENT & PARENT PORTAL SHOWCASE (PILLAR 1 GATEWAY)
          ================================================================= */}
      <StudentPortalGateway />

      {/* =================================================================
          STORYTELLING STAGE 7: ADMISSION ENQUIRY & APP (ALEEM DOWNLOAD BANNER)
          ================================================================= */}
      <CTASection />
    </div>
  );
};

export default HomePage;
