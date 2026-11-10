import React, { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Trophy, ArrowRight, Sparkles, Loader2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import TopperCard from '../cards/TopperCard';
import StudentReviewModal from '../modals/StudentReviewModal';
import { getPublicTestToppersAPI } from '../../services/api';
import '../../styles/results-showcase.css';

const ResultsShowcase = ({ isFullPage = false }) => {
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [toppers, setToppers] = useState([]);
  const [loading, setLoading] = useState(true);
  const trackRef = useRef(null);

  // Fetch real test toppers directly from MySQL database
  useEffect(() => {
    let isMounted = true;
    const fetchLiveToppers = async () => {
      try {
        setLoading(true);
        const res = await getPublicTestToppersAPI({ latestOnly: true });
        if (res && res.success && isMounted) {
          if (Array.isArray(res.studentToppers) && res.studentToppers.length > 0) {
            setToppers(res.studentToppers);
          } else if (Array.isArray(res.data) && res.data.length > 0) {
            const flattened = [];
            res.data.forEach((group) => {
              if (Array.isArray(group.toppers)) {
                group.toppers.forEach((t) => {
                  flattened.push({
                    id: `${t.id}-${group.testId}`,
                    name: t.name,
                    board: group.classKey || '10th',
                    classKey: group.classKey || '10th',
                    category: group.classKey || '10th',
                    school: t.school || 'Unique Classes Nilanga',
                    percentage: t.percentage || `${Math.round((t.marks / group.totalMarks) * 100)}%`,
                    marks: `${t.marks}/${group.totalMarks}`,
                    rank: t.badge || '1st Rank',
                    photo: t.photo || '',
                    review: `Achieved 1st rank in ${group.testName} (${group.subject || 'Assessment'}). Focused concept study and test practice helped me succeed!`,
                    subjects: [
                      { name: group.subject || 'Main Subject', score: `${t.marks}/${group.totalMarks}` }
                    ],
                    year: '2026'
                  });
                });
              }
            });
            setToppers(flattened);
          } else {
            setToppers([]);
          }
        }
      } catch (err) {
        console.error('Error fetching live toppers from MySQL:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    };

    fetchLiveToppers();
    return () => { isMounted = false; };
  }, []);

  // Filter Categories: All, 10th, 9th, 8th, 7th, 6th, 5th, 11th, 12th, Navodaya
  const categories = [
    { key: 'ALL', label: 'All' },
    { key: '10th', label: '10th' },
    { key: '9th', label: '9th' },
    { key: '8th', label: '8th' },
    { key: '7th', label: '7th' },
    { key: '6th', label: '6th' },
    { key: '5th', label: '5th' },
    { key: '11th', label: '11th' },
    { key: '12th', label: '12th' },
    { key: 'Navodaya', label: 'Navodaya' }
  ];

  // Filtered List from real database records
  const filteredToppers = useMemo(() => {
    if (activeCategory === 'ALL') return toppers;
    const target = activeCategory.toLowerCase();
    return toppers.filter((t) => {
      const classKey = (t.classKey || '').toLowerCase();
      const board = (t.board || '').toLowerCase();
      const cat = (t.category || '').toLowerCase();

      return classKey === target ||
             board === target ||
             cat === target ||
             classKey.startsWith(target) ||
             board.startsWith(target);
    });
  }, [toppers, activeCategory]);

  // Scroll carousel
  const handleScroll = (direction) => {
    if (trackRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      trackRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const handleOpenReview = (student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCloseReview = () => {
    setIsModalOpen(false);
    setSelectedStudent(null);
  };

  return (
    <section className="results-showcase-section">
      <div className="container">
        {/* Section Header */}
        <div className="results-header-wrap">
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: '#F4C542', fontWeight: 800, fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
            <Sparkles size={16} />
            <span>Merit & Success Hall</span>
          </div>
          <h2 className="results-main-title">OUR RESULTS SPEAK</h2>
          <p className="results-main-subtitle">
            Real stories from our toppers. Concept-based learning that leads to consistent success.
          </p>
        </div>

        {/* Filter Categories */}
        <div className="results-filter-bar">
          {categories.map((cat) => (
            <button
              key={cat.key}
              type="button"
              className={`results-filter-pill ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat.key)}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Content View: Loading / Empty / Dynamic List */}
        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '260px', color: '#94a3b8' }}>
            <Loader2 size={32} className="spin-animation" style={{ color: '#F4C542', marginBottom: '0.75rem', animation: 'spin 1s linear infinite' }} />
            <p style={{ fontSize: '0.92rem', fontWeight: 600 }}>Loading latest toppers from database...</p>
          </div>
        ) : filteredToppers.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3.5rem 1rem', background: '#12131A', border: '1px solid rgba(212, 175, 55, 0.2)', borderRadius: '16px', maxWidth: '600px', margin: '0 auto' }}>
            <Trophy size={40} color="#D4AF37" style={{ marginBottom: '0.8rem', opacity: 0.8 }} />
            <h4 style={{ color: '#FFFFFF', fontWeight: 750, marginBottom: '0.3rem' }}>No Toppers Recorded Yet</h4>
            <p style={{ color: '#94a3b8', fontSize: '0.88rem', margin: 0 }}>
              There are currently no published test scores for this standard in the system.
            </p>
          </div>
        ) : isFullPage ? (
          <div className="toppers-full-grid">
            {filteredToppers.map((student) => (
              <TopperCard
                key={student.id}
                student={student}
                onOpenReview={handleOpenReview}
              />
            ))}
          </div>
        ) : (
          <div className="toppers-carousel-wrapper">
            {/* Nav Buttons */}
            <button
              type="button"
              className="carousel-nav-btn prev"
              onClick={() => handleScroll('left')}
              aria-label="Previous toppers"
            >
              <ChevronLeft size={22} strokeWidth={2.5} />
            </button>

            <div className="toppers-carousel-track" ref={trackRef}>
              {filteredToppers.map((student) => (
                <TopperCard
                  key={student.id}
                  student={student}
                  onOpenReview={handleOpenReview}
                />
              ))}
            </div>

            <button
              type="button"
              className="carousel-nav-btn next"
              onClick={() => handleScroll('right')}
              aria-label="Next toppers"
            >
              <ChevronRight size={22} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {/* Optional Bottom CTA (shown on Home Page) */}
        {!isFullPage && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
            <Link
              to="/results"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'var(--gold-btn-gradient)',
                color: '#080808',
                padding: '0.8rem 1.8rem',
                borderRadius: '9999px',
                fontWeight: 850,
                fontSize: '0.92rem',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(212, 175, 55, 0.35)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-2px)';
                e.currentTarget.style.filter = 'brightness(1.08)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.filter = 'none';
              }}
            >
              <Trophy size={17} color="#080808" />
              <span>Explore All Weekly Test Ranks</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        )}
      </div>

      {/* Review Modal Dialog */}
      <StudentReviewModal
        student={selectedStudent}
        isOpen={isModalOpen}
        onClose={handleCloseReview}
      />
    </section>
  );
};

export default ResultsShowcase;
