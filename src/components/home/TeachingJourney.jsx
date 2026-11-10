import React from 'react';
import { TargetSticker, StarTrophySticker, FlyingBookSticker, ScienceFlaskSticker, SparkleStarSticker } from '../common/EduStickers';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../common/ScrollAnimation';
import MethodologyLoop from './MethodologyLoop';

const TeachingJourney = () => {
  const steps = [
    {
      number: '01',
      title: 'Concept-First Foundation',
      description: 'Building deep intuitive clarity in Science & Mathematics without rote memorization.',
      icon: '🎯',
      color: '#F4C542',
      bg: 'rgba(244, 197, 66, 0.15)',
      sticker: <TargetSticker size={32} />
    },
    {
      number: '02',
      title: 'Daily Practice & Doubts',
      description: 'Small focused batches where every student gets personal attention and 1-on-1 doubt solving.',
      icon: '💡',
      color: '#E6C76A',
      bg: 'rgba(230, 199, 106, 0.15)',
      sticker: <FlyingBookSticker size={32} />
    },
    {
      number: '03',
      title: 'Weekly Testing & Tracking',
      description: 'Systematic weekly assessments, rank declarations, and continuous parent progress reports.',
      icon: '📊',
      color: '#F59E0B',
      bg: 'rgba(245, 158, 11, 0.15)',
      sticker: <ScienceFlaskSticker size={32} />
    },
    {
      number: '04',
      title: 'Board & Navodaya Mastery',
      description: 'Proven strategies for Maharashtra Board exams and Jawahar Navodaya entrance selections.',
      icon: '🏆',
      color: '#D4AF37',
      bg: 'rgba(212, 175, 55, 0.15)',
      sticker: <StarTrophySticker size={32} />
    }
  ];

  return (
    <section className="aleem-journey-section" id="teaching-approach" style={{ position: 'relative', overflow: 'hidden' }}>
      {/* Subtle floating background stars */}
      <div style={{ position: 'absolute', top: '15%', left: '5%', opacity: 0.6, pointerEvents: 'none' }} className="animate-float-slow">
        <SparkleStarSticker size={24} color="#D4AF37" />
      </div>
      <div style={{ position: 'absolute', bottom: '15%', right: '4%', opacity: 0.5, pointerEvents: 'none' }} className="animate-float-reverse">
        <SparkleStarSticker size={28} color="#F4C542" />
      </div>

      <div className="container">
        {/* Section Header */}
        <ScrollReveal direction="up" duration={0.6}>
          <div
            className="aleem-section-header"
            style={{ marginBottom: '2.5rem' }}
          >
            <h2 className="aleem-section-title" style={{ marginBottom: 0 }}>
              Our 4-Step <span style={{ color: '#F4C542' }}>Teaching Approach</span>
            </h2>
          </div>
        </ScrollReveal>

        {/* Interactive 4-Stage Orbiting Cycle Loop */}
        <ScrollReveal direction="up" delay={0.1}>
          <div style={{ marginBottom: '3.5rem' }}>
            <MethodologyLoop />
          </div>
        </ScrollReveal>

        {/* 4-Step Grid with Staggered Scroll Reveal */}
        <StaggerContainer className="aleem-journey-grid" staggerDelay={0.1}>
          {steps.map((step, idx) => (
            <StaggerItem key={idx}>
              <div
                className="aleem-journey-card"
                style={{
                  border: `2px solid ${step.color}25`,
                  position: 'relative',
                  height: '100%'
                }}
              >
                <div
                  className="aleem-step-icon-wrap"
                  style={{
                    background: step.bg,
                    color: step.color
                  }}
                >
                  {step.icon}
                </div>

                <div
                  className="aleem-step-num"
                  style={{ color: `${step.color}50` }}
                >
                  {step.number}
                </div>

                <h3
                  className="aleem-step-title"
                  style={{ color: step.color }}
                >
                  {step.title}
                </h3>

                <p className="aleem-step-desc">
                  {step.description}
                </p>
              </div>
            </StaggerItem>
          ))}
        </StaggerContainer>
      </div>
    </section>
  );
};

export default TeachingJourney;

