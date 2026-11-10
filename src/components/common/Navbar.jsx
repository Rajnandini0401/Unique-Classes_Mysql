import React, { useState, useEffect } from 'react';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { Menu, X, User, ChevronRight, Phone, Smartphone } from 'lucide-react';
import logoImg from '../../assets/logo.png';

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const navigate = useNavigate();

  // Prevent background scroll when mobile navigation drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
      document.documentElement.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      document.documentElement.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const navLinks = [
    { name: 'Home', path: '/' },
    { name: 'Courses', path: '/courses' },
    { name: 'Results', path: '/results' },
    { name: 'Faculty', path: '/faculty' },
    { name: 'Contact Us', path: '/contact' },
  ];

  const handleStudentLoginClick = () => {
    setMobileMenuOpen(false);
    navigate('/login');
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      {/* Top Utility Header Bar */}
      <div className="aleem-topbar">
        <div className="container flex-between" style={{ flexWrap: 'wrap', gap: '0.4rem', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'nowrap' }}>
            <span style={{
              background: 'rgba(212, 175, 55, 0.15)',
              color: '#F4C542',
              fontSize: '0.72rem',
              fontWeight: 800,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              whiteSpace: 'nowrap'
            }}>
              ✨ निकालाची फॅक्टरी
            </span>
            <span className="topbar-city-text" style={{ fontSize: '0.8rem', color: '#F8F5EC', fontWeight: 600, whiteSpace: 'nowrap' }}>
              युनिक क्लासेस, निलंगा
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
            <a
              href="tel:8308433436"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', color: '#FFFFFF', fontWeight: 700, fontSize: '0.8rem', whiteSpace: 'nowrap' }}
              aria-label="Call Unique Classes helpline"
            >
              <Phone size={13} color="#F4C542" />
              <span>8308433436</span>
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=co.bran.vflsm"
              target="_blank"
              rel="noreferrer"
              className="topbar-app-btn"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                color: '#F4C542',
                background: 'rgba(212, 175, 55, 0.15)',
                border: '1px solid rgba(212, 175, 55, 0.4)',
                padding: '0.2rem 0.65rem',
                borderRadius: '9999px',
                fontSize: '0.76rem',
                fontWeight: 700,
                whiteSpace: 'nowrap'
              }}
              aria-label="Download Unique Classes App"
            >
              <Smartphone size={13} />
              <span>App</span>
            </a>
          </div>
        </div>
      </div>

      {/* Main Sticky Navbar */}
      <header className="navbar-header aleem-navbar-wrapper">
        <div className="container navbar-container">
          {/* Brand Logo */}
          <Link to="/" className="navbar-brand" onClick={closeMobileMenu} style={{ display: 'flex', alignItems: 'center', gap: '0.55rem' }}>
            <img src={logoImg} alt="Unique Classes Emblem" className="brand-logo-img" />
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <span style={{ fontWeight: 900, fontSize: '1.15rem', color: '#FFFFFF', lineHeight: 1.1 }}>
                UNIQUE <span style={{ color: '#F4C542' }}>CLASSES</span>
              </span>
              <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#D4AF37', letterSpacing: '0.5px' }}>
                NILANGA (LATUR)
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav aria-label="Main Navigation">
            <ul className="nav-links-desktop" style={{ gap: '0.4rem' }}>
              {navLinks.map((link) => (
                <li key={link.path}>
                  <NavLink
                    to={link.path}
                    end={link.path === '/'}
                    className={({ isActive }) =>
                      `aleem-nav-link ${isActive ? 'active' : ''}`
                    }
                  >
                    {link.name}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>

          {/* Student Login Button */}
          <div className="navbar-actions" style={{ display: 'flex', alignItems: 'center', gap: '0.8rem' }}>
            <button
              onClick={handleStudentLoginClick}
              className="btn-nav-login"
              title="Student & Parent Portal Login"
            >
              <User size={16} />
              <span>Student Login</span>
            </button>
          </div>

          {/* Hamburger Menu Toggle (Mobile: 44px+ touch-friendly target) */}
          <button
            className="hamburger-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            style={{
              color: '#F4C542',
              minWidth: '44px',
              minHeight: '44px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: mobileMenuOpen ? 'rgba(212, 175, 55, 0.15)' : 'transparent',
              borderRadius: '8px',
              transition: 'background 0.2s ease'
            }}
          >
            {mobileMenuOpen ? <X size={26} /> : <Menu size={26} />}
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        <div className={`mobile-nav-drawer ${mobileMenuOpen ? 'open' : ''}`}>
          <div className="mobile-nav-links-wrapper">
            {navLinks.map((link) => (
              <NavLink
                key={link.path}
                to={link.path}
                end={link.path === '/'}
                className={({ isActive }) =>
                  `mobile-nav-link ${isActive ? 'active' : ''}`
                }
                onClick={closeMobileMenu}
              >
                <span>{link.name}</span>
                <ChevronRight size={18} color="#F4C542" />
              </NavLink>
            ))}
          </div>

          <div className="mobile-nav-bottom-actions">
            <a
              href="https://play.google.com/store/apps/details?id=co.bran.vflsm"
              target="_blank"
              rel="noreferrer"
              className="btn mobile-action-app-btn"
            >
              <Smartphone size={18} />
              <span>Download Play Store App</span>
            </a>

            <button
              onClick={handleStudentLoginClick}
              className="btn-login mobile-action-login-btn"
            >
              <User size={18} />
              <span>Student Portal Login</span>
            </button>
          </div>
        </div>
      </header>
    </>
  );
};

export default Navbar;
