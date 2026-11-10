import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Play, Pause, RotateCcw, Sparkles, BookOpen, Atom, Laptop } from 'lucide-react';

/**
 * ChalkboardCanvas
 * Interactive educational simulator featuring procedural blackboard chalk handwriting,
 * scientific orbital simulations, and online live class previews.
 */
const ChalkboardCanvas = ({ initialScene = 'class' }) => {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const [activeScene, setActiveScene] = useState(initialScene);
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);

  const duration = 14; // 14 seconds loop
  const timeRef = useRef(0);
  const isPlayingRef = useRef(true);

  // Sync ref with state
  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // Helper math & easing functions
  const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
  const pr = (t, a, b) => clamp((t - a) / (b - a));
  const ease = (x) => 1 - Math.pow(1 - x, 3);

  const rr = (ctx, x, y, w, h, r) => {
    r = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
  };

  const strokeProg = (ctx, pts, p, col, lw) => {
    if (p <= 0) return null;
    let tot = 0;
    const lens = [];
    for (let i = 1; i < pts.length; i++) {
      const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
      lens.push(l);
      tot += l;
    }
    let rem = tot * p;
    let end = pts[0];
    ctx.strokeStyle = col;
    ctx.lineWidth = lw;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    ctx.moveTo(pts[0][0], pts[0][1]);
    for (let j = 1; j < pts.length; j++) {
      const l2 = lens[j - 1];
      if (rem >= l2) {
        ctx.lineTo(pts[j][0], pts[j][1]);
        rem -= l2;
        end = pts[j];
      } else {
        const f = rem / l2;
        end = [
          pts[j - 1][0] + (pts[j][0] - pts[j - 1][0]) * f,
          pts[j - 1][1] + (pts[j][1] - pts[j - 1][1]) * f
        ];
        ctx.lineTo(end[0], end[1]);
        break;
      }
    }
    ctx.stroke();
    return end;
  };

  // Scene 1: Classroom Pythagoras Chalkboard
  const drawClassroomScene = useCallback((ctx, t) => {
    const w = 1280;
    const h = 720;
    const fontHeading = "'Outfit', 'Bricolage Grotesque', sans-serif";
    const fontBody = "'Hind', 'Plus Jakarta Sans', sans-serif";

    // Blackboard texture gradient
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#102B26');
    bgGrad.addColorStop(1, '#081714');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Chalk dust texture smudges
    ctx.fillStyle = 'rgba(255, 255, 255, 0.022)';
    for (let i = 0; i < 7; i++) {
      ctx.beginPath();
      ctx.ellipse(160 + i * 170, 200 + (i % 3) * 150, 120, 40, 0.3 * i, 0, Math.PI * 2);
      ctx.fill();
    }

    // Wooden Chalkboard Border
    ctx.strokeStyle = '#523C27';
    ctx.lineWidth = 18;
    ctx.strokeRect(9, 9, w - 18, h - 18);

    // Inner gold bevel
    ctx.strokeStyle = 'rgba(212, 175, 55, 0.35)';
    ctx.lineWidth = 2;
    ctx.strokeRect(18, 18, w - 36, h - 36);

    // Chalk tray at bottom
    ctx.fillStyle = '#3E2D1E';
    ctx.fillRect(0, 676, w, 44);
    ctx.fillStyle = '#EDF0E6';
    ctx.fillRect(150, 664, 70, 12); // white chalk piece
    ctx.fillStyle = '#D4AF37';
    ctx.fillRect(250, 666, 46, 10); // gold chalk piece

    let pen = null;

    const chalkText = (txt, x, y, size, a, b, col, isHeading = false) => {
      const p = pr(t, a, b);
      ctx.font = `600 ${size}px ${isHeading ? fontHeading : fontBody}`;
      ctx.fillStyle = col;
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
      const chars = Array.from(txt);
      const n = Math.floor(chars.length * p);
      const str = chars.slice(0, n).join('');
      ctx.fillText(str, x, y);
      if (p > 0 && p < 1) {
        pen = [x + ctx.measureText(str).width + 8, y - size * 0.32];
      }
    };

    // Text & Math strokes
    chalkText('पायथागोरस सिद्धांत (Pythagoras Theorem)', 90, 125, 54, 0.4, 2.8, '#EDF0E6');

    // Underline
    const u = pr(t, 2.8, 3.6);
    if (u > 0) {
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 4;
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(90, 148);
      ctx.lineTo(90 + 640 * ease(u), 148);
      ctx.stroke();
      if (u < 1) pen = [90 + 640 * ease(u), 148];
    }

    chalkText('a² + b² = c²', 90, 270, 92, 3.8, 6.2, '#F4C542', true);
    chalkText('3² + 4² = 5²', 90, 395, 62, 8.4, 10.2, '#EDF0E6', true);
    chalkText('9 + 16 = 25  ✓ (Proven)', 90, 485, 60, 10.4, 12.2, '#7BE0B0', true);

    // Geometry Triangle
    const A = [770, 580];
    const B = [1140, 580];
    const C_pt = [770, 280];
    const tp = pr(t, 5.2, 8.2);
    const endPt = strokeProg(ctx, [A, B, C_pt, A], tp, '#EDF0E6', 5);
    if (tp > 0 && tp < 1 && endPt) pen = endPt;

    if (t > 6.2) {
      // Right angle marker
      ctx.strokeStyle = '#D4AF37';
      ctx.lineWidth = 3;
      ctx.strokeRect(770, 540, 40, 40);
    }

    // Side labels
    const lp = pr(t, 7.2, 8.4);
    if (lp > 0) {
      ctx.save();
      ctx.globalAlpha = lp;
      ctx.fillStyle = '#F4C542';
      ctx.font = `italic 600 44px ${fontHeading}`;
      ctx.textAlign = 'center';
      ctx.fillText('a = 3', 720, 440);
      ctx.fillText('b = 4', 955, 630);
      ctx.fillText('c = 5', 995, 410);
      ctx.restore();
    }

    // Chalk Tip Particle Glow & Dust
    if (pen) {
      const gl = ctx.createRadialGradient(pen[0], pen[1], 0, pen[0], pen[1], 28);
      gl.addColorStop(0, 'rgba(255, 255, 255, 0.95)');
      gl.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = gl;
      ctx.beginPath();
      ctx.arc(pen[0], pen[1], 28, 0, Math.PI * 2);
      ctx.fill();

      // Chalk dust particles
      ctx.fillStyle = 'rgba(237, 240, 230, 0.55)';
      for (let k = 0; k < 6; k++) {
        const q = (t * 1.3 + k * 0.37) % 1;
        ctx.beginPath();
        ctx.arc(pen[0] + Math.sin(k * 2.3 + t) * 14, pen[1] + q * 44, 2.2 * (1 - q), 0, Math.PI * 2);
        ctx.fill();
      }
    }
  }, []);

  // Scene 2: Science & Entrance (Atom & DNA)
  const drawScienceScene = useCallback((ctx, t) => {
    const w = 1280;
    const h = 720;
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#0A1C26');
    grad.addColorStop(1, '#07111A');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Grid lines
    ctx.strokeStyle = 'rgba(92, 200, 255, 0.07)';
    ctx.lineWidth = 1;
    for (let x = 0; x <= w; x += 64) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 64) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // Atomic Orbits (Physics & Chemistry)
    ctx.save();
    ctx.translate(370, 350);
    for (let k = 0; k < 3; k++) {
      ctx.save();
      ctx.rotate((k * Math.PI) / 3 + t * 0.14);
      ctx.strokeStyle = 'rgba(92, 200, 255, 0.6)';
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(0, 0, 200, 72, 0, 0, Math.PI * 2);
      ctx.stroke();

      const a = t * 1.7 + k * 2.1;
      ctx.fillStyle = '#F4C542';
      ctx.beginPath();
      ctx.arc(200 * Math.cos(a), 72 * Math.sin(a), 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // Nucleus
    ctx.fillStyle = '#5CC8FF';
    ctx.beginPath();
    ctx.arc(0, 0, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#FF7A66';
    ctx.beginPath();
    ctx.arc(-6, -5, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(8, 5, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    // DNA Double Helix (Biology / NEET)
    for (let yy = 70; yy <= 640; yy += 16) {
      const ph = yy * 0.02 + t * 1.4;
      const s = Math.sin(ph);
      const x1 = 960 + 140 * s;
      const x2 = 960 - 140 * s;
      const dep = Math.cos(ph);

      ctx.strokeStyle = `rgba(237, 240, 230, ${0.12 + 0.2 * Math.abs(dep)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(x1, yy);
      ctx.lineTo(x2, yy);
      ctx.stroke();

      ctx.fillStyle = `rgba(255, 122, 102, ${0.6 + 0.4 * dep})`;
      ctx.beginPath();
      ctx.arc(x1, yy, 6 + 2 * dep, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(92, 200, 255, ${0.6 - 0.4 * dep})`;
      ctx.beginPath();
      ctx.arc(x2, yy, 6 - 2 * dep, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.fillStyle = '#EDF0E6';
    ctx.font = "600 24px 'DM Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('Physics & Chemistry (JEE)', 370, 660);
    ctx.fillText('Biology & Botany (NEET)', 960, 672);
  }, []);

  // Scene 3: Online Live Class Simulation
  const drawOnlineScene = useCallback((ctx, t) => {
    const w = 1280;
    const h = 720;
    const bgGrad = ctx.createLinearGradient(0, 0, w, h);
    bgGrad.addColorStop(0, '#10221E');
    bgGrad.addColorStop(1, '#08110F');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, w, h);

    // Laptop Frame
    rr(ctx, 190, 60, 900, 510, 24);
    ctx.fillStyle = '#0B1816';
    ctx.fill();
    ctx.strokeStyle = 'rgba(237, 240, 230, 0.7)';
    ctx.lineWidth = 4;
    ctx.stroke();

    // Laptop Base Stand
    ctx.beginPath();
    ctx.moveTo(110, 602);
    ctx.lineTo(1170, 602);
    ctx.lineTo(1100, 578);
    ctx.lineTo(180, 578);
    ctx.closePath();
    ctx.fillStyle = '#16302B';
    ctx.fill();
    ctx.strokeStyle = 'rgba(237, 240, 230, 0.45)';
    ctx.lineWidth = 3;
    ctx.stroke();

    // Live Recording Indicator
    const isLive = t % 1.2 < 0.8;
    ctx.fillStyle = isLive ? '#EF4444' : 'rgba(239, 68, 68, 0.3)';
    ctx.beginPath();
    ctx.arc(228, 98, 8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#EDF0E6';
    ctx.font = "700 18px 'DM Mono', monospace";
    ctx.textAlign = 'left';
    ctx.fillText('LIVE BATCH · UNIQUE APP', 246, 104);

    // Slide Title Bar
    rr(ctx, 228, 130, 380 * ease(pr(t, 0.4, 1.8)) + 1, 18, 9);
    ctx.fillStyle = '#FF7A66';
    ctx.fill();

    // Content Text Lines
    const lineLens = [420, 360, 440, 300, 380];
    for (let i = 0; i < 5; i++) {
      const p = ease(pr(t, 1.8 + i * 0.9, 2.8 + i * 0.9));
      if (p > 0) {
        rr(ctx, 228, 184 + i * 44, lineLens[i] * p + 1, 12, 6);
        ctx.fillStyle = 'rgba(237, 240, 230, 0.45)';
        ctx.fill();
      }
    }

    // Dynamic equation callout
    const fp = pr(t, 7, 8.2);
    if (fp > 0) {
      ctx.save();
      ctx.globalAlpha = fp;
      ctx.fillStyle = '#F4C542';
      ctx.font = "700 38px 'Outfit', sans-serif";
      ctx.fillText('x² − 5x + 6 = 0', 238, 455);
      ctx.strokeStyle = 'rgba(244, 197, 66, 0.6)';
      ctx.lineWidth = 2;
      rr(ctx, 224, 408, 380, 74, 14);
      ctx.stroke();
      ctx.restore();
    }

    // Doubts Panel Divider
    ctx.strokeStyle = 'rgba(237, 240, 230, 0.18)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(690, 92);
    ctx.lineTo(690, 540);
    ctx.stroke();

    ctx.fillStyle = 'rgba(237, 240, 230, 0.6)';
    ctx.font = "600 18px 'DM Mono', monospace";
    ctx.fillText('LIVE DOUBT CHAT', 712, 106);

    // Chat Bubbles
    const bubbles = [
      { start: 1.5, y: 132, w: 230, me: false, text: 'सर, step 2 पुन्हा समजावून सांगा' },
      { start: 3.6, y: 218, w: 270, me: true, text: 'नक्कीच! (x-2)(x-3) = 0' },
      { start: 6.0, y: 312, w: 210, me: false, text: 'म्हणजे x = 2 किंवा x = 3?' },
      { start: 8.4, y: 398, w: 260, me: true, text: 'अगदी बरोबर! ✓', check: true }
    ];

    bubbles.forEach((b) => {
      const p = ease(pr(t, b.start, b.start + 0.6));
      if (p <= 0) return;
      ctx.save();
      ctx.globalAlpha = p;
      const x = b.me ? 1056 - b.w : 712;
      const y = b.y + 20 * (1 - p);
      rr(ctx, x, y, b.w, 64, 16);
      ctx.fillStyle = b.me ? '#FF7A66' : '#1E342F';
      ctx.fill();

      // Text inside bubble
      ctx.fillStyle = b.me ? '#2A0A04' : '#EDF0E6';
      ctx.font = "500 16px 'Hind', sans-serif";
      ctx.fillText(b.text, x + 16, y + 36);
      ctx.restore();
    });

    ctx.fillStyle = '#EDF0E6';
    ctx.font = "600 22px 'DM Mono', monospace";
    ctx.textAlign = 'center';
    ctx.fillText('Daily Live Class · Instant Doubts · Recorded Lectures', 640, 660);
  }, []);

  // Main Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let lastStamp = performance.now();

    const drawFrame = (now) => {
      const dt = Math.min(0.1, (now - lastStamp) / 1000);
      lastStamp = now;

      if (isPlayingRef.current) {
        timeRef.current = (timeRef.current + dt) % duration;
        setCurrentTime(timeRef.current);
      }

      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      if (activeScene === 'class') {
        drawClassroomScene(ctx, timeRef.current);
      } else if (activeScene === 'science') {
        drawScienceScene(ctx, timeRef.current);
      } else if (activeScene === 'online') {
        drawOnlineScene(ctx, timeRef.current);
      }

      animId = requestAnimationFrame(drawFrame);
    };

    animId = requestAnimationFrame(drawFrame);

    return () => cancelAnimationFrame(animId);
  }, [activeScene, drawClassroomScene, drawScienceScene, drawOnlineScene]);

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const ratio = clamp(clickX / rect.width);
    timeRef.current = ratio * (duration - 0.01);
    setCurrentTime(timeRef.current);
  };

  const formattedSeconds = Math.floor(currentTime);

  return (
    <div
      ref={containerRef}
      className="chalkboard-simulator-wrap"
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '920px',
        margin: '0 auto',
        borderRadius: '24px',
        background: '#06100E',
        boxShadow: '0 30px 80px -20px rgba(0, 0, 0, 0.8), 0 0 0 1px rgba(212, 175, 55, 0.25)',
        overflow: 'hidden'
      }}
    >
      {/* Top Scene Selection Tabs */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0.8rem 1.2rem',
          background: 'rgba(8, 17, 15, 0.95)',
          borderBottom: '1px solid rgba(212, 175, 55, 0.2)',
          flexWrap: 'wrap',
          gap: '0.6rem'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: 'rgba(212, 175, 55, 0.15)',
              color: '#F4C542',
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              fontFamily: "'DM Mono', monospace"
            }}
          >
            <Sparkles size={13} />
            INTERACTIVE PREVIEW
          </span>
          <span style={{ color: 'rgba(237, 240, 230, 0.7)', fontSize: '0.82rem', fontWeight: 600 }}>
            {activeScene === 'class' && 'ऑफलाइन फळा (Classroom Board)'}
            {activeScene === 'science' && 'JEE · NEET सायन्स सिमुलेशन'}
            {activeScene === 'online' && 'ऑनलाइन लाइव्ह क्लास डेमो'}
          </span>
        </div>

        {/* Tab Buttons */}
        <div style={{ display: 'inline-flex', background: 'rgba(255, 255, 255, 0.06)', borderRadius: '9999px', padding: '3px' }}>
          <button
            type="button"
            onClick={() => { setActiveScene('class'); timeRef.current = 0; }}
            style={{
              border: 0,
              background: activeScene === 'class' ? '#D4AF37' : 'transparent',
              color: activeScene === 'class' ? '#1B1500' : '#EDF0E6',
              fontWeight: 700,
              fontSize: '0.78rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s'
            }}
          >
            <BookOpen size={13} /> Maths फळा
          </button>
          <button
            type="button"
            onClick={() => { setActiveScene('science'); timeRef.current = 0; }}
            style={{
              border: 0,
              background: activeScene === 'science' ? '#5CC8FF' : 'transparent',
              color: activeScene === 'science' ? '#021722' : '#EDF0E6',
              fontWeight: 700,
              fontSize: '0.78rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s'
            }}
          >
            <Atom size={13} /> Science (JEE/NEET)
          </button>
          <button
            type="button"
            onClick={() => { setActiveScene('online'); timeRef.current = 0; }}
            style={{
              border: 0,
              background: activeScene === 'online' ? '#FF7A66' : 'transparent',
              color: activeScene === 'online' ? '#2A0A04' : '#EDF0E6',
              fontWeight: 700,
              fontSize: '0.78rem',
              padding: '0.35rem 0.85rem',
              borderRadius: '9999px',
              cursor: 'pointer',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.3rem',
              transition: 'all 0.2s'
            }}
          >
            <Laptop size={13} /> Online Live
          </button>
        </div>
      </div>

      {/* Main Canvas Viewport (16:9 Aspect Ratio) */}
      <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9' }}>
        <canvas
          ref={canvasRef}
          width={1280}
          height={720}
          style={{
            display: 'block',
            width: '100%',
            height: '100%'
          }}
        />
      </div>

      {/* Bottom Timeline Controls */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.9rem',
          padding: '0.65rem 1.2rem',
          background: 'rgba(8, 17, 15, 0.95)',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)'
        }}
      >
        {/* Play / Pause Button */}
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          aria-label={isPlaying ? 'Pause' : 'Play'}
          style={{
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            border: 0,
            background: '#D4AF37',
            color: '#1B1500',
            display: 'grid',
            placeItems: 'center',
            cursor: 'pointer',
            flexShrink: 0,
            transition: 'transform 0.15s'
          }}
        >
          {isPlaying ? <Pause size={16} /> : <Play size={16} style={{ marginLeft: '2px' }} />}
        </button>

        {/* Reset button */}
        <button
          type="button"
          onClick={() => { timeRef.current = 0; setCurrentTime(0); }}
          title="Restart Preview"
          style={{
            background: 'transparent',
            border: 0,
            color: 'rgba(237, 240, 230, 0.7)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center'
          }}
        >
          <RotateCcw size={16} />
        </button>

        {/* Timeline Scrub Bar */}
        <div
          onClick={handleSeek}
          style={{
            flex: 1,
            height: '18px',
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            position: 'relative'
          }}
        >
          <div
            style={{
              width: '100%',
              height: '5px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.2)',
              position: 'relative',
              overflow: 'hidden'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                width: '100%',
                background: '#D4AF37',
                transformOrigin: 'left',
                transform: `scaleX(${currentTime / duration})`
              }}
            />
          </div>
        </div>

        {/* Timestamp */}
        <span
          style={{
            fontFamily: "'DM Mono', monospace",
            fontSize: '0.78rem',
            color: 'rgba(237, 240, 230, 0.8)',
            flexShrink: 0
          }}
        >
          0:{formattedSeconds < 10 ? `0${formattedSeconds}` : formattedSeconds} / 0:{duration}
        </span>
      </div>
    </div>
  );
};

export default ChalkboardCanvas;
