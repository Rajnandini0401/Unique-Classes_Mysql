import React, { useState } from 'react';
import SectionHeading from '../components/common/SectionHeading';
import Button from '../components/common/Button';
import { ScrollReveal } from '../components/common/ScrollAnimation';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle2, ExternalLink, Smartphone, Youtube, Instagram } from 'lucide-react';

const ContactPage = () => {
  const [formData, setFormData] = useState({
    parentName: '',
    phone: '',
    studentClass: '10th',
    message: ''
  });
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
  };

  return (
    <div className="contact-page">
      {/* Header Banner */}
      <div style={{ background: 'var(--grad-hero)', color: '#FFFFFF', padding: '4.5rem 0 3.5rem 0', position: 'relative', overflow: 'hidden' }}>
        <div className="starlight-overlay" aria-hidden="true" />
        <div className="container" style={{ position: 'relative', zIndex: 5, textAlign: 'center' }}>
          <ScrollReveal direction="up" duration={0.6}>
            <div className="aleem-hero-badge" style={{ margin: '0 auto 1rem auto' }}>
              <Phone size={14} color="#F4C542" />
              <span>DIRECT ADMISSION ENQUIRY & CAMPUS VISIT</span>
            </div>
            <h1 style={{ fontSize: 'clamp(2.2rem, 4vw, 3.2rem)', fontWeight: 900, color: '#FFFFFF', marginBottom: '0.8rem' }}>
              Contact Us — <span style={{ color: '#F4C542' }}>Nilanga Branch</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'rgba(255, 255, 255, 0.85)', maxWidth: '720px', margin: '0 auto' }}>
              Visit our main campus in Nilanga, District Latur, or call our office helpline directly for fee structures, batch schedules, and admission guidance.
            </p>
          </ScrollReveal>
        </div>
      </div>

      <section className="section section-light">
        <div className="container">
          <div className="grid-2">
            {/* Contact Info & Office Details */}
            <ScrollReveal direction="left" duration={0.6}>
              <div>
                <h3 style={{ fontSize: '1.7rem', marginBottom: '1.5rem', color: '#FFFFFF' }}>
                  Nilanga Branch Office Details
                </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '2.5rem' }}>
                {/* Location */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    background: '#12131A',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(212, 175, 55, 0.22)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <MapPin size={24} color="var(--color-metallic-gold)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: '#FFFFFF' }}>Institute Campus Address</h4>
                    <p style={{ color: '#94A3B8', fontSize: '0.92rem', lineHeight: 1.5 }}>
                      Unique Classes, Main Campus, Nilanga, District Latur, Maharashtra — 413521
                    </p>
                    <a
                      href="https://maps.app.goo.gl/qy5ttyyGNeSXGgxY8"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        color: 'var(--color-bright-gold)',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        marginTop: '0.5rem',
                        textDecoration: 'none'
                      }}
                    >
                      Get Directions on Google Maps <ExternalLink size={14} />
                    </a>
                  </div>
                </div>

                {/* Helpline Numbers */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    background: '#12131A',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(212, 175, 55, 0.22)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <Phone size={24} color="var(--color-metallic-gold)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: '#FFFFFF' }}>Admission & Office Helplines</h4>
                    <p style={{ color: '#94A3B8', fontSize: '0.92rem' }}>
                      <a href="tel:8308433436" style={{ color: 'var(--color-bright-gold)', fontWeight: 700, textDecoration: 'none' }}>8308433436</a>
                      <span> / </span>
                      <a href="tel:8308433435" style={{ color: 'var(--color-bright-gold)', fontWeight: 700, textDecoration: 'none' }}>8308433435</a>
                    </p>
                    <span style={{ fontSize: '0.8rem', color: '#94A3B8' }}>
                      Mon - Sat: 8:00 AM - 8:00 PM
                    </span>
                  </div>
                </div>

                {/* Email Address */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    background: '#12131A',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(212, 175, 55, 0.22)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <Mail size={24} color="var(--color-metallic-gold)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: '#FFFFFF' }}>Official Email</h4>
                    <p style={{ color: '#94A3B8', fontSize: '0.92rem' }}>
                      info@theuniqueclasses.com
                    </p>
                  </div>
                </div>

                {/* Social & Mobile App Links */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '1rem',
                    background: '#12131A',
                    padding: '1.25rem',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid rgba(212, 175, 55, 0.22)',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.4)'
                  }}
                >
                  <Smartphone size={24} color="var(--color-metallic-gold)" style={{ flexShrink: 0, marginTop: '0.2rem' }} />
                  <div>
                    <h4 style={{ fontSize: '1.1rem', marginBottom: '0.3rem', color: '#FFFFFF' }}>Official App & Channels</h4>
                    <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap', marginTop: '0.4rem' }}>
                      <a
                        href="https://play.google.com/store/apps/details?id=co.bran.vflsm"
                        target="_blank"
                        rel="noreferrer"
                        className="badge badge-gold"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                      >
                        Google Play Store App
                      </a>
                      <a
                        href="https://youtu.be/JHEVG00U08E?si=sEte_asgjkBFXGVE"
                        target="_blank"
                        rel="noreferrer"
                        className="badge badge-dark"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                      >
                        YouTube Channel
                      </a>
                      <a
                        href="https://www.instagram.com/reel/DYKBZdZtD7N/?igsh=M2QxaDE0dXJ3b2Vt"
                        target="_blank"
                        rel="noreferrer"
                        className="badge badge-dark"
                        style={{ padding: '0.4rem 0.8rem', fontSize: '0.78rem' }}
                      >
                        Instagram
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </ScrollReveal>

          {/* Quick Inquiry Contact Form */}
          <ScrollReveal direction="right" duration={0.6} glow={true}>
            <div
              style={{
                background: '#12131A',
                padding: '2.5rem',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid rgba(212, 175, 55, 0.25)',
                boxShadow: '0 10px 25px rgba(0, 0, 0, 0.6)'
              }}
            >
              <h3 style={{ fontSize: '1.5rem', marginBottom: '0.5rem', color: '#FFFFFF' }}>
                Send Admission Inquiry
              </h3>
              <p style={{ color: '#94A3B8', fontSize: '0.9rem', marginBottom: '1.8rem' }}>
                Fill out your contact details below and our Nilanga office counselor will respond promptly.
              </p>

              {submitted ? (
                <div
                  style={{
                    background: 'rgba(212, 175, 55, 0.1)',
                    border: '1px solid var(--color-metallic-gold)',
                    borderRadius: 'var(--radius-md)',
                    padding: '2rem',
                    textAlign: 'center'
                  }}
                >
                  <CheckCircle2 size={48} color="var(--color-metallic-gold)" style={{ margin: '0 auto 1rem auto' }} />
                  <h4 style={{ fontSize: '1.3rem', color: '#FFFFFF', marginBottom: '0.5rem' }}>
                    Inquiry Submitted!
                  </h4>
                  <p style={{ color: '#94A3B8', fontSize: '0.95rem' }}>
                    Thank you. Unique Classes office will call you back on your registered phone number.
                  </p>
                  <button
                    onClick={() => setSubmitted(false)}
                    className="btn btn-gold"
                    style={{ marginTop: '1.5rem' }}
                  >
                    Send Another Message
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: '#E2E8F0' }}>
                      Parent / Student Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Ramesh Patil"
                      value={formData.parentName}
                      onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        background: '#0B0C11',
                        color: '#FFFFFF',
                        fontFamily: 'inherit',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: '#E2E8F0' }}>
                      Phone / Mobile Number *
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="e.g. 8308433436"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        background: '#0B0C11',
                        color: '#FFFFFF',
                        fontFamily: 'inherit',
                        fontSize: '0.95rem'
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: '#E2E8F0' }}>
                      Course / Standard Interested In
                    </label>
                    <select
                      value={formData.studentClass}
                      onChange={(e) => setFormData({ ...formData, studentClass: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        background: '#0B0C11',
                        color: '#FFFFFF',
                        fontFamily: 'inherit',
                        fontSize: '0.95rem'
                      }}
                    >
                      <option value="5th-8th">5th - 8th School Foundation</option>
                      <option value="9th-10th">9th & 10th Board Preparation</option>
                      <option value="11th-12th Science">11th & 12th Science (PCM/PCB)</option>
                      <option value="Navodaya">Navodaya Special Preparation</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.88rem', fontWeight: 600, marginBottom: '0.4rem', color: '#E2E8F0' }}>
                      Message or Inquiry Details
                    </label>
                    <textarea
                      rows={4}
                      placeholder="Ask about batch timings, fees, or demo class schedules..."
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1rem',
                        borderRadius: 'var(--radius-sm)',
                        border: '1px solid rgba(212, 175, 55, 0.3)',
                        background: '#0B0C11',
                        color: '#FFFFFF',
                        fontFamily: 'inherit',
                        fontSize: '0.95rem'
                      }}
                    ></textarea>
                  </div>

                  <Button type="submit" variant="gold" icon={Send} style={{ width: '100%', marginTop: '0.5rem' }}>
                    Submit Inquiry
                  </Button>
                </form>
              )}
            </div>
          </ScrollReveal>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ContactPage;
