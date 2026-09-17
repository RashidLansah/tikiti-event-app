'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';
import Arrow from '@/components/ui/Arrow';

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
  .pg-label { font-size: 13px; font-weight: 600; color: #202220; margin-bottom: 6px; display: block; }
  .pg-error { background: #fff0ee; border: 1px solid #f4c4bb; color: #c0351a; border-radius: 10px; padding: 12px 16px; font-size: 13px; margin-bottom: 20px; }
  @keyframes pgPulse { 50% { opacity: 0.3; } }
  .pg-pulse { width: 7px; height: 7px; background: #f44929; border-radius: 50%; display: inline-block; animation: pgPulse 1.6s infinite; }
`;

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, logout, user, loading: authLoading, hasOrganization, isGateStaff, refreshOrganizations, userProfile } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState('');
  const [orgCheckDone, setOrgCheckDone] = useState(false);

  useEffect(() => {
    if (!authLoading && user) {
      if (hasOrganization) {
        if (isGateStaff) {
          router.replace('/gate');
        } else {
          const redirectUrl = searchParams.get('redirect') || '/dashboard';
          router.replace(redirectUrl);
        }
      }
      if (!hasOrganization && userProfile?.organizationId && !orgCheckDone) {
        refreshOrganizations().finally(() => setOrgCheckDone(true));
      } else if (!hasOrganization) {
        setOrgCheckDone(true);
      }
    }
  }, [user, authLoading, hasOrganization, isGateStaff, router, searchParams, userProfile?.organizationId, orgCheckDone, refreshOrganizations]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
      setShowLoadingScreen(true);
    } catch (err: any) {
      if (err.code === 'auth/email-not-verified') {
        router.push(`/verify-email?email=${encodeURIComponent(email)}`);
        return;
      }
      setError(err.message || 'Failed to login. Please check your credentials.');
      setLoading(false);
    }
  };

  const handleLoadingComplete = () => {
    if (isGateStaff) router.push('/gate');
    else router.push('/dashboard');
  };

  if (showLoadingScreen) return <LoadingScreen onComplete={handleLoadingComplete} duration={1500} />;

  if (authLoading || (user && !hasOrganization && !orgCheckDone)) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f2' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 32, height: 32, border: '3px solid #f44929', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto' }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (user && hasOrganization) return null;

  if (user && !hasOrganization && orgCheckDone) {
    return (
      <div className="pg-auth" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#faf9f2', padding: '24px' }}>
        <style>{PG_STYLES}</style>
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <a href="/" style={{ fontSize: 36, fontWeight: 700, letterSpacing: -2, color: '#202220', textDecoration: 'none', fontFamily: 'DM Sans, sans-serif' }}>
            tikiti<span style={{ color: '#f44929' }}>{'✳︎'}</span>
          </a>
          <h1 className="pg-display" style={{ fontSize: 56, fontWeight: 800, textTransform: 'uppercase', margin: '24px 0 12px', lineHeight: 0.9 }}>No org found.</h1>
          <p style={{ color: '#65675d', marginBottom: 8 }}>Your account ({user.email}) is not linked to any organisation.</p>
          <p style={{ color: '#65675d', marginBottom: 32 }}>Check your invite email or create a new organisation.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Link href="/register"><button className="pg-btn">Create New Organisation</button></Link>
            <button onClick={async () => { await logout(); window.location.reload(); }} style={{ height: 52, background: 'transparent', border: '1.5px solid rgba(0,0,0,0.15)', borderRadius: 40, fontSize: 15, fontWeight: 600, cursor: 'pointer', fontFamily: 'DM Sans, sans-serif' }}>Sign out & use different account</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="pg-auth" style={{ minHeight: '100vh', display: 'flex', background: '#faf9f2' }}>
      <style>{PG_STYLES}</style>

      {/* Left — yellow editorial panel */}
      <div style={{ width: '45%', background: '#f5ee3d', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', position: 'relative', overflow: 'hidden' }} className="lg-only">
        <a href="/" style={{ fontSize: 38, fontWeight: 700, letterSpacing: -2.5, color: '#202220', textDecoration: 'none' }}>
          tikiti<span style={{ color: '#f44929' }}>{'✳︎'}</span>
        </a>
        <div>
          <div style={{ fontSize: 12, letterSpacing: 2, fontWeight: 700, marginBottom: 20, display: 'flex', alignItems: 'center', gap: 8 }}>
            <span className="pg-pulse" /> ORGANISER PORTAL
          </div>
          <h2 className="pg-display" style={{ fontSize: 'clamp(64px, 6vw, 96px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.88, letterSpacing: -2, margin: 0, color: '#202220' }}>
            GOOD<br />IDEAS<br />START<br /><span style={{ color: '#f44929' }}>HERE.</span>
          </h2>
          <p style={{ color: '#303327', fontSize: 15, lineHeight: 1.6, marginTop: 24, maxWidth: 300 }}>
            Manage your events, sell tickets, and welcome your people — all in one place.
          </p>
        </div>
        <div style={{ fontSize: 10, letterSpacing: 2, color: '#303327', opacity: 0.6 }}>TIKITI · ACCRA & BEYOND</div>
      </div>

      {/* Right — form */}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: 'clamp(32px, 6vw, 48px) clamp(20px, 5vw, 32px)' }}>
        {/* Mobile logo */}
        <div style={{ display: 'none', marginBottom: 32 }} className="mobile-logo">
          <a href="/" style={{ fontSize: 36, fontWeight: 700, letterSpacing: -2, color: '#202220', textDecoration: 'none' }}>tikiti<span style={{ color: '#f44929' }}>{'✳︎'}</span></a>
        </div>

        <div style={{ maxWidth: 420, width: '100%' }}>
          <h1 className="pg-display" style={{ fontSize: 'clamp(44px, 12vw, 52px)', fontWeight: 800, textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: -1.5, margin: '0 0 8px', color: '#202220' }}>
            WELCOME<br />BACK.
          </h1>
          <p style={{ color: '#65675d', fontSize: 15, marginBottom: 32 }}>Enter your details to access your dashboard.</p>

          {error && <div className="pg-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            <div>
              <label className="pg-label" htmlFor="email">Email</label>
              <input className="pg-input" id="email" type="email" placeholder="hello@company.com" value={email} onChange={e => setEmail(e.target.value)} required disabled={loading} />
            </div>
            <div>
              <label className="pg-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="pg-input" id="password" type={showPassword ? 'text' : 'password'} placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} required disabled={loading} style={{ paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0 }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link href="/forgot-password" style={{ fontSize: 13, color: '#f44929', fontWeight: 600 }}>Forgot password?</Link>
            </div>

            <button className="pg-btn" type="submit" disabled={loading}>
              {loading ? 'Signing in...' : <>Sign in <Arrow dir="right" size={16} /></>}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 28, fontSize: 14, color: '#65675d' }}>
            Don&apos;t have an account?{' '}
            <Link href="/register" style={{ color: '#f44929', fontWeight: 700 }}>Create one</Link>
          </p>
        </div>
      </div>

      <style>{`
        @media (max-width: 768px) {
          .lg-only { display: none !important; }
          .mobile-logo { display: block !important; }
        }
      `}</style>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#faf9f2' }} />}>
      <LoginForm />
    </Suspense>
  );
}
