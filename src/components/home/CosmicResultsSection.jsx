import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { Trophy, Sparkles, ArrowRight, Loader2, Award, Star } from 'lucide-react';
import { getPublicTestToppersAPI } from '../../services/api';
import PodiumResultCard from '../cards/PodiumResultCard';
import OMRScorePreview from '../results/OMRScorePreview';
import { ScrollReveal } from '../common/ScrollAnimation';

const CosmicResultsSection = () => {
  const [activeCategory, setActiveCategory] = useState('10th');
  const [testResults, setTestResults] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch real database test results
  useEffect(() => {
    let isMounted = true;
    const fetchToppers = async () => {
      try {
        setLoading(true);
        const res = await getPublicTestToppersAPI();
        if (res && res.success && isMounted) {
          if (Array.isArray(res.data) && res.data.length > 0) {
            setTestResults(res.data);
          }
        }
      } catch (err) {
        console.error('Error fetching live toppers for Cosmic section:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchToppers();
    return () => { isMounted = false; };
  }, []);

  const categories = [
    { key: 'ALL', label: 'All Standards' },
    { key: '10th', label: '10th Class' },
    { key: '9th', label: '9th Class' },
    { key: '8th', label: '8th Class' },
    { key: '7th', label: '7th Class' },
    { key: '6th', label: '6th Class' },
    { key: '5th', label: '5th Class' },
    { key: 'Navodaya', label: 'Navodaya' },
  ];

  // Resolve active test to display on the 3-step podium
  const activeTest = useMemo(() => {
    // Default fallback matching user mockup if no tests found
    const defaultMockTest = {
      class: '10th Standard',
      testName: 'Unit Test No.- 15',
      testDate: '17/10/2026',
      totalMarks: 50,
      toppers: [
        { name: 'Aarav K.', percentage: '98%', marks: 49, rank: 1, school: 'Batch A', photo: '' },
        { name: 'Sneha P.', percentage: '94%', marks: 47, rank: 2, school: 'Batch B', photo: '' },
        { name: 'Riya D.', percentage: '91%', marks: 45, rank: 3, school: 'Batch A', photo: '' }
      ]
    };

    if (!testResults || testResults.length === 0) {
      return defaultMockTest;
    }

    if (activeCategory === 'ALL') {
      // Pick test with 3 toppers if available, or first test
      const testWith3 = testResults.find(t => Array.isArray(t.toppers) && t.toppers.length >= 3);
      return testWith3 || testResults[0];
    }

    const target = activeCategory.toLowerCase();
    const matched = testResults.filter((t) => {
      const classKey = (t.classKey || '').toLowerCase();
      const clsName = (t.class || '').toLowerCase();
      return classKey === target || clsName.includes(target);
    });

    if (matched.length > 0) {
      // Pick one with most toppers
      const sortedByToppers = [...matched].sort((a, b) => (b.toppers?.length || 0) - (a.toppers?.length || 0));
      return sortedByToppers[0];
    }

    return {
      ...defaultMockTest,
      class: activeCategory === 'Navodaya' ? 'Navodaya Entrance' : `${activeCategory} Standard`
    };
  }, [testResults, activeCategory]);

  return (
    <section className="aleem-cosmic-section" id="results">
      {/* Cosmic background glows & starlight */}
      <div className="cosmic-starlight-overlay" aria-hidden="true" />
      <div className="aleem-cosmic-glow1 animate-pulse-glow" aria-hidden="true" />
      <div className="aleem-cosmic-glow2 animate-pulse-glow" aria-hidden="true" />

      <div className="container" style={{ position: 'relative', zIndex: 10 }}>
        {/* Section Header */}
        <ScrollReveal direction="up" duration={0.6}>
          <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
            <div className="aleem-cosmic-badge">
              <Trophy size={16} />
              <span>🏆 निकालाची फॅक्टरी (FACTORY OF TOPPERS)</span>
            </div>

            <h2 className="aleem-cosmic-title">
              Our Results Speak —{' '}
              <span style={{
                background: 'linear-gradient(90deg, #F97316, #FBBF24)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text'
              }}>
                Weekly Test & Board Rankers
              </span>
            </h2>

            <p className="aleem-cosmic-desc">
              Weekly assessment merit list: Top rankers standing on the podium with consistent scores and concept mastery.
            </p>

            {/* Category Filter Pills */}
            <div className="aleem-filter-pills">
              {categories.map((cat) => (
                <button
                  key={cat.key}
                  type="button"
                  className={`btn-filter-pill ${activeCategory === cat.key ? 'active' : ''}`}
                  onClick={() => setActiveCategory(cat.key)}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>
        </ScrollReveal>

        {/* Content Area: Exact 3-Pillar Podium Card matching reference image */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '300px', color: '#FDE047' }}>
            <Loader2 size={36} style={{ animation: 'spin 1s linear infinite', marginBottom: '0.75rem' }} />
            <p style={{ fontSize: '0.95rem', fontWeight: 600 }}>Loading latest toppers from database...</p>
          </div>
        ) : (
          <ScrollReveal direction="scale" delay={0.1} glow={true} style={{ marginBottom: '3rem' }}>
            <PodiumResultCard result={activeTest} />
          </ScrollReveal>
        )}

        {/* Real-time OMR Test Evaluation & Score Gauge Simulator */}
        <ScrollReveal direction="up" delay={0.15} style={{ marginBottom: '3.5rem' }}>
          <div>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <span
                style={{
                  fontFamily: "'DM Mono', monospace",
                  fontSize: '0.78rem',
                  color: '#FDE047',
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  display: 'inline-block',
                  marginBottom: '0.3rem'
                }}
              >
                ● डिजिटल OMR मूल्यांकन व विषयवार विश्लेषण
              </span>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 800, color: '#FFFFFF', margin: 0 }}>
                Live Test Evaluation & Instant Progress Meter
              </h3>
            </div>
            <OMRScorePreview />
          </div>
        </ScrollReveal>

        {/* View All Results Link */}
        <div style={{ textAlign: 'center' }}>
          <Link
            to="/results"
            className="btn-fire"
            style={{ padding: '0.85rem 2.2rem', fontSize: '0.98rem' }}
          >
            <span>View All Class Toppers & Weekly Merit Lists</span>
            <ArrowRight size={17} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default CosmicResultsSection;
