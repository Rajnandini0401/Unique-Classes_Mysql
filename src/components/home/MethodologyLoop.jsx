import React, { useEffect, useState, useRef } from 'react';
import { BookOpen, Edit3, Award, RefreshCw, CheckCircle2 } from 'lucide-react';

/**
 * MethodologyLoop
 * Interactive 4-stage circular study cycle showcasing Unique Classes' teaching philosophy:
 * क्लास (Class) -> सराव (Practice) -> परीक्षा (Test) -> रिव्हिजन (Revision)
 */
const MethodologyLoop = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [dotPos, setDotPos] = useState({ x: 200, y: 60 });
  const [dashOffset, setDashOffset] = useState(1);
  const animRef = useRef(null);
  const isHoveredRef = useRef(false);

  const steps = [
    {
      id: 0,
      title: 'क्लास (Concept Class)',
      subtitle: 'संकल्पनांची स्पष्ट समज',
      desc: 'दररोज एक नवीन संकल्पना, सोप्या भाषेत, फळ्यावर प्रात्यक्षिक आणि उदाहरणांसह शिकवली जाते.',
      icon: <BookOpen size={20} />,
      color: '#F4C542',
      coords: { x: 200, y: 60 }
    },
    {
      id: 1,
      title: 'सराव (Daily Practice)',
      subtitle: 'त्याच दिवशी प्रश्न सोडवणे',
      desc: 'शिकवलेला घटक लगेच पक्का व्हावा म्हणून दररोज गृहपाठ आणि प्रत्यक्ष प्रश्न सोडवण्याचा सराव.',
      icon: <Edit3 size={20} />,
      color: '#E6C76A',
      coords: { x: 340, y: 200 }
    },
    {
      id: 2,
      title: 'परीक्षा (Weekly Tests)',
      subtitle: 'नियमित चाचण्या व प्रगती',
      desc: 'दर आठवड्याला OMR व लेखी परीक्षा. निकालांचे त्वरित विश्लेषण व पालकांना थेट एसएमएस अहवाल.',
      icon: <Award size={20} />,
      color: '#F59E0B',
      coords: { x: 200, y: 340 }
    },
    {
      id: 3,
      title: 'रिव्हिजन (Doubts & Revision)',
      subtitle: 'शंका निरसन व पुनर्उजळणी',
      desc: 'परीक्षेत चुकलेले प्रश्न पुन्हा सोडवणे, 1-on-1 शंका निरसन आणि परीक्षेपर्यंत नियमित रिव्हिजन सायकल.',
      icon: <RefreshCw size={20} />,
      color: '#D4AF37',
      coords: { x: 60, y: 200 }
    }
  ];

  useEffect(() => {
    let startTime = performance.now();
    const cycleDuration = 12000; // 12 seconds per full loop

    const tick = (now) => {
      if (!isHoveredRef.current) {
        const elapsed = (now - startTime) % cycleDuration;
        const progress = elapsed / cycleDuration;
        const angle = progress * Math.PI * 2 - Math.PI / 2;

        const x = 200 + 140 * Math.cos(angle);
        const y = 200 + 140 * Math.sin(angle);
        setDotPos({ x, y });
        setDashOffset(1 - progress);

        const currentStep = Math.round(progress * 4) % 4;
        setActiveStep(currentStep);
      }

      animRef.current = requestAnimationFrame(tick);
    };

    animRef.current = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animRef.current);
  }, []);

  const handleStepClick = (index) => {
    setActiveStep(index);
    setDotPos(steps[index].coords);
  };

  return (
    <div
      className="methodology-loop-container"
      onMouseEnter={() => { isHoveredRef.current = true; }}
      onMouseLeave={() => { isHoveredRef.current = false; }}
      style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))',
        gap: 'clamp(1.5rem, 4vw, 3.5rem)',
        alignItems: 'center',
        padding: 'clamp(1.2rem, 3.5vw, 2.5rem)',
        borderRadius: 'clamp(18px, 3vw, 28px)',
        background: 'linear-gradient(165deg, #12131A 0%, #08090C 100%)',
        border: '1px solid rgba(212, 175, 55, 0.25)',
        boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.6)'
      }}
    >
      {/* Left: Orbiting SVG Vector Loop */}
      <div style={{ position: 'relative', width: '100%', maxWidth: '380px', margin: '0 auto', aspectRatio: '1 / 1' }}>
        <svg
          viewBox="0 0 400 400"
          style={{ width: '100%', height: '100%', overflow: 'visible' }}
          role="img"
          aria-label="4-Stage Teaching Cycle: Class, Practice, Test, Revision"
        >
          {/* Static Track Ring */}
          <circle
            cx="200"
            cy="200"
            r="140"
            fill="none"
            stroke="rgba(237, 240, 230, 0.15)"
            strokeWidth="3"
            strokeDasharray="6 8"
          />

          {/* Animated Gold Arc Progress */}
          <circle
            cx="200"
            cy="200"
            r="140"
            fill="none"
            stroke="#D4AF37"
            strokeWidth="4"
            strokeLinecap="round"
            pathLength="1"
            strokeDasharray="1"
            strokeDashoffset={dashOffset}
            style={{ transition: 'stroke-dashoffset 0.1s linear' }}
          />

          {/* 4 Interactive Stage Nodes */}
          {steps.map((st, i) => {
            const isActive = activeStep === i;
            return (
              <g
                key={st.id}
                onClick={() => handleStepClick(i)}
                style={{ cursor: 'pointer', transition: 'all 0.3s' }}
              >
                {/* Node Outer Halo on Active */}
                {isActive && (
                  <circle
                    cx={st.coords.x}
                    cy={st.coords.y}
                    r="48"
                    fill="none"
                    stroke={st.color}
                    strokeWidth="1.5"
                    opacity="0.4"
                    className="animate-pulse"
                  />
                )}

                {/* Node Disc */}
                <circle
                  cx={st.coords.x}
                  cy={st.coords.y}
                  r="40"
                  fill={isActive ? '#1C1F2B' : '#0E1017'}
                  stroke={isActive ? st.color : 'rgba(237, 240, 230, 0.25)'}
                  strokeWidth={isActive ? '3' : '2'}
                />

                {/* Node Label Text */}
                <text
                  x={st.coords.x}
                  y={st.coords.y + 6}
                  textAnchor="middle"
                  fill={isActive ? st.color : 'rgba(237, 240, 230, 0.65)'}
                  fontFamily="'Outfit', sans-serif"
                  fontWeight="700"
                  fontSize="16"
                >
                  {st.title.split(' ')[0]}
                </text>
              </g>
            );
          })}

          {/* Orbiting Glow Particle */}
          <circle
            cx={dotPos.x}
            cy={dotPos.y}
            r="8"
            fill="#F4C542"
            filter="drop-shadow(0 0 8px rgba(244, 197, 66, 0.9))"
          />
        </svg>
      </div>

      {/* Right: Step Description Detail Cards */}
      <div style={{ display: 'grid', gap: '0.9rem' }}>
        <div style={{ marginBottom: '0.8rem' }}>
          <span
            style={{
              fontFamily: "'DM Mono', monospace",
              fontSize: '0.78rem',
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: '#F4C542',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              marginBottom: '0.4rem'
            }}
          >
            ● सतत फिरणारं यशाचं चक्र
          </span>
          <h3
            style={{
              fontSize: 'clamp(1.5rem, 3vw, 2rem)',
              fontWeight: 800,
              color: '#EDF0E6',
              lineHeight: 1.2
            }}
          >
            फक्त शिकवणं नव्हे, <span style={{ color: '#F4C542' }}>निकालाची हमी.</span>
          </h3>
        </div>

        {steps.map((st, idx) => {
          const isCurrent = activeStep === idx;
          return (
            <div
              key={st.id}
              onClick={() => handleStepClick(idx)}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: '1rem',
                padding: '0.9rem 1.1rem',
                borderRadius: '16px',
                background: isCurrent ? 'rgba(255, 255, 255, 0.08)' : 'rgba(255, 255, 255, 0.02)',
                border: `1px solid ${isCurrent ? st.color : 'rgba(237, 240, 230, 0.08)'}`,
                cursor: 'pointer',
                transition: 'all 0.3s ease',
                transform: isCurrent ? 'translateX(6px)' : 'none'
              }}
            >
              <div
                style={{
                  width: '38px',
                  height: '38px',
                  borderRadius: '10px',
                  background: isCurrent ? st.color : 'rgba(255, 255, 255, 0.05)',
                  color: isCurrent ? '#1B1500' : 'rgba(237, 240, 230, 0.6)',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  transition: 'all 0.25s'
                }}
              >
                {st.icon}
              </div>

              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                  <h4 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, color: isCurrent ? st.color : '#EDF0E6' }}>
                    {st.title}
                  </h4>
                  {isCurrent && <CheckCircle2 size={16} color={st.color} />}
                </div>
                <p style={{ margin: '0.3rem 0 0 0', fontSize: '0.88rem', color: isCurrent ? '#EDF0E6' : 'rgba(237, 240, 230, 0.65)', lineHeight: 1.5 }}>
                  {st.desc}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MethodologyLoop;
