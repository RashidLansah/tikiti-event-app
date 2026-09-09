'use client';

import { useState, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { Eye, EyeOff } from 'lucide-react';
import LoadingScreen from '@/components/ui/LoadingScreen';

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
  @keyframes pgStampIn { from { transform: rotate(-12deg) scale(0.6); opacity: 0; } to { transform: rotate(-12deg) scale(1); opacity: 1; } }
  .pg-stamp { animation: pgStampIn 0.5s 0.3s both cubic-bezier(0.34, 1.56, 0.64, 1); }
`;

const FEATURES = [
  { icon: '✦', label: 'Unlimited events', sub: 'No cap on what you create' },
  { icon: '⬡', label: 'QR check-in', sub: 'Fast entry, zero friction' },
  { icon: '◈', label: 'Real-time analytics', sub: 'Know your numbers live' },
  { icon: '⟁', label: 'Paystack payouts', sub: 'GHS, fast settlements' },
  { icon: '◎', label: 'Team access', sub: 'Invite your crew' },
];

function RegisterForm() {
  const router = useRouter();
  const { register, createOrganization } = useAuth();
  const [formData, setFormData] = useState({ name: '', companyName: '', email: '', password: '', confirmPassword: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [error, setError] = useState('');

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) => setFormData(p => ({ ...p, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (formData.password !== formData.confirmPassword) { setError('Passwords do not match.'); return; }
    if (formData.password.length < 8) { setError('Password must be at least 8 characters.'); return; }
    setLoading(true);
    try {
      await register(formData.email, formData.password, formData.name);
      await createOrganization({ name: formData.companyName });
      setShowLoadingScreen(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create account. Please try again.');
      setLoading(false);
    }
  };

  const handleLoadingComplete = () => router.push('/verify-email');

  if (showLoadingScreen) return <LoadingScreen onComplete={handleLoadingComplete} duration={1500} />;

  return (
    <div className="pg-auth" style={{ minHeight: '100vh', display: 'flex', background: '#faf9f2' }}>
      <style>{PG_STYLES}</style>

      {/* Left — purple panel */}
      <div style={{ width: '45%', background: '#6256e8', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', padding: '40px 48px', position: 'relative', overflow: 'hidden' }} className="lg-only">
        <a href="/" style={{ fontSize: 38, fontWeight: 700, letterSpacing: -2.5, color: '#fff', textDecoration: 'none' }}>
          tikiti<span style={{ color: '#f5ee3d' }}>✳</span>
        </a>

        {/* stamp */}
        <div className="pg-stamp" style={{ position: 'absolute', top: 80, right: -24, width: 160, height: 160, border: '3px solid rgba(255,255,255,0.25)', borderRadius: '50%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transform: 'rotate(-12deg)', fontSize: 11, letterSpacing: 2, color: 'rgba(255,255,255,0.6)', fontWeight: 700, textAlign: 'center' }}>
          <span style={{ fontSize: 32, marginBottom: 4 }}>✳</span>
          FREE<br />TO START
        </div>

        <div>
          <h2 className="pg-display" style={{ fontSize: 'clamp(60px, 5.5vw, 88px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.88, letterSpacing: -2, margin: '0 0 28px', color: '#fff' }}>
            BRING<br />YOUR<br /><span style={{ color: '#f5ee3d' }}>EVENT.</span>
          </h2>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {FEATURES.map(f => (
              <div key={f.label} style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <span style={{ fontSize: 16, color: '#f5ee3d', flexShrink: 0, marginTop: 1 }}>{f.icon}</span>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>{f.label}</div>
                  <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)', marginTop: 1 }}>{f.sub}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(255,255,255,0.4)' }}>TIKITI · ACCRA & BEYOND</div>
      </div>

      {/* Right — form */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', padding: '48px 32px', overflowY: 'auto' }}>
        {/* Mobile logo */}
        <div style={{ display: 'none', marginBottom: 32 }} className="mobile-logo">
          <a href="/" style={{ fontSize: 36, fontWeight: 700, letterSpacing: -2, color: '#202220', textDecoration: 'none' }}>tikiti<span style={{ color: '#f44929' }}>✳</span></a>
        </div>

        <div style={{ maxWidth: 420, width: '100%' }}>
          <h1 className="pg-display" style={{ fontSize: 52, fontWeight: 800, textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: -1.5, margin: '0 0 8px', color: '#202220' }}>
            CREATE<br />YOUR<br />ACCOUNT.
          </h1>
          <p style={{ color: '#65675d', fontSize: 15, marginBottom: 32 }}>Start selling tickets in minutes — free forever.</p>

          {error && <div className="pg-error">{error}</div>}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label className="pg-label" htmlFor="name">Full Name</label>
              <input className="pg-input" id="name" type="text" placeholder="Kwame Asante" value={formData.name} onChange={set('name')} required disabled={loading} />
            </div>
            <div>
              <label className="pg-label" htmlFor="company">Company / Organisation Name</label>
              <input className="pg-input" id="company" type="text" placeholder="Accra Tech Hub" value={formData.companyName} onChange={set('companyName')} required disabled={loading} />
            </div>
            <div>
              <label className="pg-label" htmlFor="email">Email</label>
              <input className="pg-input" id="email" type="email" placeholder="hello@company.com" value={formData.email} onChange={set('email')} required disabled={loading} />
            </div>
            <div>
              <label className="pg-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative' }}>
                <input className="pg-input" id="password" type={showPassword ? 'text' : 'password'} placeholder="Minimum 8 characters" value={formData.password} onChange={set('password')} required disabled={loading} style={{ paddingRight: 48 }} />
                <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0 }}>
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="pg-label" htmlFor="confirm">Confirm Password</label>
              <div style={{ position: 'relative' }}>
                <input className="pg-input" id="confirm" type={showConfirm ? 'text' : 'password'} placeholder="Repeat your password" value={formData.confirmPassword} onChange={set('confirmPassword')} required disabled={loading} style={{ paddingRight: 48 }} />
                <button type="button" onClick={() => setShowConfirm(!showConfirm)} style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#999', padding: 0 }}>
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button className="pg-btn" type="submit" disabled={loading} style={{ marginTop: 8 }}>
              {loading ? 'Creating account...' : 'Get started →'}
            </button>
          </form>

          <p style={{ textAlign: 'center', marginTop: 24, fontSize: 13, color: '#65675d', lineHeight: 1.5 }}>
            By creating an account you agree to our{' '}
            <Link href="/terms" style={{ color: '#f44929', fontWeight: 600 }}>Terms</Link>
            {' '}and{' '}
            <Link href="/privacy" style={{ color: '#f44929', fontWeight: 600 }}>Privacy Policy</Link>.
          </p>

          <p style={{ textAlign: 'center', marginTop: 16, fontSize: 14, color: '#65675d' }}>
            Already have an account?{' '}
            <Link href="/login" style={{ color: '#f44929', fontWeight: 700 }}>Sign in</Link>
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

export default function RegisterPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', background: '#faf9f2' }} />}>
      <RegisterForm />
    </Suspense>
  );
}
