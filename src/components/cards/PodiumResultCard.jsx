import React from 'react';
import { Sparkles } from 'lucide-react';
import { getPhotoUrl } from '../../utils/photoUtils';

import topperChampionImg from '../../assets/illustrations/topper_champion.jpg';
import aboutGirlImg from '../../assets/illustrations/about_girl.jpg';
import coursesBoyImg from '../../assets/illustrations/courses_boy.jpg';

/**
 * Helper to compute clean 2-letter initials for student avatar.
 */
const getInitials = (name) => {
  if (!name) return 'UC';
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
};

/**
 * Three-point Crown SVG Icon in bright golden amber, matching reference mockup.
 */
const CrownIcon = ({ size = 34, color = '#FBBF24' }) => (
  <svg
    width={size}
    height={Math.round(size * 0.72)}
    viewBox="0 0 32 23"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M3 20H29V18C29 18 25 14 23 14C21 14 20 17 16 17C12 17 11 14 9 14C7 14 3 18 3 18V20Z"
      fill={color}
    />
    <path
      d="M3 18L5 4.5L12 12.5L16 1.5L20 12.5L27 4.5L29 18H3Z"
      fill={color}
    />
    <circle cx="5" cy="3.5" r="2.2" fill={color} />
    <circle cx="16" cy="1.5" r="2.5" fill={color} />
    <circle cx="27" cy="3.5" r="2.2" fill={color} />
  </svg>
);

const PodiumResultCard = ({ result }) => {
  if (!result) return null;

  const {
    class: className = '10th Standard',
    testName = 'Unit Test No.- 15',
    testDate = '17/10/2026',
    totalMarks = 50,
    toppers = []
  } = result;

  // Filter rankers from result
  const rank1List = toppers.filter((t) => t.rank === 1);
  const rank2List = toppers.filter((t) => t.rank === 2);
  const rank3List = toppers.filter((t) => t.rank === 3);

  // If the result has NO real toppers at all (e.g. mock test for class without tests yet)
  const isDemo = toppers.length === 0;

  const rank1 = rank1List[0] || (isDemo ? {
    name: 'Aarav K.',
    percentage: '98%',
    marks: 49,
    school: 'Batch A',
    photo: topperChampionImg
  } : null);

  const rank2 = rank2List[0] || (isDemo ? {
    name: 'Sneha P.',
    percentage: '94%',
    marks: 47,
    school: 'Batch B',
    photo: aboutGirlImg
  } : null);

  const rank3 = rank3List[0] || (isDemo ? {
    name: 'Riya D.',
    percentage: '91%',
    marks: 45,
    school: 'Batch A',
    photo: coursesBoyImg
  } : null);

  // Photos
  const rank1Photo = rank1?.photo ? getPhotoUrl(rank1.photo) : topperChampionImg;
  const rank2Photo = rank2?.photo ? getPhotoUrl(rank2.photo) : aboutGirlImg;
  const rank3Photo = rank3?.photo ? getPhotoUrl(rank3.photo) : coursesBoyImg;

  return (
    <div className="podium-card-wrapper">
      {/* Card Header matching reference mockup */}
      <div className="podium-card-header">
        <span className="podium-weekly-badge">
          <Sparkles size={14} color="#FBBF24" />
          <span>WEEKLY RESULTS</span>
        </span>

        <h3 className="podium-test-title">
          {testName}
        </h3>

        <p className="podium-test-meta">
          {className} • Weekly Test • {testDate}
        </p>
      </div>

      {/* The 3-Pillar Winner Podium (Rank 2 Left, Rank 1 Center, Rank 3 Right) */}
      <div className="podium-stage">
        {/* ========================================================
            RANK 2 COLUMN (LEFT - SECOND HIGHEST)
            ======================================================== */}
        <div className={`podium-column rank-2-col ${!rank2 ? 'podium-vacant' : ''}`}>
          {rank2 ? (
            <>
              {/* Avatar Wrapper with Photo & Badge */}
              <div className="podium-avatar-wrapper">
                <div
                  className="podium-avatar-circle"
                  title={`${rank2.name} - Rank 2 (${rank2.percentage})`}
                >
                  <img
                    src={rank2Photo}
                    alt={rank2.name}
                    className="podium-avatar-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = aboutGirlImg;
                    }}
                  />
                </div>
                <span className="podium-avatar-badge-tag">
                  2nd • {getInitials(rank2.name)}
                </span>
              </div>

              {/* Student Name */}
              <h4 className="podium-student-name" title={rank2.name}>
                {rank2.name}
              </h4>

              {/* Batch / School */}
              <span className="podium-student-batch" title={rank2.school || 'Unique Classes'}>
                {rank2.school || 'Unique Classes'}
              </span>

              {/* Silver/Slate-Blue Pillar */}
              <div className="podium-pillar">
                <span className="podium-pillar-num">2</span>
                <span className="podium-pillar-pct">{rank2.percentage}</span>
              </div>
            </>
          ) : (
            <>
              {/* Vacant / Open Rank 2 */}
              <div className="podium-avatar-wrapper">
                <div
                  className="podium-avatar-circle"
                  style={{
                    borderStyle: 'dashed',
                    background: 'rgba(203, 213, 225, 0.1)',
                    color: '#94A3B8'
                  }}
                  title="2nd Rank - Open"
                >
                  <span style={{ fontSize: '1.2rem', color: '#CBD5E1' }}>—</span>
                </div>
              </div>

              <h4 className="podium-student-name" style={{ color: '#64748B' }}>
                Open
              </h4>

              <span className="podium-student-batch" style={{ color: '#475569' }}>
                Awaiting
              </span>

              <div className="podium-pillar" style={{ opacity: 0.55 }}>
                <span className="podium-pillar-num" style={{ opacity: 0.6 }}>2</span>
                <span className="podium-pillar-pct" style={{ opacity: 0.6 }}>—</span>
              </div>
            </>
          )}
        </div>

        {/* ========================================================
            RANK 1 COLUMN (CENTER - TALLEST & WITH GOLDEN CROWN)
            ======================================================== */}
        <div className={`podium-column rank-1-col ${!rank1 ? 'podium-vacant' : ''}`}>
          {/* Crown resting above Rank 1 Avatar */}
          <div className="podium-crown-icon">
            <CrownIcon size={36} color="#FBBF24" />
          </div>

          {rank1 ? (
            <>
              {/* Avatar Wrapper with Photo & Badge */}
              <div className="podium-avatar-wrapper">
                <div
                  className="podium-avatar-circle"
                  title={`${rank1.name} - Rank 1 (${rank1.percentage})`}
                >
                  <img
                    src={rank1Photo}
                    alt={rank1.name}
                    className="podium-avatar-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = topperChampionImg;
                    }}
                  />
                </div>
                <span className="podium-avatar-badge-tag">
                  1st • {getInitials(rank1.name)}
                </span>
              </div>

              {/* Student Name */}
              <h4 className="podium-student-name" title={rank1.name}>
                {rank1.name}
              </h4>

              {/* Batch / School */}
              <span className="podium-student-batch" title={rank1.school || 'Unique Classes'}>
                {rank1.school || 'Unique Classes'}
              </span>

              {/* Bright Golden Yellow Pillar */}
              <div className="podium-pillar">
                <span className="podium-pillar-num">1</span>
                <span className="podium-pillar-pct">{rank1.percentage}</span>
              </div>
            </>
          ) : (
            <>
              {/* Vacant / Open Rank 1 */}
              <div className="podium-avatar-wrapper">
                <div
                  className="podium-avatar-circle"
                  style={{
                    borderStyle: 'dashed',
                    background: 'rgba(251, 191, 36, 0.1)',
                    color: '#FBBF24'
                  }}
                  title="1st Rank - Open"
                >
                  <span style={{ fontSize: '1.2rem', color: '#FBBF24' }}>—</span>
                </div>
              </div>

              <h4 className="podium-student-name" style={{ color: '#64748B' }}>
                Open
              </h4>

              <span className="podium-student-batch" style={{ color: '#475569' }}>
                Awaiting
              </span>

              <div className="podium-pillar" style={{ opacity: 0.55 }}>
                <span className="podium-pillar-num" style={{ opacity: 0.6 }}>1</span>
                <span className="podium-pillar-pct" style={{ opacity: 0.6 }}>—</span>
              </div>
            </>
          )}
        </div>

        {/* ========================================================
            RANK 3 COLUMN (RIGHT - THIRD HIGHEST)
            ======================================================== */}
        <div className={`podium-column rank-3-col ${!rank3 ? 'podium-vacant' : ''}`}>
          {rank3 ? (
            <>
              {/* Avatar Wrapper with Photo & Badge */}
              <div className="podium-avatar-wrapper">
                <div
                  className="podium-avatar-circle"
                  title={`${rank3.name} - Rank 3 (${rank3.percentage})`}
                >
                  <img
                    src={rank3Photo}
                    alt={rank3.name}
                    className="podium-avatar-img"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = coursesBoyImg;
                    }}
                  />
                </div>
                <span className="podium-avatar-badge-tag">
                  3rd • {getInitials(rank3.name)}
                </span>
              </div>

              {/* Student Name */}
              <h4 className="podium-student-name" title={rank3.name}>
                {rank3.name}
              </h4>

              {/* Batch / School */}
              <span className="podium-student-batch" title={rank3.school || 'Unique Classes'}>
                {rank3.school || 'Unique Classes'}
              </span>

              {/* Warm Bronze / Copper Pillar */}
              <div className="podium-pillar">
                <span className="podium-pillar-num">3</span>
                <span className="podium-pillar-pct">{rank3.percentage}</span>
              </div>
            </>
          ) : (
            <>
              {/* Vacant / Open Rank 3 */}
              <div className="podium-avatar-wrapper">
                <div
                  className="podium-avatar-circle"
                  style={{
                    borderStyle: 'dashed',
                    background: 'rgba(212, 151, 106, 0.1)',
                    color: '#94A3B8'
                  }}
                  title="3rd Rank - Position Open"
                >
                  <span style={{ fontSize: '1.2rem', color: '#D4976A' }}>—</span>
                </div>
              </div>

              <h4 className="podium-student-name" style={{ color: '#64748B' }}>
                Open
              </h4>

              <span className="podium-student-batch" style={{ color: '#475569' }}>
                Awaiting
              </span>

              <div className="podium-pillar" style={{ opacity: 0.55 }}>
                <span className="podium-pillar-num" style={{ opacity: 0.6 }}>3</span>
                <span className="podium-pillar-pct" style={{ opacity: 0.6 }}>—</span>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default PodiumResultCard;
