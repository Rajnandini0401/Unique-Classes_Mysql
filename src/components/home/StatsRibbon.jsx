import React from 'react';

const StatsRibbon = () => {
  const tickerItems = [
    { text: 'Unique Classes', icon: '✦', isBrand: true },
    { text: 'Nilanga', icon: '📍' },
    { text: 'Offline / Online Classes', icon: '💻', badge: 'Active' },
    { text: 'English', icon: '📖' },
    { text: 'Mathematics', icon: '📐' },
    { text: 'Science', icon: '🔬' },
  ];

  // Quadruple items to ensure an infinite seamless loop without gaps on all screen sizes
  const repeatedItems = [...tickerItems, ...tickerItems, ...tickerItems, ...tickerItems];

  return (
    <section className="aleem-stats-section compact-ticker-ribbon" aria-label="Unique Classes Highlights">
      <div className="ticker-fade-wrapper">
        <div className="ticker-inner-track ticker-move-left-to-right">
          {repeatedItems.map((item, idx) => (
            <div key={idx} className="ticker-pill">
              <span className="ticker-icon">{item.icon}</span>
              <span className={`ticker-text ${item.isBrand ? 'ticker-brand' : ''}`}>
                {item.text}
              </span>
              {item.badge && (
                <span className="ticker-badge">{item.badge}</span>
              )}
              <span className="ticker-bullet" aria-hidden="true">★</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsRibbon;
