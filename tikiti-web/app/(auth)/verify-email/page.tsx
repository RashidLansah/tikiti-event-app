'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { auth } from '@/lib/firebase/config';
import { sendEmailVerification } from 'firebase/auth';

const PG_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  .pg-auth { font-family: 'DM Sans', Arial, sans-serif; }
  .pg-display { font-family: 'Barlow Condensed', Impact, sans-serif; }
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
  .pg-error { background: #fff0ee; border: 1px solid #f4c4bb; color: #c0351a; border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 20px; }
  .pg-success { background: #f0fff4; border: 1px solid #b4e8c4; color: #166534; border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 20px; }
  @keyframes pgSpin { to { transform: rotate(360deg); } }
  .pg-spin { display: inline-block; width: 16px; height: 16px; border: 2px solid rgba(255,255,255,0.4); border-top-color: #fff; border-radius: 50%; animation: pgSpin 0.7s linear infinite; }
  @keyframes pgPulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.05); } }
  .pg-envelope { font-size: 56px; animation: pgPulse 2.5s ease-in-out infinite; display: block; margin-bottom: 24px; }
  @media (max-width: 768px) { .lg-only { display: none !important; } }
`;

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') || '';
  const [resending, setResending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleResendVerification = async () => {
    setResending(true);
    setError('');
    setResendSuccess(false);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setResendSuccess(true);
      } else {
        setError('Please log in again to resend the verification email.');
      }
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many attempts. Please wait a few minutes before trying again.');
      } else {
        setError('Failed to resend verification email. Please try again.');
      }
    } finally {
      setResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setChecking(true);
    setError('');
    try {
      if (auth.currentUser) {
        await auth.currentUser.reload();
        if (auth.currentUser.emailVerified) {
          router.push('/dashboard');
          return;
        }
      }
      setError('Email not yet verified. Please check your inbox and click the verification link.');
    } catch (err: any) {
      setError('Could not check verification status. Please try logging in again.');
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="pg-auth" style={{ minHeight: '100vh', display: 'flex', background: '#faf9f2' }}>
      <style>{PG_STYLES}</style>

      {/* Left — content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 32px' }}>
        <div style={{ maxWidth: 420, width: '100%' }}>
          <a href="/" style={{ fontSize: 36, fontWeight: 700, letterSpacing: -2, color: '#202220', textDecoration: 'none', display: 'block', marginBottom: 48 }}>
            tikiti<span style={{ color: '#f44929' }}>✳</span>
          </a>

          <span className="pg-envelope">📬</span>

          <h1 className="pg-display" style={{ fontSize: 52, fontWeight: 800, textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: -1.5, margin: '0 0 12px', color: '#202220' }}>
            VERIFY<br />YOUR<br />EMAIL.
          </h1>

          <p style={{ color: '#65675d', fontSize: 15, marginBottom: 4, lineHeight: 1.6 }}>
            We&apos;ve sent a verification link to:
          </p>
          {email ? (
            <p style={{ color: '#202220', fontWeight: 700, fontSize: 15, marginBottom: 24 }}>{email}</p>
          ) : (
            <p style={{ color: '#65675d', fontSize: 15, marginBottom: 24 }}>your email address</p>
          )}

          {error && <div className="pg-error">{error}</div>}
          {resendSuccess && (
            <div className="pg-success">✓ Verification email sent! Check your inbox.</div>
          )}

          <div style={{ background: 'rgba(0,0,0,0.04)', borderRadius: 14, padding: '18px 20px', marginBottom: 28, fontSize: 14, color: '#65675d', lineHeight: 1.65 }}>
            Click the link in the email to verify your account. Once verified, come back here and tap the button below.
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <button className="pg-btn" onClick={handleCheckVerification} disabled={checking}>
              {checking ? <><span className="pg-spin" /> Checking...</> : "I've verified my email →"}
            </button>
            <button className="pg-btn-ghost" onClick={handleResendVerification} disabled={resending}>
              {resending ? <><span className="pg-spin" style={{ borderTopColor: '#202220', borderColor: 'rgba(0,0,0,0.15)' }} /> Sending...</> : '✉ Resend verification email'}
            </button>
          </div>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 13, color: '#65675d' }}>
            <Link href="/login" style={{ color: '#f44929', fontWeight: 700 }}>← Back to sign in</Link>
          </p>

          <p style={{ textAlign: 'center', marginTop: 40, fontSize: 11, color: '#999' }}>
            © {new Date().getFullYear()} Tikiti Events Ltd
          </p>
        </div>
      </div>

      {/* Right — purple panel */}
      <div className="lg-only" style={{ width: '45%', background: '#6256e8', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px' }}>
        <a href="/" style={{ fontSize: 38, fontWeight: 700, letterSpacing: -2.5, color: '#fff', textDecoration: 'none' }}>
          tikiti<span style={{ color: '#f5ee3d' }}>✳</span>
        </a>
        <div>
          <div style={{ fontSize: 10, letterSpacing: 3, color: 'rgba(255,255,255,0.5)', marginBottom: 20 }}>ONE MORE STEP</div>
          <h2 className="pg-display" style={{ fontSize: 80, fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.88, letterSpacing: -2, color: '#fff' }}>
            ALMOST<br />THERE.<br /><span style={{ color: '#f5ee3d' }}>✳</span>
          </h2>
          <p style={{ color: 'rgba(255,255,255,0.7)', fontSize: 15, lineHeight: 1.6, marginTop: 24, maxWidth: 300 }}>
            Your account is ready. Just click the link in your email to confirm it&apos;s you.
          </p>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>TIKITI · ACCRA & BEYOND</div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#faf9f2' }} />}>
      <VerifyEmailContent />
    </Suspense>
  );
}
