import React, { useEffect, useRef } from 'react';

/**
 * FormulaMeshCanvas
 * Interactive Canvas component rendering floating mathematical and scientific glyphs
 * with distance-based network mesh and cursor repulsion physics.
 */
const FormulaMeshCanvas = ({
  symbols = ['π', '∑', '∫', '√x', 'x²', 'H₂O', '∞', '%', 'E=mc²', 'sinθ', 'Δx', 'λ'],
  accentColor = '212, 175, 55', // Metallic Gold RGB
  maxParticles = 36,
  className = '',
  style = {}
}) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animId;
    let width = 0;
    let height = 0;
    let dpr = 1;

    const mouse = { x: -9999, y: -9999 };
    const particles = [];

    const createParticle = () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.35,
      vy: (Math.random() - 0.5) * 0.35,
      size: 13 + Math.random() * 15,
      alpha: 0.18 + Math.random() * 0.25,
      phase: Math.random() * Math.PI * 2,
      glyph: symbols[Math.floor(Math.random() * symbols.length)]
    });

    const handleResize = () => {
      const parent = canvas.parentElement || document.body;
      width = parent.clientWidth || window.innerWidth;
      height = parent.clientHeight || window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);

      canvas.width = Math.round(width * dpr);
      canvas.height = Math.round(height * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const targetCount = Math.max(14, Math.min(maxParticles, Math.floor((width * height) / 32000)));
      while (particles.length < targetCount) particles.push(createParticle());
      particles.length = targetCount;
    };

    handleResize();
    window.addEventListener('resize', handleResize);

    const handlePointerMove = (e) => {
      const rect = canvas.getBoundingClientRect();
      mouse.x = e.clientX - rect.left;
      mouse.y = e.clientY - rect.top;
    };

    const handlePointerLeave = () => {
      mouse.x = -9999;
      mouse.y = -9999;
    };

    window.addEventListener('pointermove', handlePointerMove, { passive: true });
    document.addEventListener('pointerleave', handlePointerLeave);

    let t = 0;
    const render = () => {
      t += 16;
      ctx.clearRect(0, 0, width, height);

      // Subtle dynamic radial ambient illumination
      const gx = width * (0.3 + 0.15 * Math.sin(t / 8000));
      const gy = height * (0.3 + 0.12 * Math.cos(t / 6000));
      const grad = ctx.createRadialGradient(gx, gy, 0, gx, gy, Math.max(width, height) * 0.55);
      grad.addColorStop(0, `rgba(${accentColor}, 0.05)`);
      grad.addColorStop(1, `rgba(${accentColor}, 0)`);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      ctx.textBaseline = 'middle';
      ctx.textAlign = 'center';

      // Update & Draw Glyphs
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;

        // Wrap around boundaries
        if (p.x < -30) p.x = width + 30;
        if (p.x > width + 30) p.x = -30;
        if (p.y < -30) p.y = height + 30;
        if (p.y > height + 30) p.y = -30;

        // Cursor Repulsion Physics
        const dx = p.x - mouse.x;
        const dy = p.y - mouse.y;
        const distSq = dx * dx + dy * dy;
        if (distSq < 22500 && distSq > 0) {
          const dist = Math.sqrt(distSq);
          p.x += (dx / dist) * 1.5;
          p.y += (dy / dist) * 1.5;
        }

        const currentAlpha = p.alpha * (0.7 + 0.3 * Math.sin(t / 1400 + p.phase));
        ctx.font = `600 ${p.size}px 'DM Mono', monospace, sans-serif`;
        ctx.fillStyle = `rgba(${accentColor}, ${currentAlpha})`;
        ctx.fillText(p.glyph, p.x, p.y);
      }

      // Draw Distance-Based Connecting Lines
      ctx.lineWidth = 0.8;
      for (let a = 0; a < particles.length; a++) {
        for (let b = a + 1; b < particles.length; b++) {
          const ddx = particles[a].x - particles[b].x;
          const ddy = particles[a].y - particles[b].y;
          const ddistSq = ddx * ddx + ddy * ddy;
          if (ddistSq < 18000) {
            const lineAlpha = (1 - Math.sqrt(ddistSq) / 134) * 0.15;
            ctx.strokeStyle = `rgba(${accentColor}, ${lineAlpha})`;
            ctx.beginPath();
            ctx.moveTo(particles[a].x, particles[a].y);
            ctx.lineTo(particles[b].x, particles[b].y);
            ctx.stroke();
          }
        }

        // Connect to Cursor when close
        const mx = particles[a].x - mouse.x;
        const my = particles[a].y - mouse.y;
        const mDist = Math.hypot(mx, my);
        if (mDist < 160) {
          const mAlpha = (1 - mDist / 160) * 0.35;
          ctx.strokeStyle = `rgba(${accentColor}, ${mAlpha})`;
          ctx.beginPath();
          ctx.moveTo(particles[a].x, particles[a].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.stroke();
        }
      }

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerleave', handlePointerLeave);
      cancelAnimationFrame(animId);
    };
  }, [symbols, accentColor, maxParticles]);

  return (
    <canvas
      ref={canvasRef}
      className={`formula-mesh-canvas ${className}`}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        zIndex: 0,
        ...style
      }}
      aria-hidden="true"
    />
  );
};

export default FormulaMeshCanvas;
