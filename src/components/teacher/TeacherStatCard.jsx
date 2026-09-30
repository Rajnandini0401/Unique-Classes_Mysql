import React from 'react';

const TeacherStatCard = ({ title, value, icon: Icon, subtitle, gradientAccent }) => {
  return (
    <div className="teacher-stat-card">
      <div className="teacher-stat-card-header">
        <span className="teacher-stat-title">{title}</span>
        {Icon && (
          <div className="teacher-stat-icon-box" style={{ background: gradientAccent }}>
            <Icon size={22} color="#080808" />
          </div>
        )}
      </div>
      <div className="teacher-stat-card-body">
        <span className="teacher-stat-value">{value}</span>
        {subtitle && <span className="teacher-stat-subtitle">{subtitle}</span>}
      </div>
    </div>
  );
};

export default TeacherStatCard;
