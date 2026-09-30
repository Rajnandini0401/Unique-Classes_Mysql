import React from 'react';

const StatCard = ({ title, value, icon: Icon, iconColor = '#B8860B' }) => {
  return (
    <div className="stat-card">
      <div className="stat-card-header">
        <span className="stat-label">{title}</span>
        <div className="stat-icon-box" style={{ color: iconColor }}>
          {Icon && <Icon size={26} />}
        </div>
      </div>
      <div className="stat-value">{value}</div>
    </div>
  );
};

export default StatCard;
