import React, { useEffect, useRef } from 'react';

const HeroVisual = ({ videoSrc = null }) => {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    let animationFrameId;

    const resizeCanvas = () => {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Aleem-inspired multi-colored particle nodes
    const colors = [
      'rgba(253, 224, 71, 0.8)', // Gold/Yellow
      'rgba(196, 181, 253, 0.7)', // Lavender
      'rgba(244, 114, 182, 0.7)', // Pink
      'rgba(56, 189, 248, 0.75)', // Sky/Cyan
    ];

    const particles = [];
    const particleCount = 45;

    for (let i = 0; i < particleCount; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.7,
        vy: (Math.random() - 0.5) * 0.7,
        radius: Math.random() * 2.5 + 1.2,
        color: colors[i % colors.length]
      });
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Draw particle network lines
      for (let i = 0; i < particleCount; i++) {
        const p1 = particles[i];

        // Move
        p1.x += p1.vx;
        p1.y += p1.vy;

        // Bounce boundaries
        if (p1.x < 0 || p1.x > canvas.width) p1.vx *= -1;
        if (p1.y < 0 || p1.y > canvas.height) p1.vy *= -1;

        // Draw particle dot with glow
        ctx.beginPath();
        ctx.arc(p1.x, p1.y, p1.radius, 0, Math.PI * 2);
        ctx.fillStyle = p1.color;
        ctx.fill();

        // Connect nearby particles
        for (let j = i + 1; j < particleCount; j++) {
          const p2 = particles[j];
          const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y);

          if (dist < 125) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(168, 85, 247, ${0.2 * (1 - dist / 125)})`;
            ctx.lineWidth = 0.8;
            ctx.stroke();
          }
        }
      }

      animationFrameId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <div className="hero-visual-bg">
      {videoSrc ? (
        <video
          autoPlay
          loop
          muted
          playsInline
          className="hero-visual-canvas"
          style={{ objectFit: 'cover' }}
        >
          <source src={videoSrc} type="video/mp4" />
        </video>
      ) : (
        <canvas ref={canvasRef} className="hero-visual-canvas" />
      )}
    </div>
  );
};

export default HeroVisual;
