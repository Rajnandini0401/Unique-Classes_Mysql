import React, { useRef, useState, useEffect } from 'react';
import { motion, useScroll, useSpring, useTransform, useInView, useReducedMotion } from 'framer-motion';
import { CreditCard, Smartphone, ShieldCheck, PlayCircle, CheckCircle2, ExternalLink, Sparkles } from 'lucide-react';
import '../../styles/admission-timeline.css';

const stepsData = [
  {
    stepNumber: '01',
    badge: 'Step 1',
    heading: 'Step 1: लिंक वर पेमेंट करा',
    description: 'खालील लिंक वर जा. नाव, मोबाईल नंबर टाका. OTP येईल तो टाकून पेमेंट करा.',
    icon: CreditCard,
    threshold: 0.08,
    links: [
      {
        text: '👉 मराठी माध्यम लिंक (800483)',
        url: 'https://vflsm.courses.store/800483',
        external: true
      },
      {
        text: '👉 Semi-English Medium Link (800476)',
        url: 'https://vflsm.courses.store/800476',
        external: true
      }
    ]
  },
  {
    stepNumber: '02',
    badge: 'Step 2',
    heading: 'Step 2: App download करा',
    description: 'Google Play Store वरून Unique Classes चे ऑफिशियल App download करा.',
    icon: Smartphone,
    threshold: 0.35,
    links: [
      {
        text: '📲 Play Store वरून App Download',
        url: 'https://play.google.com/store/apps/details?id=co.bran.vflsm',
        isStore: true,
        external: true
      }
    ]
  },
  {
    stepNumber: '03',
    badge: 'Step 3',
    heading: 'Step 3: Login करा',
    description: 'App open करून ज्या मोबाईल नंबरवर OTP आला होता, तो टाकून सुरक्षित Login करा.',
    icon: ShieldCheck,
    threshold: 0.65
  },
  {
    stepNumber: '04',
    badge: 'Step 4',
    heading: 'Step 4: क्लास चालू करा',
    description: 'App मध्ये स्टार्ट लर्निंग (Start Learning) वर जा. क्लास चालू करा.',
    icon: PlayCircle,
    threshold: 0.88
  }
];

const TimelineStepItem = ({ step, index, progressValue, isReducedMotion }) => {
  const stepRef = useRef(null);
  const isInView = useInView(stepRef, {
    margin: '-15% 0px -20% 0px',
    once: false
  });

  const isLeft = index % 2 === 0;
  const isActive = isReducedMotion || isInView || progressValue >= step.threshold;
  const IconComponent = step.icon;

  const cardMotionVariants = {
    hidden: isReducedMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 35 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: isReducedMotion ? 0 : 0.55,
        ease: [0.16, 1, 0.3, 1],
        delay: isReducedMotion ? 0 : index * 0.08
      }
    }
  };

  const cardContent = (
    <motion.div
      className={`admission-timeline-card ${isLeft ? 'is-left' : 'is-right'} ${isActive ? 'active' : ''}`}
      variants={cardMotionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.2 }}
    >
      <div className="card-meta-row">
        <span className="card-step-badge">{step.badge}</span>
        <div className="card-icon-pill" aria-hidden="true">
          <IconComponent size={20} />
        </div>
      </div>

      <h4 className="card-step-title">{step.heading}</h4>
      <p className="card-step-desc">{step.description}</p>

      {Array.isArray(step.links) && step.links.length > 0 && (
        <div className="card-links-container">
          {step.links.map((link, lIdx) => (
            <a
              key={lIdx}
              href={link.url}
              target="_blank"
              rel="noopener noreferrer"
              className={`card-action-btn ${link.isStore ? 'store-btn' : ''}`}
            >
              <span>{link.text}</span>
              <ExternalLink size={14} />
            </a>
          ))}
        </div>
      )}
    </motion.div>
  );

  return (
    <div
      ref={stepRef}
      className={`admission-timeline-step ${isLeft ? 'left-step' : 'right-step'}`}
    >
      {/* Column 1 on desktop: Card if left, empty if right */}
      <div className="timeline-col-card">{cardContent}</div>

      {/* Column 2: Numbered Circle Node */}
      <div className="timeline-col-node">
        <div
          className={`admission-timeline-node ${isActive ? 'active' : ''}`}
          aria-label={`Step ${step.stepNumber}`}
        >
          <span>{step.stepNumber}</span>
        </div>
      </div>

      {/* Column 3 on desktop: placeholder for alternating alignment */}
      <div className="timeline-col-empty" aria-hidden="true" />
    </div>
  );
};

const AdmissionTimeline = () => {
  const containerRef = useRef(null);
  const isReducedMotion = useReducedMotion();
  const [progressValue, setProgressValue] = useState(0);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start 75%', 'end 55%']
  });

  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 90,
    damping: 25,
    restDelta: 0.001
  });

  const progressLineHeight = useTransform(smoothProgress, [0, 1], ['0%', '100%']);

  useEffect(() => {
    if (isReducedMotion) {
      setProgressValue(1);
      return;
    }

    const unsubscribe = smoothProgress.on('change', (latest) => {
      setProgressValue(latest);
    });

    return () => unsubscribe();
  }, [smoothProgress, isReducedMotion]);

  return (
    <section className="admission-timeline-section" ref={containerRef} aria-label="Admission Procedure">
      {/* Ambient background glows */}
      <div className="admission-timeline-glow-top" aria-hidden="true" />
      <div className="admission-timeline-glow-bottom" aria-hidden="true" />

      {/* Section Header */}
      <div className="admission-timeline-header">
        <div className="admission-timeline-badge">
          <CheckCircle2 size={16} color="#F4C542" />
          <span>प्रवेश प्रक्रिया</span>
        </div>
        <h3 className="admission-timeline-title">
          प्रवेश कसा घ्यावा? <span className="gold-accent">(4 सोपे टप्पे)</span>
        </h3>
        <p className="admission-timeline-desc">
          Unique Classes ऑफिशियल ॲप व ऑनलाईन बॅचेसमध्ये प्रवेश घेण्यासाठी खालील 4 सोपे टप्पे पूर्ण करा:
        </p>
      </div>

      {/* Timeline Track with Golden Connecting Progress Line */}
      <div className="admission-timeline-track">
        {/* Static Background Guide Line */}
        <div className="admission-timeline-line-bg" aria-hidden="true" />

        {/* Dynamic Animated Golden Progress Line */}
        <motion.div
          className="admission-timeline-line-progress"
          style={{ height: isReducedMotion ? '100%' : progressLineHeight }}
          aria-hidden="true"
        />

        {/* 4 Steps */}
        {stepsData.map((step, index) => (
          <TimelineStepItem
            key={step.stepNumber}
            step={step}
            index={index}
            progressValue={progressValue}
            isReducedMotion={isReducedMotion}
          />
        ))}
      </div>
    </section>
  );
};

export default AdmissionTimeline;

