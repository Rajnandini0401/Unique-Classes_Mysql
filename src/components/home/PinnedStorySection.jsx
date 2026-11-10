import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Trophy, BookOpen, Award, CheckCircle2, ArrowRight } from 'lucide-react';
import {
  StarTrophySticker,
  FlyingBookSticker,
  GraduationCapSticker,
  ScienceFlaskSticker,
  MathCompassSticker,
  TargetSticker,
  PencilRocketSticker
} from '../common/EduStickers';

import aboutGirlImg from '../../assets/illustrations/about_girl.jpg';
import topperChampionImg from '../../assets/illustrations/topper_champion.jpg';
import coursesBoyImg from '../../assets/illustrations/courses_boy.jpg';
import ctaSuccessImg from '../../assets/illustrations/cta_success.jpg';

const PinnedStorySection = () => {
  const [activeStep, setActiveStep] = useState(0);
  const containerRef = useRef(null);

  const steps = [
    {
      num: '01',
      badge: 'FOUNDATION PHASE',
      title: 'Conceptual Awakening & Intuitive Logic',
      tagline: 'We replace rote memorization with deep visual fundamentals.',
      description: 'Before solving textbook problems, students explore the core "Why" and "How" behind mathematical formulas and scientific principles. Visual demonstrations build lifelong understanding.',
      color: '#D4AF37',
      badgeBg: 'rgba(212, 175, 55, 0.15)',
      image: aboutGirlImg,
      metric: '100% Concept Clarity',
      sticker: 'compass',
      highlights: ['Interactive Concept Demos', 'Step-by-Step Fundamentals', 'Visual Geometry & Physics']
    },
    {
      num: '02',
      badge: 'DAILY RIGOR',
      title: 'Daily Practice Sheets & 1-on-1 Doubts',
      tagline: 'Personalized mentor attention in small focused batches.',
      description: 'Every student receives personal counseling, daily homework verification, and dedicated doubt-clearing sessions so no hurdle is left unresolved.',
      color: '#F59E0B',
      badgeBg: 'rgba(245, 158, 11, 0.15)',
      image: coursesBoyImg,
      metric: 'Zero Unresolved Doubts',
      sticker: 'flask',
      highlights: ['Small Focused Batches', 'Daily Practice Problems (DPPs)', 'Personal Mentor Check-ins']
    },
    {
      num: '03',
      badge: 'EXAM READINESS',
      title: 'Weekly Test Series & Automated Reports',
      tagline: 'Simulating real exam conditions every single weekend.',
      description: 'Systematic weekly assessments with instant automated WhatsApp results to parents. Students master time management, speed, and question selection.',
      color: '#E6C76A',
      badgeBg: 'rgba(230, 199, 106, 0.15)',
      image: ctaSuccessImg,
      metric: 'Weekly Merit Tracking',
      sticker: 'rocket',
      highlights: ['OMR & Subjective Tests', 'WhatsApp Parent Alerts', 'Merit Rank Declarations']
    },
    {
      num: '04',
      badge: 'MERIT VICTORY',
      title: 'Top Merit Ranks & Board Champions',
      tagline: 'Turning disciplined preparation into school & district toppers.',
      description: 'Our proven methodology has consistently produced 1st & 2nd rankers in 10th Board, 12th Science, and high selection ratios in Jawahar Navodaya Vidyalaya entrance.',
      color: '#F4C542',
      badgeBg: 'rgba(244, 197, 66, 0.18)',
      image: topperChampionImg,
      metric: 'निकालाची फॅक्टरी',
      sticker: 'trophy',
      highlights: ['Consistent District Toppers', 'Navodaya Entrance Mastery', 'Lifetime Academic Confidence']
    }
  ];

  // Scroll listener to update active step based on scroll position within the container
  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const totalDistance = rect.height - windowHeight;

            if (totalDistance > 0) {
              const scrolled = -rect.top;
              const ratio = scrolled / totalDistance;
              const clamped = Math.max(0, Math.min(0.999, ratio));
              const stepIndex = Math.floor(clamped * steps.length);
              setActiveStep(stepIndex);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [steps.length]);

  const currentStep = steps[activeStep];

  return (
    <section ref={containerRef} className="pinned-story-section" id="storytelling-journey">
      <div className="container">
        {/* Section Header */}
        <div className="aleem-section-header" style={{ marginBottom: '2.5rem' }}>
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
            marginBottom: '0.8rem'
          }}>
            <Sparkles size={14} color="#F4C542" />
            <span>INTERACTIVE STORYTELLING</span>
          </div>

          <h2 className="aleem-section-title">
            The Unique Classes <span style={{ color: '#F4C542' }}>Academic Journey</span>
          </h2>

          <div className="aleem-section-divider" />

          <p className="aleem-section-subtitle">
            Scroll through our student transformation journey. Watch how everyday curiosity transforms into top board ranks and entrance selection.
          </p>
        </div>

        {/* Pinned Layout: Left Story Milestones, Right Pinned Visual Transformation */}
        <div className="pinned-story-layout">
          {/* Left Column: Interactive Milestone Steps */}
          <div className="story-steps-column">
            {steps.map((step, idx) => {
              const isActive = activeStep === idx;
              return (
                <div
                  key={idx}
                  className={`story-step-card ${isActive ? 'active' : ''}`}
                  style={{
                    borderColor: isActive ? step.color : 'rgba(212, 175, 55, 0.18)',
                    boxShadow: isActive ? `0 12px 35px ${step.color}25` : '0 4px 15px rgba(0,0,0,0.4)'
                  }}
                  onClick={() => setActiveStep(idx)}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.6rem' }}>
                    <span
                      style={{
                        background: step.badgeBg,
                        color: step.color,
                        fontWeight: 800,
                        fontSize: '0.75rem',
                        padding: '0.25rem 0.75rem',
                        borderRadius: '9999px'
                      }}
                    >
                      {step.badge}
                    </span>

                    <span
                      style={{
                        fontSize: '1.4rem',
                        fontWeight: 900,
                        color: isActive ? step.color : 'rgba(255, 255, 255, 0.35)',
                        transition: 'color 0.3s ease'
                      }}
                    >
                      {step.num}
                    </span>
                  </div>

                  <h3
                    style={{
                      fontSize: '1.25rem',
                      fontWeight: 800,
                      color: isActive ? step.color : '#FFFFFF',
                      marginBottom: '0.4rem',
                      transition: 'color 0.3s ease'
                    }}
                  >
                    {step.title}
                  </h3>

                  <p style={{ fontSize: '0.92rem', fontWeight: 600, color: '#E2E8F0', marginBottom: '0.75rem' }}>
                    {step.tagline}
                  </p>

                  <p style={{ fontSize: '0.86rem', color: '#94A3B8', lineHeight: 1.6, marginBottom: '1rem' }}>
                    {step.description}
                  </p>

                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.45rem' }}>
                    {step.highlights.map((h, hIdx) => (
                      <span
                        key={hIdx}
                        style={{
                          background: isActive ? '#1E2230' : '#141620',
                          border: `1px solid ${isActive ? step.color + '55' : 'rgba(255, 255, 255, 0.1)'}`,
                          color: '#E2E8F0',
                          fontSize: '0.76rem',
                          fontWeight: 700,
                          padding: '0.2rem 0.6rem',
                          borderRadius: '9999px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem'
                        }}
                      >
                        <CheckCircle2 size={12} color={step.color} />
                        <span>{h}</span>
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Right Column: Pinned Transforming Visual Stage */}
          <div className="story-pinned-visual-wrapper">
            <div className="story-pinned-card">
              {/* Dynamic Glow Aura */}
              <div
                className="story-stage-glow animate-pulse-glow"
                style={{
                  background: `radial-gradient(circle, ${currentStep.color}35 0%, transparent 70%)`
                }}
              />

              {/* Progress Indicator Bar */}
              <div className="story-stage-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <span style={{ fontWeight: 900, fontSize: '1.1rem', color: currentStep.color }}>
                    Phase {currentStep.num}
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#94A3B8', fontWeight: 600 }}>
                    of 04
                  </span>
                </div>

                <div className="story-step-dots">
                  {steps.map((_, dotIdx) => (
                    <button
                      key={dotIdx}
                      className={`story-step-dot ${activeStep === dotIdx ? 'active' : ''}`}
                      style={{
                        background: activeStep === dotIdx ? currentStep.color : 'rgba(255, 255, 255, 0.2)'
                      }}
                      onClick={() => setActiveStep(dotIdx)}
                      aria-label={`Jump to stage ${dotIdx + 1}`}
                    />
                  ))}
                </div>
              </div>

              {/* Central Dynamic Image Screen with smooth fade */}
              <div className="story-image-screen">
                <img
                  src={currentStep.image}
                  alt={currentStep.title}
                  className="story-screen-img"
                  loading="eager"
                />

                {/* Overlaid Achievement Tag */}
                <div className="story-screen-tag animate-bounce-subtle">
                  <span>✨</span>
                  <span>{currentStep.metric}</span>
                </div>
              </div>

              {/* Dynamic Floating Stickers based on active step */}
              <div className="story-floating-sticker top-left animate-float-slow">
                {activeStep === 0 && <MathCompassSticker size={64} />}
                {activeStep === 1 && <ScienceFlaskSticker size={64} />}
                {activeStep === 2 && <PencilRocketSticker size={64} />}
                {activeStep === 3 && <StarTrophySticker size={64} />}
              </div>

              <div className="story-floating-sticker bottom-right animate-float-reverse">
                {activeStep === 0 && <FlyingBookSticker size={58} />}
                {activeStep === 1 && <TargetSticker size={56} />}
                {activeStep === 2 && <StarTrophySticker size={58} />}
                {activeStep === 3 && <GraduationCapSticker size={60} />}
              </div>

              {/* Bottom Quick Caption */}
              <div className="story-stage-footer">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div>
                    <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                      {currentStep.title}
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#94A3B8', margin: 0 }}>
                      Unique Classes Nilanga — Academic Protocol
                    </p>
                  </div>
                  <a
                    href="#admission-enquiry"
                    style={{
                      background: currentStep.color,
                      color: '#080808',
                      padding: '0.45rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.78rem',
                      fontWeight: 850,
                      textDecoration: 'none',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      boxShadow: `0 4px 15px ${currentStep.color}40`,
                      transition: 'transform 0.2s ease'
                    }}
                    onMouseEnter={(e) => { e.currentTarget.style.transform = 'scale(1.05)'; }}
                    onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <span>Enquire</span>
                    <ArrowRight size={13} />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default PinnedStorySection;
