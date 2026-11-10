import React from 'react';

/**
 * 3D/Playful Cartoon Educational Vector Stickers inspired by Aleem Games.
 * Lightweight, accessible, and animated with floating keyframes.
 */

// 1. Golden Star Trophy
export const StarTrophySticker = ({ size = 48, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`edu-sticker sticker-trophy ${className}`}
    style={style}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="trophyGold" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FDE047" />
        <stop offset="0.5" stopColor="#EAB308" />
        <stop offset="1" stopColor="#CA8A04" />
      </linearGradient>
      <linearGradient id="cupInner" x1="16" y1="12" x2="48" y2="36" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FEF08A" />
        <stop offset="1" stopColor="#F59E0B" />
      </linearGradient>
      <filter id="trophyGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F59E0B" floodOpacity="0.35" />
      </filter>
    </defs>
    <g filter="url(#trophyGlow)">
      {/* Base */}
      <rect x="22" y="52" width="20" height="8" rx="3" fill="#B45309" />
      <rect x="26" y="44" width="12" height="9" rx="2" fill="#D97706" />
      {/* Handles */}
      <path d="M18 18H14C11.7909 18 10 19.7909 10 22V26C10 30.4183 13.5817 34 18 34H20" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
      <path d="M46 18H50C52.2091 18 54 19.7909 54 22V26C54 30.4183 50.4183 34 46 34H44" stroke="#F59E0B" strokeWidth="4" strokeLinecap="round" />
      {/* Main Cup */}
      <path d="M16 12H48V28C48 36.8366 40.8366 44 32 44C23.1634 44 16 36.8366 16 28V12Z" fill="url(#cupInner)" stroke="#B45309" strokeWidth="2.5" />
      {/* Star on Cup */}
      <polygon points="32,18 34.5,23.5 40.5,24 36,28 37.5,34 32,30.8 26.5,34 28,28 23.5,24 29.5,23.5" fill="#FFFBEB" />
      {/* Sparkles */}
      <circle cx="48" cy="12" r="2.5" fill="#FEF08A" />
      <circle cx="14" cy="14" r="1.5" fill="#FEF08A" />
    </g>
  </svg>
);

// 2. Flying Magical Book
export const FlyingBookSticker = ({ size = 48, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`edu-sticker sticker-book ${className}`}
    style={style}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="bookCover" x1="4" y1="12" x2="60" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#8B5CF6" />
        <stop offset="1" stopColor="#6D28D9" />
      </linearGradient>
      <linearGradient id="bookPages" x1="12" y1="16" x2="52" y2="44" gradientUnits="userSpaceOnUse">
        <stop stopColor="#FFFFFF" />
        <stop offset="1" stopColor="#E2E8F0" />
      </linearGradient>
      <filter id="bookGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#8B5CF6" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#bookGlow)">
      {/* Bottom Cover */}
      <path d="M8 42C18 36 28 38 32 44C36 38 46 36 56 42V20C46 14 36 16 32 22C28 16 18 14 8 20V42Z" fill="url(#bookCover)" />
      {/* Pages Layer */}
      <path d="M10 39C19 33 28 35 32 40C36 35 45 33 54 39V17C45 11 36 13 32 18C28 13 19 11 10 17V39Z" fill="url(#bookPages)" />
      {/* Spine line */}
      <line x1="32" y1="18" x2="32" y2="40" stroke="#7C3AED" strokeWidth="2.5" strokeLinecap="round" />
      {/* Page Lines */}
      <path d="M14 24Q22 20 28 24" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M14 28Q22 24 28 28" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36 24Q42 20 50 24" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M36 28Q42 24 50 28" stroke="#94A3B8" strokeWidth="1.5" strokeLinecap="round" />
      {/* Little Star */}
      <polygon points="52,10 53,13 56,13.5 53.5,15.5 54.5,18.5 52,17 49.5,18.5 50.5,15.5 48,13.5 51,13" fill="#FBBF24" />
    </g>
  </svg>
);

// 3. Graduation Cap (Scholar)
export const GraduationCapSticker = ({ size = 48, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`edu-sticker sticker-cap ${className}`}
    style={style}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="capGrad" x1="6" y1="14" x2="58" y2="34" gradientUnits="userSpaceOnUse">
        <stop stopColor="#312E81" />
        <stop offset="1" stopColor="#1E1B4B" />
      </linearGradient>
      <filter id="capGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#312E81" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#capGlow)">
      {/* Cap Skull Base */}
      <path d="M20 28V38C20 44 26 48 32 48C38 48 44 44 44 38V28" fill="#1E1B4B" stroke="#4338CA" strokeWidth="2" />
      {/* Rhombus Top */}
      <polygon points="32,12 58,24 32,36 6,24" fill="url(#capGrad)" stroke="#6366F1" strokeWidth="2.5" />
      {/* Button on top */}
      <circle cx="32" cy="24" r="3.5" fill="#F59E0B" />
      {/* Tassel */}
      <path d="M32 24Q46 25 50 34V46" stroke="#F59E0B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
      <polygon points="50,44 47,52 53,52" fill="#F59E0B" />
    </g>
  </svg>
);

// 4. Science Lab Flask
export const ScienceFlaskSticker = ({ size = 48, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`edu-sticker sticker-flask ${className}`}
    style={style}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="flaskLiquid" x1="16" y1="36" x2="48" y2="54" gradientUnits="userSpaceOnUse">
        <stop stopColor="#06B6D4" />
        <stop offset="1" stopColor="#3B82F6" />
      </linearGradient>
      <filter id="flaskGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#06B6D4" floodOpacity="0.35" />
      </filter>
    </defs>
    <g filter="url(#flaskGlow)">
      {/* Glass Body */}
      <path d="M26 12H38V24L50 48C52 52 49 56 44 56H20C15 56 12 52 14 48L26 24V12Z" fill="#F0FDF4" stroke="#0284C7" strokeWidth="2.5" strokeLinejoin="round" />
      {/* Lip */}
      <rect x="24" y="9" width="16" height="4" rx="2" fill="#0284C7" />
      {/* Bubbling Liquid */}
      <path d="M16 48L25 30Q32 34 39 30L48 48C49.5 51 47 54 44 54H20C17 54 14.5 51 16 48Z" fill="url(#flaskLiquid)" />
      {/* Bubbles */}
      <circle cx="28" cy="42" r="3" fill="#E0F2FE" opacity="0.8" />
      <circle cx="36" cy="38" r="2" fill="#E0F2FE" opacity="0.8" />
      <circle cx="32" cy="48" r="2.5" fill="#E0F2FE" opacity="0.8" />
      {/* Floating Bubble Outside */}
      <circle cx="34" cy="6" r="2" fill="#38BDF8" />
    </g>
  </svg>
);

// 5. Math Geometry & Ruler
export const MathCompassSticker = ({ size = 48, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`edu-sticker sticker-math ${className}`}
    style={style}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="mathGrad" x1="8" y1="8" x2="56" y2="56" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F97316" />
        <stop offset="1" stopColor="#EA580C" />
      </linearGradient>
      <filter id="mathGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F97316" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#mathGlow)">
      {/* Protractor / Triangle */}
      <polygon points="12,52 52,52 32,16" fill="#FFF7ED" stroke="url(#mathGrad)" strokeWidth="3" strokeLinejoin="round" />
      <polygon points="24,46 40,46 32,32" fill="#FED7AA" stroke="#F97316" strokeWidth="1.5" />
      {/* Tick Marks on Bottom */}
      <line x1="18" y1="52" x2="18" y2="48" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
      <line x1="26" y1="52" x2="26" y2="47" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
      <line x1="32" y1="52" x2="32" y2="46" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
      <line x1="38" y1="52" x2="38" y2="47" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
      <line x1="46" y1="52" x2="46" y2="48" stroke="#EA580C" strokeWidth="2" strokeLinecap="round" />
      {/* Top Pivot */}
      <circle cx="32" cy="16" r="4" fill="#EA580C" />
    </g>
  </svg>
);

// 6. Bullseye Target (Goal/1st Rank)
export const TargetSticker = ({ size = 48, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`edu-sticker sticker-target ${className}`}
    style={style}
    aria-hidden="true"
  >
    <defs>
      <filter id="targetGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#EF4444" floodOpacity="0.3" />
      </filter>
    </defs>
    <g filter="url(#targetGlow)">
      <circle cx="32" cy="32" r="26" fill="#EF4444" />
      <circle cx="32" cy="32" r="20" fill="#FFFFFF" />
      <circle cx="32" cy="32" r="14" fill="#EF4444" />
      <circle cx="32" cy="32" r="7" fill="#FDE047" stroke="#B45309" strokeWidth="1.5" />
      {/* Arrow hitting bullseye */}
      <path d="M48 16L34 30" stroke="#1E293B" strokeWidth="3" strokeLinecap="round" />
      <polygon points="46,12 52,12 52,18" fill="#1E293B" />
      <line x1="50" y1="14" x2="56" y2="8" stroke="#1E293B" strokeWidth="2" strokeLinecap="round" />
    </g>
  </svg>
);

// 7. Twinkling 4-Point Star
export const SparkleStarSticker = ({ size = 32, color = '#FDE047', className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 32 32"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`edu-sticker sticker-sparkle ${className}`}
    style={style}
    aria-hidden="true"
  >
    <path
      d="M16 0C16 8.83656 23.1634 16 32 16C23.1634 16 16 23.1634 16 32C16 23.1634 8.83656 16 0 16C8.83656 16 16 8.83656 16 0Z"
      fill={color}
    />
  </svg>
);

// 8. Pencil Rocket Blaster
export const PencilRocketSticker = ({ size = 48, className = '', style = {} }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 64 64"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className={`edu-sticker sticker-rocket ${className}`}
    style={style}
    aria-hidden="true"
  >
    <defs>
      <linearGradient id="rocketBody" x1="16" y1="16" x2="48" y2="48" gradientUnits="userSpaceOnUse">
        <stop stopColor="#F59E0B" />
        <stop offset="1" stopColor="#D97706" />
      </linearGradient>
      <filter id="rocketGlow" x="-20%" y="-20%" width="140%" height="140%">
        <feDropShadow dx="0" dy="4" stdDeviation="4" floodColor="#F97316" floodOpacity="0.35" />
      </filter>
    </defs>
    <g filter="url(#rocketGlow)">
      {/* Rocket Fins */}
      <polygon points="18,42 10,54 24,50" fill="#EC4899" />
      <polygon points="42,18 54,10 50,24" fill="#EC4899" />
      {/* Pencil Lead / Nose Cone */}
      <polygon points="46,18 42,14 54,10" fill="#0F172A" />
      {/* Pencil Body */}
      <rect x="22" y="22" width="24" height="14" rx="2" transform="rotate(-45 34 29)" fill="url(#rocketBody)" stroke="#B45309" strokeWidth="1.5" />
      {/* Eraser */}
      <rect x="15" y="43" width="8" height="12" rx="3" transform="rotate(-45 19 49)" fill="#F43F5E" />
      {/* Thruster Flames */}
      <polygon points="12,52 4,60 14,56" fill="#F97316" />
      <polygon points="10,54 6,62 16,56" fill="#FBBF24" />
    </g>
  </svg>
);

export default {
  StarTrophySticker,
  FlyingBookSticker,
  GraduationCapSticker,
  ScienceFlaskSticker,
  MathCompassSticker,
  TargetSticker,
  SparkleStarSticker,
  PencilRocketSticker,
};
