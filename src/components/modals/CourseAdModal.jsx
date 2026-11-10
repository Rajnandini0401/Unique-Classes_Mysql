import React, { useState, useEffect } from 'react';
import {
  X,
  Flame,
  Clock,
  Calendar,
  Languages,
  ArrowRight,
  PhoneCall,
  CheckCircle2,
  BookOpen,
  Sparkles
} from 'lucide-react';
import '../../styles/course-ad-modal.css';

const CourseAdModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  const marathiMediumUrl = 'https://vflsm.courses.store/914819';
  const semiEnglishUrl = 'https://vflsm.courses.store/914812';

  // Automatically trigger popup fast when visitor arrives (~200ms snappy load)
  useEffect(() => {
    let timer = null;
    try {
      // If user reloaded the page (F5 / refresh to test), reset so ad displays promptly
      const isReload = window.performance?.getEntriesByType?.('navigation')?.[0]?.type === 'reload';
      if (isReload) {
        sessionStorage.removeItem('uc_top1_ad_shown');
      }

      const alreadyShown = sessionStorage.getItem('uc_top1_ad_shown');
      if (!alreadyShown) {
        timer = setTimeout(() => {
          setIsOpen(true);
          sessionStorage.setItem('uc_top1_ad_shown', 'true');
        }, 200);
      }
    } catch {
      // Fallback timer if sessionStorage is restricted
      timer = setTimeout(() => {
        setIsOpen(true);
      }, 200);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, []);

  // Handle body scroll lock and escape key dismissal
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        handleClose();
      }
    };

    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  // Close safely without navigating away
  const handleClose = () => {
    setIsOpen(false);
  };

  const handleOpen = () => {
    setIsOpen(true);
  };

  const features = [
    { text: 'रोज 1 तास Live Class', highlight: true },
    { text: '10th Board Blueprint', highlight: false },
    { text: 'Customized Formula Sheet', highlight: false },
    { text: 'Doubt Session & Marking Secrets', highlight: false }
  ];

  return (
    <>
      {/* 1. FIXED FLOATING "COURSES" BUTTON */}
      <button
        type="button"
        className="floating-courses-pill-btn"
        onClick={handleOpen}
        aria-label="Open TOP 1% CLUB Crash Course Advertisement"
        title="View TOP 1% CLUB 10th Maths Crash Course"
      >
        <Flame size={18} color="#F4C542" />
        <span>Courses</span>
        <span className="floating-courses-badge">TOP 1%</span>
      </button>

      {/* 2. COURSE ADVERTISEMENT POPUP DIALOG */}
      {isOpen && (
        <div
          className="course-ad-backdrop"
          onClick={handleClose}
          role="presentation"
        >
          <div className="course-ad-dialog-wrapper">
            {/* Bold Comic-Style Promotional Burst Sticker */}
            <div className="comic-burst-sticker" aria-hidden="true">
              <svg
                viewBox="0 0 120 120"
                className="comic-burst-svg"
                xmlns="http://www.w3.org/2000/svg"
              >
                <polygon
                  points="60,2 68,22 82,8 80,29 102,18 92,38 114,38 97,52 118,62 97,69 112,86 91,84 97,104 79,92 76,116 62,96 53,116 47,93 30,107 34,85 14,91 25,71 4,64 24,54 6,40 28,38 18,20 39,28 38,8 52,23"
                  className="comic-burst-polygon"
                />
              </svg>
              <div className="comic-burst-label">
                <span className="comic-burst-word-top">🔥 NEW</span>
                <span className="comic-burst-word-bottom">BATCH</span>
              </div>
            </div>

            <div
              className="course-ad-modal"
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-labelledby="course-ad-title"
            >
            {/* Ambient Background Accents */}
            <div className="course-ad-glow-top" aria-hidden="true" />
            <div className="course-ad-glow-bottom" aria-hidden="true" />

            {/* Clearly Visible Close (×) Button */}
            <button
              type="button"
              className="course-ad-close-btn"
              onClick={handleClose}
              aria-label="Close advertisement popup"
              title="Close (Esc)"
            >
              <X size={20} />
            </button>

            {/* Header: Urgency Badge & Live Status */}
            <div className="course-ad-header">
              <div className="course-ad-badge">
                <Flame size={13} color="#F4C542" />
                <span>SPECIAL BATCH 2026</span>
              </div>

              <div className="course-ad-live-pill">
                <span className="course-ad-live-dot" aria-hidden="true" />
                <span>रोज 1 तास Live Class</span>
              </div>
            </div>

            {/* Hero Row: Course Title & Pricing Box */}
            <div className="course-ad-hero-row">
              <div className="course-ad-title-block">
                <h2 id="course-ad-title" className="course-ad-main-title">
                  TOP 1% CLUB
                </h2>
                <h3 className="course-ad-sub-title">
                  10वी Maths Crash Course (SSC Board)
                </h3>
                <p className="course-ad-quote">
                  “You don't have to struggle alone. Join Top 1% Club!”
                </p>
              </div>

              {/* Price Callout */}
              <div className="course-ad-price-box">
                <div className="course-ad-price-label">विशेष फी</div>
                <div className="course-ad-price-amount">₹999</div>
                <div className="course-ad-price-duration">कालावधी: 90 दिवस</div>
              </div>
            </div>

            {/* Quick Info Tiles: सुरुवात, कालावधी, भाषा */}
            <div className="course-ad-info-tiles">
              <div className="course-ad-info-tile">
                <Calendar size={16} color="#F4C542" />
                <div>
                  <div className="course-ad-info-label">सुरुवात</div>
                  <div className="course-ad-info-val">15 नोव्हेंबर</div>
                </div>
              </div>

              <div className="course-ad-info-tile">
                <Clock size={16} color="#F4C542" />
                <div>
                  <div className="course-ad-info-label">कालावधी</div>
                  <div className="course-ad-info-val">90 दिवस</div>
                </div>
              </div>

              <div className="course-ad-info-tile">
                <Languages size={16} color="#F4C542" />
                <div>
                  <div className="course-ad-info-label">माध्यम</div>
                  <div className="course-ad-info-val">मराठी + Semi</div>
                </div>
              </div>
            </div>

            {/* Feature Inclusions */}
            <div className="course-ad-features-list">
              {features.map((feat, idx) => (
                <div
                  key={idx}
                  className={`course-ad-feature-chip ${feat.highlight ? 'highlight' : ''}`}
                >
                  <CheckCircle2 size={13} color="#F4C542" />
                  <span>{feat.text}</span>
                </div>
              ))}
            </div>

            {/* Dual Admission Action Buttons */}
            <div className="course-ad-action-buttons">
              {/* Option 1: Marathi Medium Link */}
              <a
                href={marathiMediumUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="course-ad-btn marathi-btn"
              >
                <span>👉 मराठी माध्यमासाठी Join करा (₹999)</span>
                <ArrowRight size={17} />
              </a>

              {/* Option 2: Semi-English / English Medium Link */}
              <a
                href={semiEnglishUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="course-ad-btn semi-btn"
              >
                <span>👉 Semi-English / English Medium (₹999)</span>
                <ArrowRight size={17} />
              </a>
            </div>

            {/* Footer Contact & Helpline */}
            <div className="course-ad-footer-help">
              <PhoneCall size={14} color="#F4C542" />
              <span>काही अडचण असल्यास कॉल करा:</span>
              <a href="tel:8308433436">8308433436</a>
              <span>/</span>
              <a href="tel:8308433435">8308433435</a>
            </div>
          </div>
        </div>
      </div>
      )}
    </>
  );
};

export default CourseAdModal;

