import React from 'react';
import { Link } from 'react-router-dom';
import { Phone, Mail, MapPin, Smartphone, Youtube, Instagram, ExternalLink, Sparkles } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="aleem-footer">
      <div className="container">
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))',
          gap: '2.5rem',
          marginBottom: '3rem'
        }}>
          {/* Brand Column */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <div style={{ background: '#FFFFFF', padding: '0.4rem', borderRadius: '1rem', width: '60px', height: '60px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 15px rgba(0,0,0,0.2)' }}>
                <img src={logoImg} alt="Unique Classes Emblem" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
              </div>
              <div>
                <h3 style={{ fontSize: '1.3rem', fontWeight: 900, color: '#FFFFFF', lineHeight: 1.1 }}>
                  UNIQUE <span style={{ color: '#F4C542' }}>CLASSES</span>
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#D4AF37', fontWeight: 800, letterSpacing: '0.5px' }}>
                  NILANGA (DIST. LATUR)
                </span>
              </div>
            </div>

            <p style={{ color: 'rgba(255, 255, 255, 0.78)', fontSize: '0.9rem', lineHeight: 1.6, marginBottom: '1.5rem' }}>
              युनिक क्लासेस — हे एक प्रसिद्ध आणि निकालाची फॅक्टरी असलेले क्लासेस आहे. Dedicated to quality education, strong conceptual foundations, and top ranks in 5th–12th Standard and Navodaya entrance exams.
            </p>

            <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
              <a
                href="https://play.google.com/store/apps/details?id=co.bran.vflsm"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  textDecoration: 'none'
                }}
              >
                <Smartphone size={15} color="#D4AF37" />
                <span>Play Store App</span>
              </a>

              <a
                href="https://youtu.be/JHEVG00U08E?si=sEte_asgjkBFXGVE"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  textDecoration: 'none'
                }}
              >
                <Youtube size={15} color="#EF4444" />
                <span>YouTube</span>
              </a>

              <a
                href="https://www.instagram.com/reel/DYKBZdZtD7N/?igsh=M2QxaDE0dXJ3b2Vt"
                target="_blank"
                rel="noreferrer"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#FFFFFF',
                  padding: '0.5rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.82rem',
                  fontWeight: 700,
                  border: '1px solid rgba(212, 175, 55, 0.3)',
                  textDecoration: 'none'
                }}
              >
                <Instagram size={15} color="#E6C76A" />
                <span>Instagram</span>
              </a>
            </div>
          </div>

          {/* Quick Links Column */}
          <div>
            <h4 className="aleem-footer-title">Quick Navigation</h4>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              <li><Link to="/" className="aleem-footer-link">Home Page</Link></li>
              <li><Link to="/courses" className="aleem-footer-link">Academic Courses</Link></li>
              <li><Link to="/results" className="aleem-footer-link">Weekly Test Toppers</Link></li>
              <li><Link to="/gallery" className="aleem-footer-link">Photo Gallery</Link></li>
              <li><Link to="/faculty" className="aleem-footer-link">Expert Faculty</Link></li>
              <li><Link to="/announcements" className="aleem-footer-link">Notice Board</Link></li>
              <li><Link to="/contact" className="aleem-footer-link">Contact & Admissions</Link></li>
              <li><Link to="/login" className="aleem-footer-link" style={{ color: '#F4C542', fontWeight: 700 }}>Student Portal Login &rarr;</Link></li>
            </ul>
          </div>

          {/* Contact & Branch Location */}
          <div>
            <h4 className="aleem-footer-title">Nilanga Branch Address</h4>

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', marginBottom: '1.25rem' }}>
              <MapPin size={20} color="#D4AF37" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
              <div>
                <span style={{ color: 'rgba(255, 255, 255, 0.85)', fontSize: '0.9rem', lineHeight: 1.5 }}>
                  Unique Classes, Main Campus, Nilanga, District Latur, Maharashtra — 413521
                </span>
                <br />
                <a
                  href="https://maps.app.goo.gl/qy5ttyyGNeSXGgxY8"
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    color: '#F4C542',
                    fontSize: '0.82rem',
                    fontWeight: 750,
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.3rem',
                    marginTop: '0.4rem',
                    textDecoration: 'none'
                  }}
                >
                  View on Google Maps <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <Phone size={18} color="#D4AF37" />
              <div style={{ fontSize: '0.92rem', color: '#FFFFFF', fontWeight: 800 }}>
                <a href="tel:8308433436" style={{ color: '#F4C542', textDecoration: 'none' }}>8308433436</a>
                <span> / </span>
                <a href="tel:8308433435" style={{ color: '#F4C542', textDecoration: 'none' }}>8308433435</a>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Mail size={18} color="#D4AF37" />
              <span style={{ color: 'rgba(255, 255, 255, 0.8)', fontSize: '0.9rem' }}>
                info@theuniqueclasses.com
              </span>
            </div>
          </div>
        </div>

        {/* Footer Bottom Strip */}
        <div style={{
          borderTop: '1px solid rgba(212, 175, 55, 0.2)',
          paddingTop: '1.5rem',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem'
        }}>
          <div style={{ color: '#F4C542', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <span>⭐⭐⭐⭐⭐</span>
            <span style={{ color: 'rgba(255,255,255,0.85)', fontWeight: 600 }}>Trusted by 5,000+ Students & Parents</span>
          </div>

          <p style={{ color: 'rgba(255, 255, 255, 0.65)', fontSize: '0.85rem', margin: 0 }}>
            © {currentYear} Unique Classes, Nilanga (Latur). All rights reserved.
          </p>

          <p style={{ color: '#F4C542', fontStyle: 'italic', fontSize: '0.85rem', margin: 0, fontWeight: 700 }}>
            "विद्यया विनियोगात विकास — निकालाची फॅक्टरी"
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
