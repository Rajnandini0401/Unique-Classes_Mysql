import React, { useEffect, useRef, useState } from 'react';
import { Award, CheckCircle2, TrendingUp, BarChart3 } from 'lucide-react';

/**
 * OMRScorePreview
 * Canvas & UI simulation of real-time OMR test evaluation,
 * circular test score gauge, and subject performance bars.
 */
const OMRScorePreview = () => {
  const canvasRef = useRef(null);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    let animId;
    let t = 0;

    const clamp = (v, min = 0, max = 1) => Math.min(max, Math.max(min, v));
    const pr = (val, a, b) => clamp((val - a) / (b - a));
    const ease = (x) => 1 - Math.pow(1 - x, 3);

    const rr = (c, x, y, w, h, r) => {
      r = Math.min(r, w / 2, h / 2);
      c.beginPath();
      c.moveTo(x + r, y);
      c.arcTo(x + w, y, x + w, y + h, r);
      c.arcTo(x + w, y + h, x, y + h, r);
      c.arcTo(x, y + h, x, y, r);
      c.arcTo(x, y, x + w, y, r);
      c.closePath();
    };

    const render = () => {
      t = (t + 0.02) % 12; // 12 second loop
      const w = 680;
      const h = 480;

      ctx.clearRect(0, 0, w, h);

      // Card Background
      const bgGrad = ctx.createLinearGradient(0, 0, w, h);
      bgGrad.addColorStop(0, '#10241F');
      bgGrad.addColorStop(1, '#081412');
      ctx.fillStyle = bgGrad;
      rr(ctx, 0, 0, w, h, 20);
      ctx.fill();
      ctx.strokeStyle = 'rgba(212, 175, 55, 0.25)';
      ctx.lineWidth = 1.5;
      ctx.stroke();

      // Left: OMR Sheet Simulation
      rr(ctx, 30, 30, 260, 420, 14);
      ctx.fillStyle = 'rgba(237, 240, 230, 0.04)';
      ctx.fill();
      ctx.strokeStyle = 'rgba(237, 240, 230, 0.15)';
      ctx.lineWidth = 1;
      ctx.stroke();

      // OMR Header
      ctx.fillStyle = 'rgba(237, 240, 230, 0.7)';
      ctx.font = "600 13px 'DM Mono', monospace";
      ctx.textAlign = 'center';
      ['A', 'B', 'C', 'D'].forEach((col, i) => {
        ctx.fillText(col, 115 + i * 42, 65);
      });

      // OMR Rows
      for (let r = 0; r < 7; r++) {
        const ft = 0.6 + r * 0.9;
        const correctCol = (r * 2 + 1) % 4;
        const y = 105 + r * 46;

        ctx.fillStyle = 'rgba(237, 240, 230, 0.5)';
        ctx.textAlign = 'right';
        ctx.fillText(String(r + 1), 75, y + 5);

        for (let k = 0; k < 4; k++) {
          const x = 115 + k * 42;
          ctx.strokeStyle = 'rgba(237, 240, 230, 0.3)';
          ctx.lineWidth = 1.5;
          ctx.beginPath();
          ctx.arc(x, y, 11, 0, Math.PI * 2);
          ctx.stroke();

          if (k === correctCol) {
            const p = ease(pr(t, ft, ft + 0.45));
            if (p > 0) {
              ctx.fillStyle = '#F4C542';
              ctx.beginPath();
              ctx.arc(x, y, 11 * p, 0, Math.PI * 2);
              ctx.fill();
            }
          }
        }
      }

      // Right: Circular Progress Meter
      const cxr = 490;
      const cyr = 160;
      const progressPercent = 0.94 * ease(pr(t, 2, 8));
      setAnimatedScore(Math.round(progressPercent * 100));

      // Gray Track
      ctx.lineWidth = 14;
      ctx.lineCap = 'round';
      ctx.strokeStyle = 'rgba(237, 240, 230, 0.1)';
      ctx.beginPath();
      ctx.arc(cxr, cyr, 85, 0, Math.PI * 2);
      ctx.stroke();

      // Gold Animated Arc
      ctx.strokeStyle = '#D4AF37';
      ctx.beginPath();
      ctx.arc(cxr, cyr, 85, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * progressPercent);
      ctx.stroke();

      // Score Text inside Gauge
      ctx.fillStyle = '#EDF0E6';
      ctx.font = "800 52px 'Outfit', sans-serif";
      ctx.textAlign = 'center';
      ctx.textBaseline = 'alphabetic';
      ctx.fillText(`${Math.round(progressPercent * 100)}%`, cxr, cyr + 18);

      ctx.fillStyle = '#F4C542';
      ctx.font = "700 12px 'DM Mono', monospace";
      ctx.fillText('TOP SCORE (1st RANK)', cxr, cyr + 44);

      // Subject Performance Bars
      const subjects = [
        { name: 'Mathematics', score: 0.98, color: '#F4C542' },
        { name: 'Science / Physics', score: 0.95, color: '#5CC8FF' },
        { name: 'English / Reasoning', score: 0.91, color: '#7BE0B0' }
      ];

      subjects.forEach((sub, i) => {
        const y = 310 + i * 44;
        ctx.textAlign = 'left';
        ctx.fillStyle = 'rgba(237, 240, 230, 0.8)';
        ctx.font = "600 13px 'Plus Jakarta Sans', sans-serif";
        ctx.fillText(sub.name, 340, y);

        ctx.textAlign = 'right';
        ctx.fillStyle = sub.color;
        ctx.font = "700 13px 'DM Mono', monospace";
        ctx.fillText(`${Math.round(sub.score * 100)}%`, 630, y);

        // Bar Track
        rr(ctx, 340, y + 8, 290, 8, 4);
        ctx.fillStyle = 'rgba(237, 240, 230, 0.08)';
        ctx.fill();

        // Bar Fill
        const bw = 290 * sub.score * ease(pr(t, 4 + i * 0.6, 7 + i * 0.6));
        if (bw > 2) {
          rr(ctx, 340, y + 8, bw, 8, 4);
          ctx.fillStyle = sub.color;
          ctx.fill();
        }
      });

      animId = requestAnimationFrame(render);
    };

    animId = requestAnimationFrame(render);

    return () => cancelAnimationFrame(animId);
  }, []);

  return (
    <div
      style={{
        position: 'relative',
        width: '100%',
        maxWidth: '680px',
        margin: '0 auto',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6)'
      }}
    >
      <canvas
        ref={canvasRef}
        width={680}
        height={480}
        style={{
          display: 'block',
          width: '100%',
          height: 'auto'
        }}
      />
    </div>
  );
};

export default OMRScorePreview;
