import React, { useState, useEffect, useRef, useMemo } from 'react';
import SectionHeading from '../components/common/SectionHeading';
import ResultCard from '../components/cards/ResultCard';
import CTASection from '../components/common/CTASection';
import { ScrollReveal } from '../components/common/ScrollAnimation';
import { getPublicTestToppersAPI } from '../services/api';
import { ChevronUp, ChevronDown, Award, Loader2, Trophy, Clock, Sparkles } from 'lucide-react';
import '../styles/results-page.css';

const ResultsPage = () => {
  const [activeClass, setActiveClass] = useState('ALL');
  const [liveResults, setLiveResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const isAutoScrollingRef = useRef(false);

  // Ordered Class Navigation list
  const classes = [
    { key: 'ALL', label: 'All' },
    { key: '10th', label: '10th' },
    { key: '9th', label: '9th' },
    { key: '8th', label: '8th' },
    { key: '7th', label: '7th' },
    { key: '6th', label: '6th' },
    { key: '5th', label: '5th' },
    { key: '11th', label: '11th' },
    { key: '12th', label: '12th' },
    { key: 'Navodaya', label: 'Navodaya' },
  ];

  const classOrder = ['10th', '9th', '8th', '7th', '6th', '5th', '11th', '12th', 'Navodaya'];

  // Fetch real database results on mount
  useEffect(() => {
    let isMounted = true;
    const fetchResults = async () => {
      try {
        setLoading(true);
        const res = await getPublicTestToppersAPI({ latestOnly: true });
        if (res && res.success && Array.isArray(res.data) && isMounted) {
          setLiveResults(res.data);
        }
      } catch (err) {
        console.error('Error fetching dynamic results from MySQL database:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };
    fetchResults();
    return () => { isMounted = false; };
  }, []);

  // Group tests by class to render vertically class-by-class: 10th, then 9th, then continue
  const testsByClass = useMemo(() => {
    const map = {};
    classOrder.forEach((cls) => {
      map[cls] = [];
    });

    liveResults.forEach((res) => {
      const raw = (res.classKey || '').trim();
      const matched = classOrder.find(
        (c) => c.toLowerCase() === raw.toLowerCase() || raw.toLowerCase().startsWith(c.toLowerCase())
      );
      if (matched) {
        map[matched].push(res);
      } else {
        if (!map[raw]) map[raw] = [];
        map[raw].push(res);
      }
    });

    return map;
  }, [liveResults]);

  // Smooth vertical scroll taking exactly 0.5 seconds (500ms)
  const smoothScrollTo = (targetPosition, duration = 500) => {
    isAutoScrollingRef.current = true;
    const startPosition = window.pageYOffset;
    const distance = targetPosition - startPosition;
    let startTime = null;

    const easeInOutCubic = (t) =>
      t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;

    const step = (currentTime) => {
      if (!startTime) startTime = currentTime;
      const timeElapsed = currentTime - startTime;
      const progress = Math.min(timeElapsed / duration, 1);
      const ease = easeInOutCubic(progress);

      window.scrollTo(0, startPosition + distance * ease);

      if (timeElapsed < duration) {
        requestAnimationFrame(step);
      } else {
        setTimeout(() => {
          isAutoScrollingRef.current = false;
        }, 80);
      }
    };

    requestAnimationFrame(step);
  };

  // Jump to specific class section in 0.5s
  const handleSelectClass = (key) => {
    setActiveClass(key);

    if (key === 'ALL') {
      const topElem = document.getElementById('results-top-anchor');
      const targetPos = topElem ? topElem.getBoundingClientRect().top + window.pageYOffset - 130 : 0;
      smoothScrollTo(Math.max(0, targetPos), 500);
      return;
    }

    const targetElem = document.getElementById(`class-section-${key}`);
    if (targetElem) {
      const navOffset = 135; // sticky header + tabs height
      const targetPos = targetElem.getBoundingClientRect().top + window.pageYOffset - navOffset;
      smoothScrollTo(Math.max(0, targetPos), 500);
    }
  };

  // Jump to next or previous class in 0.5s
  const handleJumpStep = (direction) => {
    let currentIdx = classOrder.indexOf(activeClass);
    if (currentIdx === -1) currentIdx = 0;

    let nextIdx = direction === 'next' ? currentIdx + 1 : currentIdx - 1;
    if (nextIdx < 0) nextIdx = 0;
    if (nextIdx >= classOrder.length) nextIdx = classOrder.length - 1;

    const targetKey = classOrder[nextIdx];
    handleSelectClass(targetKey);
  };

  // ScrollSpy: Detect currently visible class section and update active tab
  useEffect(() => {
    const handleScrollSpy = () => {
      if (isAutoScrollingRef.current) return;

      const navOffset = 160;
      let currentSection = 'ALL';

      for (const key of classOrder) {
        const el = document.getElementById(`class-section-${key}`);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= navOffset && rect.bottom >= navOffset) {
            currentSection = key;
            break;
          }
        }
      }

      if (window.pageYOffset < 200) {
        currentSection = 'ALL';
      }

      setActiveClass(currentSection);
    };

    window.addEventListener('scroll', handleScrollSpy, { passive: true });
    return () => window.removeEventListener('scroll', handleScrollSpy);
  }, []);

  return (
    <div className="results-page-wrapper">
      {/* Top Banner (Cosmic Purple & Gold) */}
      <div style={{ background: 'var(--grad-cosmic)', color: '#FFFFFF', padding: '4.5rem 0 2.5rem 0', position: 'relative', overflow: 'hidden' }} id="results-top-anchor">
        <div className="cosmic-starlight-overlay" aria-hidden="true" />
        <div className="aleem-cosmic-glow1 animate-pulse-glow" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
          <ScrollReveal direction="up" duration={0.6}>
            <div className="aleem-cosmic-badge" style={{ margin: '0 auto 1rem auto' }}>
              <Trophy size={16} />
              <span>🏆 निकालाची फॅक्टरी (MERIT & SUCCESS ROLL)</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.8rem' }}>
              Weekly Test Toppers & <span style={{ background: 'linear-gradient(90deg, #F97316, #FBBF24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Results</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '720px', margin: '0 auto' }}>
              We celebrate our students' consistent hard work. Official 1st & 2nd rank merit list from weekly assessments across all classes.
            </p>
          </ScrollReveal>
        </div>
      </div>

      {/* Sticky Class Filter Navigation */}
      <nav className="results-sticky-nav" aria-label="Class sections navigation">
        <div className="container">
          <div className="results-sticky-tabs">
            {classes.map((cls) => (
              <button
                key={cls.key}
                type="button"
                onClick={() => handleSelectClass(cls.key)}
                className={`results-class-pill ${activeClass === cls.key ? 'active' : ''}`}
              >
                {cls.key === 'ALL' && <Award size={13} style={{ display: 'inline' }} />}
                <span>{cls.label}</span>
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* Vertical Class-by-Class Sections: 10th, then 9th, and continue */}
      <section className="section section-black" style={{ background: '#080808', paddingTop: '1.5rem', minHeight: '400px' }}>
        <div className="container">
          {loading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4rem 1rem', color: '#94a3b8' }}>
              <Loader2 size={36} style={{ color: 'var(--color-bright-gold)', marginBottom: '1rem', animation: 'spin 1s linear infinite' }} />
              <p style={{ fontSize: '1rem', fontWeight: 600 }}>Loading official test results from database...</p>
            </div>
          ) : (
            classOrder.map((clsKey) => {
              const classTests = testsByClass[clsKey] || [];
              const is10th = clsKey === '10th';

              return (
                <ScrollReveal
                  key={clsKey}
                  direction="up"
                  threshold={0.06}
                  duration={0.5}
                >
                  <div
                    id={`class-section-${clsKey}`}
                    className="class-vertical-section"
                  >
                    {/* Class Group Header */}
                    <div className="class-group-header">
                      <div>
                        <h2 className="class-group-title">
                          <Sparkles size={20} style={{ color: 'var(--color-metallic-gold)' }} />
                          {clsKey === 'Navodaya' ? 'Navodaya Entrance' : `${clsKey} Standard`}
                        </h2>
                        <p className="class-group-subtitle">
                          Latest Weekly Assessment • 1st & 2nd Rank Merit Roll
                        </p>
                      </div>
                      <div className="class-group-pill">
                        {classTests.length > 0 ? (
                          'Latest Test Result'
                        ) : (
                          'Under Evaluation'
                        )}
                      </div>
                    </div>

                    {/* Test Cards showing strictly 1st and 2nd rankers of latest test */}
                    {classTests.length > 0 ? (
                      <ResultCard key={classTests[0].id} result={classTests[0]} />
                    ) : (
                      <div className="class-upcoming-notice">
                        <Clock size={24} style={{ color: 'var(--color-metallic-gold)', opacity: 0.8 }} />
                        <span style={{ fontWeight: 600, color: '#f1f5f9' }}>
                          {clsKey === 'Navodaya' ? 'Navodaya' : `${clsKey} Standard`} Test Results Under Evaluation
                        </span>
                        <span style={{ fontSize: '0.84rem', color: '#94a3b8' }}>
                          Evaluations will appear here immediately once teacher scoring is published.
                        </span>
                      </div>
                    )}
                  </div>
                </ScrollReveal>
              );
            })
          )}
        </div>
      </section>

      {/* Floating Vertical Class Jumper (Right Side Controls: 0.5s vertical scroll) */}
      <aside className="results-floating-jumper" aria-label="Quick class navigation">
        <button
          type="button"
          className="jumper-btn"
          onClick={() => handleJumpStep('prev')}
          aria-label="Previous Class (0.5s scroll)"
          title="Previous Class (0.5s vertical scroll)"
          disabled={activeClass === classOrder[0]}
        >
          <ChevronUp size={18} strokeWidth={2.5} />
        </button>

        <span className="jumper-current-label">
          {activeClass === 'ALL' ? 'ALL' : activeClass}
        </span>

        <button
          type="button"
          className="jumper-btn"
          onClick={() => handleJumpStep('next')}
          aria-label="Next Class (0.5s scroll)"
          title="Next Class (0.5s vertical scroll)"
          disabled={activeClass === classOrder[classOrder.length - 1]}
        >
          <ChevronDown size={18} strokeWidth={2.5} />
        </button>
      </aside>

      {/* Final CTA */}
      <CTASection />
    </div>
  );
};

export default ResultsPage;
