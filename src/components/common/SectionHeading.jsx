import React from 'react';

const SectionHeading = ({ subtitle, title, description, dark = false }) => {
  return (
    <div className={`section-heading ${dark ? 'section-dark' : ''}`}>
      {subtitle && <span className="section-subtitle">{subtitle}</span>}
      {title && <h2 className="section-title">{title}</h2>}
      {description && <p className="section-desc">{description}</p>}
    </div>
  );
};

export default SectionHeading;
