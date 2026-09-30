import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import Button from '../components/common/Button';
import { LogIn, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import logoImg from '../assets/logo.png';

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const data = await login(email, password);
      if (data.role === 'admin') navigate('/admin/dashboard');
      else if (data.role === 'office' || data.role === 'staff') navigate('/staff/dashboard');
      else if (data.role === 'teacher') navigate('/teacher/dashboard');
      else navigate('/student/dashboard');
    } catch (err) {
      setErrorMsg(err.message || 'Invalid credentials. Please check your Student ID / Username and Password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="login-page section section-black" style={{ minHeight: '85vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div className="container" style={{ maxWidth: '460px', width: '100%' }}>
        <div
          style={{
            background: 'linear-gradient(180deg, rgba(22, 24, 34, 0.98) 0%, rgba(11, 13, 20, 0.99) 100%)',
            borderRadius: '16px',
            padding: '2.5rem 2rem',
            border: '1px solid rgba(212, 175, 55, 0.4)',
            boxShadow: '0 20px 40px rgba(0, 0, 0, 0.8), 0 0 20px rgba(212, 175, 55, 0.1)',
            textAlign: 'center'
          }}
        >
          {/* LOGO & BRANDING */}
          <div style={{ marginBottom: '1.5rem' }}>
            <img
              src={logoImg}
              alt="Unique Classes"
              style={{
                width: '76px',
                height: '76px',
                borderRadius: '50%',
                border: '2px solid #D4AF37',
                boxShadow: '0 0 15px rgba(212, 175, 55, 0.3)',
                margin: '0 auto 0.75rem auto',
                display: 'block'
              }}
            />
            <h2 style={{ fontSize: '1.6rem', color: '#FFFFFF', fontWeight: 900, letterSpacing: '0.5px', margin: 0 }}>
              UNIQUE CLASSES
            </h2>
            <div style={{ color: '#D4AF37', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px' }}>
              Portal Login
            </div>
          </div>

          <p style={{ color: '#94A3B8', fontSize: '0.86rem', marginBottom: '1.6rem', lineHeight: 1.5 }}>
            Sign in to access your Admin, Faculty, Staff, or Student Portal.
          </p>

          {/* ERROR ALERT */}
          {errorMsg && (
            <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1px solid #EF4444', color: '#FCA5A5', padding: '0.75rem 1rem', borderRadius: '8px', marginBottom: '1.25rem', fontSize: '0.85rem', fontWeight: 600, textAlign: 'left' }}>
              {errorMsg}
            </div>
          )}

          {/* FORM */}
          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', textAlign: 'left' }}>
            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#F4C542', marginBottom: '0.4rem', fontWeight: 700 }}>
                Student ID / Username / Mobile / Email
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  required
                  placeholder="Enter Student ID, Mobile, or Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 1rem 0.75rem 2.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
                <User size={16} color="#D4AF37" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '0.82rem', color: '#F4C542', marginBottom: '0.4rem', fontWeight: 700 }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  placeholder="Enter Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.75rem 2.6rem 0.75rem 2.6rem',
                    borderRadius: '8px',
                    border: '1px solid rgba(212, 175, 55, 0.3)',
                    background: 'rgba(255, 255, 255, 0.04)',
                    color: '#FFFFFF',
                    fontFamily: 'inherit',
                    fontSize: '0.92rem',
                    outline: 'none'
                  }}
                />
                <Lock size={16} color="#D4AF37" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    position: 'absolute',
                    right: '0.75rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94A3B8',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '4px'
                  }}
                >
                  {showPassword ? <EyeOff size={16} color="#D4AF37" /> : <Eye size={16} color="#94A3B8" />}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              variant="gold"
              icon={LogIn}
              disabled={isSubmitting}
              style={{ width: '100%', marginTop: '0.4rem', padding: '0.75rem', fontSize: '0.92rem', fontWeight: 800 }}
            >
              {isSubmitting ? 'Authenticating...' : 'Login to Portal'}
            </Button>
          </form>

          {/* SECURE FOOTER */}
          <div style={{ marginTop: '2rem', paddingTop: '1rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: '#64748B', fontSize: '0.75rem', fontWeight: 600 }}>
            <ShieldCheck size={14} color="#059669" /> Secure Encrypted Portal Access
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
