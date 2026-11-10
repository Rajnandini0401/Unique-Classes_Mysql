import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  Clock,
  Calendar,
  Languages,
  PhoneCall,
  ArrowRight,
  Flame,
  Radio,
  FileText,
  HelpCircle,
  ShieldAlert
} from 'lucide-react';

const TopOnePercentCard = () => {
  const marathiMediumUrl = "https://vflsm.courses.store/914819";
  const semiEnglishUrl = "https://vflsm.courses.store/914812";

  const features = [
    { text: "10th Board Blueprint", icon: FileText },
    { text: "Customized Formula Sheet", icon: FileText },
    { text: "रोज 1 तास Live Class", icon: Radio, highlight: true },
    { text: "Doubt Session", icon: HelpCircle },
    { text: "Marking Scheme Secrets", icon: Sparkles }
  ];

  return (
    <div
      className="top-1percent-card"
      style={{
        position: 'relative',
        background: 'linear-gradient(145deg, #13151F 0%, #0B0D14 60%, #07080D 100%)',
        border: '1.5px solid rgba(212, 175, 55, 0.45)',
        borderRadius: '1.75rem',
        padding: 'clamp(1.15rem, 3.5vw, 2.75rem)',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.75), 0 0 35px rgba(212, 175, 55, 0.16)',
        marginBottom: '3.5rem',
        overflow: 'hidden'
      }}
    >
      {/* Decorative Gold Radial Glow */}
      <div
        style={{
          position: 'absolute',
          top: '-80px',
          right: '-80px',
          width: '280px',
          height: '280px',
          background: 'radial-gradient(circle, rgba(212, 175, 55, 0.18) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />
      <div
        style={{
          position: 'absolute',
          bottom: '-60px',
          left: '-60px',
          width: '240px',
          height: '240px',
          background: 'radial-gradient(circle, rgba(245, 158, 11, 0.12) 0%, transparent 70%)',
          pointerEvents: 'none'
        }}
      />

      {/* TOP HEADER: Badge & Live Indicator */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'linear-gradient(90deg, rgba(212, 175, 55, 0.22) 0%, rgba(212, 175, 55, 0.08) 100%)',
            border: '1px solid #F4C542',
            padding: '0.4rem 1.1rem',
            borderRadius: '9999px',
            color: '#FCF6BA',
            fontSize: '0.82rem',
            fontWeight: 850,
            letterSpacing: '0.04em',
            boxShadow: '0 2px 10px rgba(212, 175, 55, 0.25)'
          }}
        >
          <Flame size={15} color="#F4C542" />
          <span>EXCLUSIVE FEATURED CRASH COURSE</span>
        </div>

        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.45rem',
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            padding: '0.35rem 0.9rem',
            borderRadius: '9999px',
            color: '#FCA5A5',
            fontSize: '0.78rem',
            fontWeight: 800
          }}
        >
          <span
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '50%',
              background: '#EF4444',
              boxShadow: '0 0 8px #EF4444',
              display: 'inline-block'
            }}
          />
          <span>रोज 1 तास Live Class</span>
        </div>
      </div>

      {/* HERO ROW: Course Title + Pricing Block */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '1.5rem',
          marginBottom: '1.5rem',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div style={{ flex: '1 1 340px' }}>
          <h3
            style={{
              fontSize: 'clamp(2.1rem, 4.2vw, 3.2rem)',
              fontWeight: 950,
              color: '#F4C542',
              letterSpacing: '-0.02em',
              lineHeight: 1.15,
              marginBottom: '0.4rem',
              textShadow: '0 2px 14px rgba(212, 175, 55, 0.35)'
            }}
          >
            TOP 1% CLUB
          </h3>
          <p
            style={{
              fontSize: 'clamp(1.15rem, 2.2vw, 1.45rem)',
              fontWeight: 800,
              color: '#FFFFFF',
              marginBottom: '0.6rem'
            }}
          >
            10वी Maths Crash Course | Maharashtra Board
          </p>
          <p
            style={{
              fontSize: '0.98rem',
              fontStyle: 'italic',
              color: '#E6C76A',
              fontWeight: 600,
              margin: 0
            }}
          >
            “You don't have to struggle alone. Join Top 1% Club!”
          </p>
        </div>

        {/* Pricing Block */}
        <div
          style={{
            background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.16) 0%, rgba(20, 22, 30, 0.8) 100%)',
            border: '1.5px solid rgba(212, 175, 55, 0.5)',
            borderRadius: '1.25rem',
            padding: '1rem 1.6rem',
            textAlign: 'center',
            minWidth: '180px',
            boxShadow: '0 6px 20px rgba(0, 0, 0, 0.5)'
          }}
        >
          <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#CBD5E1', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.2rem' }}>
            विशेष फी
          </div>
          <div style={{ fontSize: 'clamp(2.4rem, 4vw, 3rem)', fontWeight: 950, color: '#F4C542', lineHeight: 1 }}>
            ₹999
          </div>
          <div style={{ fontSize: '0.82rem', fontWeight: 700, color: '#FCF6BA', marginTop: '0.35rem' }}>
            कालावधी: 90 दिवस
          </div>
        </div>
      </div>

      {/* QUICK INFO TILES: सुरुवात, कालावधी, भाषा */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(140px, 100%), 1fr))',
          gap: '0.85rem',
          marginBottom: '1.6rem',
          position: 'relative',
          zIndex: 2
        }}
      >
        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(212, 175, 55, 0.22)',
            borderRadius: '0.9rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem'
          }}
        >
          <Calendar size={20} color="#F4C542" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              सुरुवात
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 850, color: '#FFFFFF' }}>
              15 नोव्हेंबर
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(212, 175, 55, 0.22)',
            borderRadius: '0.9rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem'
          }}
        >
          <Clock size={20} color="#F4C542" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              कालावधी
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 850, color: '#FFFFFF' }}>
              90 दिवस
            </div>
          </div>
        </div>

        <div
          style={{
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(212, 175, 55, 0.22)',
            borderRadius: '0.9rem',
            padding: '0.75rem 1rem',
            display: 'flex',
            alignItems: 'center',
            gap: '0.7rem'
          }}
        >
          <Languages size={20} color="#F4C542" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontSize: '0.72rem', color: '#94A3B8', fontWeight: 700, textTransform: 'uppercase' }}>
              भाषा
            </div>
            <div style={{ fontSize: '0.95rem', fontWeight: 850, color: '#FFFFFF' }}>
              मराठी + English
            </div>
          </div>
        </div>
      </div>

      {/* COURSE HIGHLIGHTS CHIPS */}
      <div style={{ marginBottom: '1.6rem', position: 'relative', zIndex: 2 }}>
        <div style={{ fontSize: '0.78rem', fontWeight: 800, color: '#9FB0A6', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '0.65rem' }}>
          Course Highlights &amp; Inclusions:
        </div>
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '0.6rem'
          }}
        >
          {features.map((item, idx) => {
            const IconComponent = item.icon || CheckCircle2;
            return (
              <div
                key={idx}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  background: item.highlight ? 'rgba(244, 197, 66, 0.16)' : 'rgba(255, 255, 255, 0.05)',
                  border: item.highlight ? '1px solid #F4C542' : '1px solid rgba(212, 175, 55, 0.25)',
                  padding: '0.45rem 0.95rem',
                  borderRadius: '9999px',
                  fontSize: '0.88rem',
                  fontWeight: 750,
                  color: item.highlight ? '#FCF6BA' : '#E2E8F0'
                }}
              >
                <CheckCircle2 size={15} color="#F4C542" style={{ flexShrink: 0 }} />
                <span>{item.text}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* SUPPORTING MESSAGE CALLOUT */}
      <div
        style={{
          background: 'rgba(212, 175, 55, 0.09)',
          borderLeft: '4px solid #F4C542',
          borderTopRightRadius: '0.75rem',
          borderBottomRightRadius: '0.75rem',
          padding: '0.85rem 1.25rem',
          marginBottom: '1.75rem',
          position: 'relative',
          zIndex: 2
        }}
      >
        <p
          style={{
            margin: 0,
            fontSize: '0.96rem',
            fontWeight: 750,
            color: '#FCF6BA',
            lineHeight: 1.45
          }}
        >
          “हा normal tuition class नाही. Marks वाढवण्यासाठी ही एक संधी आहे.”
        </p>
      </div>

      {/* ADMISSION BUTTONS (DUAL BUTTONS) */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))',
          gap: '1rem',
          marginBottom: '1.4rem',
          position: 'relative',
          zIndex: 2
        }}
      >
        {/* Button 1: Marathi Medium */}
        <a
          href={marathiMediumUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="btn-card-action"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            padding: '0.95rem 1.4rem',
            borderRadius: '9999px',
            fontSize: '0.98rem',
            fontWeight: 850,
            color: '#080808 !important',
            background: 'var(--gold-btn-gradient, linear-gradient(135deg, #FCF6BA 0%, #D4AF37 40%, #AA771C 100%))',
            border: '1px solid #FCF6BA',
            textDecoration: 'none',
            textAlign: 'center',
            boxShadow: '0 6px 20px rgba(212, 175, 55, 0.4)',
            transition: 'all 0.25s ease'
          }}
        >
          <span>मराठी माध्यमासाठी Join करा</span>
          <ArrowRight size={17} style={{ flexShrink: 0 }} />
        </a>

        {/* Button 2: Semi-English / English Medium */}
        <a
          href={semiEnglishUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.55rem',
            padding: '0.95rem 1.4rem',
            borderRadius: '9999px',
            fontSize: '0.98rem',
            fontWeight: 850,
            color: '#080808',
            background: 'linear-gradient(135deg, #FDE68A 0%, #F59E0B 50%, #D97706 100%)',
            border: '1px solid #FEF3C7',
            textDecoration: 'none',
            textAlign: 'center',
            boxShadow: '0 6px 20px rgba(245, 158, 11, 0.35)',
            transition: 'all 0.25s ease'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 8px 24px rgba(245, 158, 11, 0.55)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(245, 158, 11, 0.35)';
          }}
        >
          <span>Semi-English / English Medium साठी Join करा</span>
          <ArrowRight size={17} style={{ flexShrink: 0 }} />
        </a>
      </div>

      {/* CONTACT & HELP FOOTER */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.6rem',
          flexWrap: 'wrap',
          fontSize: '0.92rem',
          fontWeight: 750,
          color: '#CBD5E1',
          paddingTop: '0.85rem',
          borderTop: '1px solid rgba(212, 175, 55, 0.18)',
          position: 'relative',
          zIndex: 2
        }}
      >
        <PhoneCall size={16} color="#F4C542" />
        <span>Contact:</span>
        <a
          href="tel:8308433436"
          style={{ color: '#F4C542', textDecoration: 'none', fontWeight: 800 }}
        >
          8308433436
        </a>
        <span style={{ color: 'rgba(212, 175, 55, 0.5)' }}>/</span>
        <a
          href="tel:8308433435"
          style={{ color: '#F4C542', textDecoration: 'none', fontWeight: 800 }}
        >
          8308433435
        </a>
      </div>
    </div>
  );
};

export default TopOnePercentCard;
