import React from 'react';
import CourseCard from '../components/cards/CourseCard';
import TopOnePercentCard from '../components/cards/TopOnePercentCard';
import AdmissionTimeline from '../components/common/AdmissionTimeline';
import CTASection from '../components/common/CTASection';
import { ScrollReveal, StaggerContainer, StaggerItem } from '../components/common/ScrollAnimation';
import { coursesData } from '../data/courses';

const CoursesPage = () => {
  return (
    <div className="courses-page">
      {/* Main Courses Breakdown */}
      <section className="section section-light" style={{ background: '#090B10' }}>
        <div className="container">
          {/* Section 1: Online Classes */}
          <div style={{ marginBottom: '4.5rem' }}>
            <ScrollReveal direction="up" duration={0.6}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 850, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Online <span style={{ color: '#F4C542' }}>Classes</span>
                </h2>
                <p style={{ fontSize: '1.05rem', color: '#94A3B8', maxWidth: '750px', margin: '0 auto' }}>
                  मराठी व सेमी इंग्रजी दोन्ही माध्यमांसाठी स्वतंत्र ऑनलाईन बॅचेस आणि लाईव्ह सेशन्स.
                </p>
              </div>
            </ScrollReveal>

            {/* Featured Spotlight: TOP 1% CLUB */}
            <ScrollReveal direction="up" delay={0.1} glow={true} style={{ marginBottom: '3.5rem' }}>
              <TopOnePercentCard />
            </ScrollReveal>

            {/* The 2 Online Course Cards (Grid-2 Staggered) */}
            <StaggerContainer className="grid-2" style={{ marginBottom: '3rem' }} staggerDelay={0.12}>
              {coursesData.slice(0, 2).map((course) => (
                <StaggerItem key={course.id}>
                  <CourseCard course={course} />
                </StaggerItem>
              ))}
            </StaggerContainer>

            {/* Animated Vertical Timeline: 4-Step Admission & Joining Process */}
            <AdmissionTimeline />
          </div>

          {/* Section 2: Offline Classes */}
          <div style={{ marginTop: '4rem', marginBottom: '2rem' }}>
            <ScrollReveal direction="up" duration={0.6}>
              <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
                <h2 style={{ fontSize: 'clamp(2rem, 4vw, 2.6rem)', fontWeight: 850, color: '#FFFFFF', marginBottom: '0.5rem' }}>
                  Offline <span style={{ color: '#F4C542' }}>Classes</span>
                </h2>
                <p style={{ color: '#94A3B8', fontSize: '1.05rem', maxWidth: '750px', margin: '0 auto' }}>
                  निलंगा येथील आमच्या क्लासरूम मध्ये नियमित बॅचेस, वीकली टेस्ट आणि वैयक्तिक लक्ष.
                </p>
              </div>
            </ScrollReveal>

            <StaggerContainer className="grid-3" staggerDelay={0.09}>
              {coursesData.slice(2).map((course) => (
                <StaggerItem key={course.id}>
                  <CourseCard course={course} />
                </StaggerItem>
              ))}
            </StaggerContainer>
          </div>
        </div>
      </section>

      <CTASection />
    </div>
  );
};

export default CoursesPage;
