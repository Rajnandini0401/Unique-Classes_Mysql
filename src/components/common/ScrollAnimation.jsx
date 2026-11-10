import React, { useRef, useEffect, useState } from 'react';
import { motion, useReducedMotion, useScroll, useTransform, useSpring, useInView } from 'framer-motion';

/**
 * ScrollReveal Component
 * Smoothly reveals content as it scrolls into viewport.
 * Fully supports reduced-motion, custom directions, gold glow, and mobile optimization.
 */
export const ScrollReveal = ({
  children,
  direction = 'up',
  delay = 0,
  duration = 0.55,
  distance = 28,
  threshold = 0.12,
  once = true,
  glow = false,
  className = '',
  style = {},
  as = 'div'
}) => {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  // Directions mapping
  const getInitialPosition = () => {
    if (shouldReduceMotion) return { opacity: 1, x: 0, y: 0, scale: 1 };
    switch (direction) {
      case 'up':
        return { opacity: 0, y: distance, x: 0, scale: 1 };
      case 'down':
        return { opacity: 0, y: -distance, x: 0, scale: 1 };
      case 'left':
        return { opacity: 0, x: -distance, y: 0, scale: 1 };
      case 'right':
        return { opacity: 0, x: distance, y: 0, scale: 1 };
      case 'scale':
        return { opacity: 0, scale: 0.94, x: 0, y: 0 };
      case 'none':
        return { opacity: 0, x: 0, y: 0, scale: 1 };
      default:
        return { opacity: 0, y: distance, x: 0, scale: 1 };
    }
  };

  const initial = getInitialPosition();

  const animateVisible = {
    opacity: 1,
    x: 0,
    y: 0,
    scale: 1,
    transition: {
      duration: shouldReduceMotion ? 0 : duration,
      delay: shouldReduceMotion ? 0 : delay,
      ease: [0.16, 1, 0.3, 1]
    }
  };

  return (
    <Component
      initial={initial}
      whileInView={animateVisible}
      viewport={{ once, amount: threshold }}
      className={`scroll-reveal-box ${glow ? 'scroll-gold-glow' : ''} ${className}`}
      style={{
        ...style,
        willChange: shouldReduceMotion ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </Component>
  );
};

/**
 * StaggerContainer & StaggerItem
 * Creates harmonious cascade of cards (e.g. course cards, faculty cards, dashboard previews)
 */
export const StaggerContainer = ({
  children,
  staggerDelay = 0.08,
  delayChildren = 0.05,
  threshold = 0.1,
  once = true,
  className = '',
  style = {},
  as = 'div'
}) => {
  const shouldReduceMotion = useReducedMotion();
  const Component = motion[as] || motion.div;

  const containerVariants = {
    hidden: { opacity: shouldReduceMotion ? 1 : 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: shouldReduceMotion ? 0 : staggerDelay,
        delayChildren: shouldReduceMotion ? 0 : delayChildren
      }
    }
  };

  return (
    <Component
      variants={containerVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once, amount: threshold }}
      className={className}
      style={{
        ...style,
        willChange: shouldReduceMotion ? 'auto' : 'opacity'
      }}
    >
      {children}
    </Component>
  );
};

export const StaggerItem = ({
  children,
  direction = 'up',
  distance = 24,
  duration = 0.5,
  className = '',
  style = {},
  glow = false
}) => {
  const shouldReduceMotion = useReducedMotion();

  const itemVariants = {
    hidden: shouldReduceMotion
      ? { opacity: 1, y: 0, x: 0, scale: 1 }
      : {
          opacity: 0,
          y: direction === 'up' ? distance : direction === 'down' ? -distance : 0,
          x: direction === 'left' ? -distance : direction === 'right' ? distance : 0,
          scale: direction === 'scale' ? 0.94 : 1
        },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      scale: 1,
      transition: {
        duration: shouldReduceMotion ? 0 : duration,
        ease: [0.16, 1, 0.3, 1]
      }
    }
  };

  return (
    <motion.div
      variants={itemVariants}
      className={`${glow ? 'scroll-gold-glow' : ''} ${className}`}
      style={{
        ...style,
        height: '100%',
        willChange: shouldReduceMotion ? 'auto' : 'opacity, transform'
      }}
    >
      {children}
    </motion.div>
  );
};

/**
 * ParallaxWrapper
 * Adds subtle scroll depth to backgrounds, illustrations, or floating stickers.
 * Automatically disabled on small mobile screens (< 768px) and reduced-motion.
 */
export const ParallaxWrapper = ({
  children,
  speed = 0.15,
  className = '',
  style = {}
}) => {
  const ref = useRef(null);
  const shouldReduceMotion = useReducedMotion();
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile, { passive: true });
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start']
  });

  const rawY = useTransform(scrollYProgress, [0, 1], [-30 * speed * 4, 30 * speed * 4]);
  const smoothY = useSpring(rawY, { stiffness: 120, damping: 24, restDelta: 0.001 });

  if (shouldReduceMotion || isMobile) {
    return (
      <div ref={ref} className={className} style={style}>
        {children}
      </div>
    );
  }

  return (
    <motion.div
      ref={ref}
      style={{
        ...style,
        y: smoothY,
        willChange: 'transform'
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

/**
 * AnimatedCounter
 * Animates a numeric count-up when scrolled into view.
 * Handles strings like "10+", "82%", "₹48,500".
 */
export const AnimatedCounter = ({
  value,
  duration = 1.4,
  className = '',
  style = {}
}) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.2 });
  const shouldReduceMotion = useReducedMotion();

  const [displayVal, setDisplayVal] = useState(value);

  // Parse prefix, suffix, and numeric integer
  const strVal = String(value);
  const prefix = strVal.startsWith('₹') ? '₹' : strVal.startsWith('+') ? '+' : '';
  const suffix = strVal.endsWith('+') ? '+' : strVal.endsWith('%') ? '%' : '';
  const hasComma = strVal.includes(',');
  const numericOnly = parseInt(strVal.replace(/[^0-9]/g, ''), 10);

  useEffect(() => {
    if (isNaN(numericOnly) || numericOnly === 0 || shouldReduceMotion) {
      setDisplayVal(value);
      return;
    }

    if (!isInView) return;

    let startTime = null;
    let animId = null;

    const step = (timestamp) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1);
      // Eased cubic out
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * numericOnly);

      const formatted = hasComma ? current.toLocaleString('en-IN') : current.toString();
      setDisplayVal(`${prefix}${formatted}${suffix}`);

      if (progress < 1) {
        animId = requestAnimationFrame(step);
      } else {
        const finalFormatted = hasComma ? numericOnly.toLocaleString('en-IN') : numericOnly.toString();
        setDisplayVal(`${prefix}${finalFormatted}${suffix}`);
      }
    };

    animId = requestAnimationFrame(step);

    return () => {
      if (animId) cancelAnimationFrame(animId);
    };
  }, [isInView, numericOnly, duration, shouldReduceMotion, value, hasComma, prefix, suffix]);

  return (
    <span ref={ref} className={className} style={style}>
      {displayVal}
    </span>
  );
};

export default ScrollReveal;

