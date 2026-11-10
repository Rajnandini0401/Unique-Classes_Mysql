import { useState, useEffect, useRef } from 'react';

/**
 * Custom hook to detect when an element enters the viewport.
 * Supports threshold, once trigger, and reduced motion accessibility.
 */
export const useScrollReveal = (options = {}) => {
  const {
    threshold = 0.15,
    triggerOnce = true,
    rootMargin = '0px 0px -40px 0px'
  } = options;

  const [isVisible, setIsVisible] = useState(false);
  const elementRef = useRef(null);

  useEffect(() => {
    // Respect user's reduced-motion preference
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setIsVisible(true);
      return;
    }

    const currentElem = elementRef.current;
    if (!currentElem) return;

    // Fallback for environments without IntersectionObserver
    if (!('IntersectionObserver' in window)) {
      setIsVisible(true);
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsVisible(true);
        if (triggerOnce) {
          observer.disconnect();
        }
      } else if (!triggerOnce) {
        setIsVisible(false);
      }
    }, {
      threshold,
      rootMargin,
    });

    observer.observe(currentElem);

    return () => {
      observer.disconnect();
    };
  }, [threshold, triggerOnce, rootMargin]);

  return [elementRef, isVisible];
};

/**
 * Lightweight scroll parallax hook for background blobs, floating stickers, and characters.
 * Calculates translateY offset proportional to scroll position relative to viewport center.
 */
export const useParallax = (speed = 0.15, maxOffset = 60) => {
  const ref = useRef(null);
  const [offset, setOffset] = useState(0);

  useEffect(() => {
    // Check reduced motion
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    // Disable heavy parallax transforms on touch mobile screens (< 768px) for butter-smooth 60fps scrolling
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setOffset(0);
      return;
    }

    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const el = ref.current;
          if (el) {
            const rect = el.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            // Only calculate if visible or nearby
            if (rect.top < windowHeight + 100 && rect.bottom > -100) {
              const elementCenter = rect.top + rect.height / 2;
              const viewportCenter = windowHeight / 2;
              const distanceFromCenter = elementCenter - viewportCenter;
              const rawOffset = distanceFromCenter * speed * -1;
              const clamped = Math.max(-maxOffset, Math.min(maxOffset, rawOffset));
              setOffset(Math.round(clamped));
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [speed, maxOffset]);

  return [ref, offset];
};

/**
 * Scroll progress hook for pinned storytelling sections.
 * Tracks progress (0 to 1) and active step index based on container scroll through.
 */
export const usePinnedStoryProgress = (totalSteps = 4) => {
  const containerRef = useRef(null);
  const [activeStep, setActiveStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let ticking = false;

    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const container = containerRef.current;
          if (container) {
            const rect = container.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            const containerHeight = rect.height;

            // Total scrollable distance within this container
            const startScroll = rect.top;
            const totalDistance = containerHeight - windowHeight;

            if (totalDistance > 0) {
              const currentScroll = -startScroll;
              const rawProgress = currentScroll / totalDistance;
              const clamped = Math.max(0, Math.min(1, rawProgress));
              setProgress(clamped);

              // Calculate active step
              const stepIndex = Math.min(
                totalSteps - 1,
                Math.floor(clamped * totalSteps)
              );
              setActiveStep(stepIndex);
            }
          }
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener('scroll', handleScroll);
  }, [totalSteps]);

  return { containerRef, activeStep, progress };
};

/**
 * Animated counter hook inspired by Aleem Games count-up animation.
 * Smoothly interpolates from 0 to target number with cubic easing.
 */
export const useCountUp = (targetStr, duration = 1600, shouldStart = false) => {
  const prefix = targetStr.startsWith('+') ? '+' : '';
  const suffix = targetStr.endsWith('+') ? '+' : targetStr.endsWith('%') ? '%' : '';
  const numeric = parseInt(targetStr.replace(/[^0-9]/g, ''), 10) || 0;
  const hasComma = targetStr.includes(',');

  const [currentVal, setCurrentVal] = useState(0);
  const startedRef = useRef(false);

  useEffect(() => {
    if (!shouldStart || startedRef.current || numeric === 0) return;
    startedRef.current = true;

    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setCurrentVal(numeric);
      return;
    }

    const startTime = performance.now();
    let animId;

    const animate = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCurrentVal(Math.floor(eased * numeric));

      if (progress < 1) {
        animId = requestAnimationFrame(animate);
      } else {
        setCurrentVal(numeric);
      }
    };

    animId = requestAnimationFrame(animate);

    return () => cancelAnimationFrame(animId);
  }, [shouldStart, numeric, duration]);

  const formattedNum = hasComma ? currentVal.toLocaleString('en-IN') : currentVal.toString();
  return `${prefix}${formattedNum}${suffix}`;
};

export default useScrollReveal;
