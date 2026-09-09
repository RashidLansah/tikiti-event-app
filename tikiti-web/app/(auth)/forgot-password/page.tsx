'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';

const PG_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  .pg-auth { font-family: 'DM Sans', Arial, sans-serif; }
  .pg-display { font-family: 'Barlow Condensed', Impact, sans-serif; }
  .pg-input {
    width: 100%; height: 52px; padding: 0 16px;
    background: rgba(0,0,0,0.06); border: 1.5px solid transparent;
    border-radius: 12px; font-size: 15px; font-family: 'DM Sans', sans-serif;
    color: #202220; outline: none; transition: border-color 0.15s;
  }
  .pg-input:focus { border-color: #f44929; background: #fff; }
  .pg-input::placeholder { color: #999; }
  .pg-input:disabled { opacity: 0.5; }
  .pg-btn {
    width: 100%; height: 52px; background: #f44929; color: #fff;
    border: none; border-radius: 40px; font-size: 15px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: transform 0.15s, opacity 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .pg-btn:hover:not(:disabled) { transform: translateY(-2px); }
  .pg-btn:disabled { opacity: 0.6; cursor: not-allowed; }
  .pg-btn-ghost {
    width: 100%; height: 52px; background: transparent; color: #202220;
    border: 1.5px solid rgba(0,0,0,0.15); border-radius: 40px; font-size: 15px; font-weight: 600;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: border-color 0.15s;
    display: flex; align-items: center; justify-content: center; gap: 10px;
  }
  .pg-btn-ghost:hover { border-color: rgba(0,0,0,0.3); }
  .pg-label { font-size: 13px; font-weight: 600; color: #202220; margin-bottom: 6px; display: block; }
  .pg-error { background: #fff0ee; border: 1px solid #f4c4bb; color: #c0351a; border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 20px; }
  @media (max-width: 768px) { .lg-only { display: none !important; } }
`;

export default function ForgotPasswordPage() {
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await resetPassword(email);
      setSent(true);
    } catch (err: any) {
      if (err.code === 'auth/network-request-failed') {
        setError('Network error. Please check your connection and try again.');
      } else {
        setSent(true);
      }
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <div className="pg-auth" style={{ minHeight: '100vh', display: 'flex', background: '#faf9f2' }}>
        <style>{PG_STYLES}</style>

        {/* Left — form */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 32px' }}>
          <div style={{ maxWidth: 420, width: '100%' }}>
            <a href="/" style={{ fontSize: 36, fontWeight: 700, letterSpacing: -2, color: '#202220', textDecoration: 'none', display: 'block', marginBottom: 48 }}>
              tikiti<span style={{ color: '#f44929' }}>✳</span>
            </a>

            <div style={{ width: 56, height: 56, background: '#f5ee3d', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 28 }}>✓</div>

            <h1 className="pg-display" style={{ fontSize: 52, fontWeight: 800, textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: -1.5, margin: '0 0 12px', color: '#202220' }}>
              CHECK<br />YOUR<br />EMAIL.
            </h1>
            <p style={{ color: '#65675d', fontSize: 15, marginBottom: 6 }}>
              We&apos;ve sent reset instructions to:
            </p>
            <p style={{ color: '#202220', fontWeight: 700, fontSize: 15, marginBottom: 12 }}>{email}</p>
            <p style={{ color: '#65675d', fontSize: 13, marginBottom: 36, lineHeight: 1.6 }}>
              Can&apos;t find it? Check your spam folder. The link expires in 1 hour.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/login"><button className="pg-btn">Back to sign in →</button></Link>
              <button className="pg-btn-ghost" onClick={() => { setSent(false); setEmail(''); }}>
                Try a different email
              </button>
            </div>
          </div>
        </div>

        {/* Right — yellow panel */}
        <div className="lg-only" style={{ width: '45%', background: '#f5ee3d', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px' }}>
          <a href="/" style={{ fontSize: 38, fontWeight: 700, letterSpacing: -2.5, color: '#202220', textDecoration: 'none' }}>
            tikiti<span style={{ color: '#f44929' }}>✳</span>
          </a>
          <div>
            <div style={{ fontSize: 64, marginBottom: 24, lineHeight: 1 }}>📬</div>
            <h2 className="pg-display" style={{ fontSize: 72, fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.88, letterSpacing: -2, color: '#202220' }}>
              EMAIL<br />SENT.
            </h2>
            <p style={{ color: '#303327', fontSize: 15, lineHeight: 1.6, marginTop: 20, maxWidth: 300 }}>
              Follow the link in your inbox to reset your password and get back in.
            </p>
          </div>
          <div style={{ fontSize: 10, letterSpacing: 2, color: '#303327', opacity: 0.6 }}>TIKITI · ACCRA & BEYOND</div>
        </div>
      </div>
    );
  }

  return (
    <div className="pg-auth" style={{ minHeight: '100vh', display: 'flex', background: '#faf9f2' }}>
      <style>{PG_STYLES}</style>

      {/* Left — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 32px' }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <a href="/" style={{ fontSize: 36, fontWeight: 700, letterSpacing: -2, color: '#202220', textDecoration: 'none', display: 'block', marginBottom: 32 }}>
            tikiti<span style={{ color: '#f44929' }}>✳</span>
          </a>

          <Link href="/login" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#65675d', marginBottom: 28, fontWeight: 600 }}>
            ← Back to sign in
          </Link>

          <h1 className="pg-display" style={{ fontSize: 52, fontWeight: 800, textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: -1.5, margin: '0 0 10px', color: '#202220' }}>
            FORGOT<br />PASSWORD?
          </h1>
          <p style={{ color: '#65675d', fontSize: 15, marginBottom: 32, lineHeight: 1.6 }}>
            Enter your email and we&apos;ll send you a link to reset your password.
          </p>

          {error && <div className="pg-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="pg-label" htmlFor="email">Email address</label>
              <input
                className="pg-input"
                id="email"
                type="email"
                placeholder="hello@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                disabled={loading}
                autoFocus
              />
            </div>
            <button className="pg-btn" type="submit" disabled={loading || !email}>
              {loading ? 'Sending...' : 'Send reset link →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: '#65675d' }}>
            Remember it?{' '}
            <Link href="/login" style={{ color: '#f44929', fontWeight: 700 }}>Sign in</Link>
          </p>
        </div>
      </div>

      {/* Right — yellow panel */}
      <div className="lg-only" style={{ width: '45%', background: '#f5ee3d', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px' }}>
        <a href="/" style={{ fontSize: 38, fontWeight: 700, letterSpacing: -2.5, color: '#202220', textDecoration: 'none' }}>
          tikiti<span style={{ color: '#f44929' }}>✳</span>
        </a>
        <div>
          <h2 className="pg-display" style={{ fontSize: 80, fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.88, letterSpacing: -2, color: '#202220' }}>
            RESET<br />YOUR<br /><span style={{ color: '#f44929' }}>PASS.</span>
          </h2>
          <p style={{ color: '#303327', fontSize: 15, lineHeight: 1.6, marginTop: 24, maxWidth: 300 }}>
            We&apos;ll send a secure link to your inbox. Follow it to choose a new password.
          </p>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#303327', opacity: 0.6 }}>TIKITI · ACCRA & BEYOND</div>
      </div>
    </div>
  );
}
