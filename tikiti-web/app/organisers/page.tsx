'use client';

import Link from 'next/link';
import Arrow from '@/components/ui/Arrow';
import PublicHeader from '@/components/layout/PublicHeader';

const PG_STYLES = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { background: #faf9f2; }
  .pg { font-family: 'DM Sans', Arial, sans-serif; background: #faf9f2; color: #202220; }
  .pg-display { font-family: 'Barlow Condensed', Impact, sans-serif; }
  .pg-btn-cta {
    height: 44px; padding: 0 24px; background: #f44929; color: #fff;
    border: none; border-radius: 40px; font-size: 14px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: transform 0.15s;
    display: inline-flex; align-items: center; justify-content: center; text-decoration: none;
  }
  .pg-btn-cta:hover { transform: translateY(-2px); }
  .pg-btn-outline {
    height: 56px; padding: 0 36px; background: transparent; color: #fff;
    border: 2px solid rgba(255,255,255,0.4); border-radius: 40px; font-size: 15px; font-weight: 700;
    font-family: 'DM Sans', sans-serif; cursor: pointer; transition: all 0.15s;
    display: inline-flex; align-items: center; text-decoration: none;
  }
  .pg-btn-outline:hover { background: rgba(255,255,255,0.12); border-color: rgba(255,255,255,0.7); }
  @keyframes pgPulse { 50% { opacity: 0.3; } }
  .pg-pulse { width: 7px; height: 7px; background: #f5ee3d; border-radius: 50%; display: inline-block; animation: pgPulse 1.6s infinite; }
  @keyframes pgFloat { 0%,100% { transform: translateY(0px); } 50% { transform: translateY(-10px); } }
  .pg-float { animation: pgFloat 4s ease-in-out infinite; }
  @keyframes pgMarquee { 0% { transform: translateX(0); } 100% { transform: translateX(-50%); } }
  .pg-ticker-inner { animation: pgMarquee 22s linear infinite; white-space: nowrap; display: flex; }
  .pg-section { padding: clamp(64px, 10vw, 100px) 5%; }
  .pg-hero-cta { height: 60px; padding: 0 44px; background: #f5ee3d; color: #202220; border: none; border-radius: 40px; font-size: 16px; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; gap: 10px; text-decoration: none; font-family: 'DM Sans', sans-serif; transition: transform 0.15s; white-space: nowrap; }
  .pg-step { display: flex; gap: 32px; padding: 32px 0; border-bottom: 1px solid rgba(0,0,0,0.12); align-items: flex-start; }
  .pg-step-n { font-size: 56px; font-weight: 900; color: #f44929; line-height: 1; flex-shrink: 0; width: 72px; }
  @media (max-width: 768px) {
    .pg-btn-cta { padding: 0 18px; height: 40px; font-size: 13px; white-space: nowrap; }
    .pg-hero-cta { height: 54px; padding: 0 32px; font-size: 15px; }
    .pg-btn-outline { height: 54px; padding: 0 28px; }
    .pg-step { gap: 18px; padding: 24px 0; }
    .pg-step-n { font-size: 40px; width: 48px; }
  }
`;

const FEATURES = [
  {
    icon: '◎',
    title: 'Sell tickets instantly',
    desc: 'Go from event idea to live ticket page in minutes. Share a link, start selling.',
    accent: '#f5ee3d',
  },
  {
    icon: '⬡',
    title: 'QR check-in',
    desc: 'Scan tickets at the door with any phone. No extra hardware, no apps to install.',
    accent: '#f5ee3d',
  },
  {
    icon: '◈',
    title: 'Live analytics',
    desc: 'Watch sales in real time. Know your revenue, check-in rate, and audience breakdown.',
    accent: '#f5ee3d',
  },
  {
    icon: '⟁',
    title: 'Fast payouts',
    desc: 'Powered by Paystack. Ghana cedis, settled fast. No waiting weeks for your money.',
    accent: '#f5ee3d',
  },
  {
    icon: '✦',
    title: 'Team access',
    desc: 'Invite co-organisers and gate staff. Everyone has exactly the access they need.',
    accent: '#f5ee3d',
  },
  {
    icon: '❍',
    title: 'Promo codes',
    desc: 'Run discounts, early-bird deals, or private codes for your most loyal guests.',
    accent: '#f5ee3d',
  },
];

const STEPS = [
  { n: '01', title: 'Create your organisation', body: 'Sign up free. Add your team, set your brand, and you\'re ready to go.' },
  { n: '02', title: 'Build your event page', body: 'Add your details, set ticket tiers, and go live in one click.' },
  { n: '03', title: 'Share & sell', body: 'Drop your link anywhere — social media, WhatsApp, your website.' },
  { n: '04', title: 'Welcome your people', body: 'Scan QR codes at the door. Watch your event come to life.' },
];

const TESTIMONIALS = [
  { quote: 'Sold out 400 tickets in 3 days. The check-in was the smoothest we\'ve ever had.', name: 'Ama K.', role: 'Founder, Accra Tech Summit' },
  { quote: 'I set up our workshop page in 20 minutes. Tikiti just works.', name: 'Kofi M.', role: 'Co-founder, BuildersGH' },
  { quote: 'Finally a platform that pays out in GHS without the drama.', name: 'Abena S.', role: 'Events Lead, Startup Weekend Accra' },
];

export default function OrganisersPage() {
  return (
    <div className="pg">
      <style>{PG_STYLES}</style>

      <PublicHeader sticky cta={{ label: 'Start for free', href: '/register' }} />

      {/* Hero — purple */}
      <section style={{ background: '#6256e8', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '120px 24px 80px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        {/* bg decoration */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: 'rgba(245,238,61,0.06)', pointerEvents: 'none' }} />
        <div style={{ position: 'absolute', bottom: -80, left: -80, width: 360, height: 360, borderRadius: '50%', background: 'rgba(244,73,41,0.08)', pointerEvents: 'none' }} />

        <div style={{ fontSize: 12, letterSpacing: 3, fontWeight: 700, color: 'rgba(255,255,255,0.6)', marginBottom: 24, display: 'flex', alignItems: 'center', gap: 10 }}>
          <span className="pg-pulse" /> FOR ORGANISERS
        </div>
        <h1 className="pg-display" style={{ fontSize: 'clamp(56px, 15vw, 140px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.85, letterSpacing: -3, color: '#fff', marginBottom: 32, maxWidth: 900 }}>
          YOU BRING<br />THE EVENT.<br /><span style={{ color: '#f5ee3d' }}>WE HANDLE</span><br />THE TICKETS.
        </h1>
        <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', maxWidth: 520, lineHeight: 1.65, marginBottom: 44 }}>
          The simplest way to sell tickets, manage your guest list, and get paid — built for event organisers in Ghana and West Africa.
        </p>
        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', justifyContent: 'center' }}>
          <Link href="/register" className="pg-hero-cta">
            Start for free <Arrow dir="right" size={16} />
          </Link>
          <a href="#how-it-works" className="pg-btn-outline">See how it works</a>
        </div>
        <p style={{ marginTop: 20, fontSize: 13, color: 'rgba(255,255,255,0.45)' }}>Free to start. No credit card needed.</p>

        {/* Floating stat cards */}
        <div className="pg-float" style={{ marginTop: 80, display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
          {[
            { n: '< 5 min', l: 'to go live' },
            { n: '₵0', l: 'to start' },
            { n: '100%', l: 'GHS payouts' },
          ].map(s => (
            <div key={s.l} style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.2)', borderRadius: 16, padding: '20px 32px', textAlign: 'center' }}>
              <div className="pg-display" style={{ fontSize: 40, fontWeight: 900, color: '#f5ee3d', lineHeight: 1 }}>{s.n}</div>
              <div style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>{s.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Ticker */}
      <div style={{ background: '#f44929', padding: '14px 0', overflow: 'hidden' }}>
        <div className="pg-ticker-inner">
          {Array.from({ length: 4 }).map((_, i) => (
            <span key={i} style={{ fontSize: 13, fontWeight: 700, letterSpacing: 2, color: '#fff', paddingRight: 60 }}>
              SELL TICKETS ✳︎ QR CHECK-IN ✳︎ LIVE ANALYTICS ✳︎ GHANA PAYOUTS ✳︎ FREE TO START ✳︎ NO CONTRACTS ✳︎
            </span>
          ))}
        </div>
      </div>

      {/* Features */}
      <section className="pg-section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 64 }}>
          <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: '#f44929', marginBottom: 16 }}>EVERYTHING YOU NEED</div>
          <h2 className="pg-display" style={{ fontSize: 'clamp(52px, 6vw, 80px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.88, letterSpacing: -2 }}>
            BUILT FOR<br />ORGANISERS.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(300px, 100%), 1fr))', gap: 24 }}>
          {FEATURES.map(f => (
            <div key={f.title} style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 28, marginBottom: 16, color: '#6256e8' }}>{f.icon}</div>
              <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 8 }}>{f.title}</div>
              <div style={{ fontSize: 14, color: '#65675d', lineHeight: 1.65 }}>{f.desc}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="pg-section" style={{ background: '#f5ee3d' }}>
        <div style={{ maxWidth: 900, margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: 64 }}>
            <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: '#303327', opacity: 0.6, marginBottom: 16 }}>HOW IT WORKS</div>
            <h2 className="pg-display" style={{ fontSize: 'clamp(52px, 6vw, 80px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.88, letterSpacing: -2, color: '#202220' }}>
              FROM ZERO<br />TO SOLD OUT.
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {STEPS.map((s, i) => (
              <div key={s.n} className="pg-step" style={{ borderTop: i === 0 ? '1px solid rgba(0,0,0,0.12)' : 'none' }}>
                <div className="pg-display pg-step-n">{s.n}</div>
                <div>
                  <div style={{ fontSize: 22, fontWeight: 700, marginBottom: 8 }}>{s.title}</div>
                  <div style={{ fontSize: 15, color: '#303327', opacity: 0.7, lineHeight: 1.6 }}>{s.body}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="pg-section" style={{ maxWidth: 1100, margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: 56 }}>
          <h2 className="pg-display" style={{ fontSize: 'clamp(44px, 5vw, 64px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.9, letterSpacing: -1.5 }}>
            ORGANISERS<br />LOVE IT.
          </h2>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(280px, 100%), 1fr))', gap: 24 }}>
          {TESTIMONIALS.map(t => (
            <div key={t.name} style={{ background: '#fff', borderRadius: 20, padding: '32px 28px', border: '1px solid rgba(0,0,0,0.06)' }}>
              <div style={{ fontSize: 32, color: '#6256e8', marginBottom: 16, lineHeight: 1 }}>"</div>
              <p style={{ fontSize: 16, lineHeight: 1.65, color: '#202220', marginBottom: 24 }}>{t.quote}</p>
              <div style={{ fontSize: 14, fontWeight: 700 }}>{t.name}</div>
              <div style={{ fontSize: 12, color: '#65675d', marginTop: 2 }}>{t.role}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Pricing teaser */}
      <section className="pg-section" style={{ background: '#202220', textAlign: 'center' }}>
        <div style={{ maxWidth: 680, margin: '0 auto' }}>
          <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: 'rgba(255,255,255,0.4)', marginBottom: 20 }}>PRICING</div>
          <h2 className="pg-display" style={{ fontSize: 'clamp(52px, 6vw, 80px)', fontWeight: 900, textTransform: 'uppercase', lineHeight: 0.88, letterSpacing: -2, color: '#fff', marginBottom: 16 }}>
            FREE<br />TO START.
          </h2>
          <p style={{ fontSize: 16, color: 'rgba(255,255,255,0.6)', lineHeight: 1.65, marginBottom: 12 }}>
            Create unlimited free events at no cost. For paid events, a small service fee applies per ticket sold.
          </p>
          <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.35)', marginBottom: 40 }}>No monthly fees. No contracts. No surprises.</p>
          <Link href="/register" className="pg-hero-cta">
            Create your first event <Arrow dir="right" size={16} />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{ background: '#faf9f2', padding: '48px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.08)', flexWrap: 'wrap', gap: 16 }}>
        <a href="/" style={{ fontSize: 28, fontWeight: 700, letterSpacing: -1.5, color: '#202220', textDecoration: 'none' }}>
          tikiti<span style={{ color: '#f44929' }}>{'✳︎'}</span>
        </a>
        <div style={{ display: 'flex', gap: 28, flexWrap: 'wrap' }}>
          <a href="/" style={{ fontSize: 13, color: '#65675d', textDecoration: 'none' }}>Browse events</a>
          <Link href="/login" style={{ fontSize: 13, color: '#65675d', textDecoration: 'none' }}>Sign in</Link>
          <Link href="/register" style={{ fontSize: 13, color: '#65675d', textDecoration: 'none' }}>Get started</Link>
        </div>
        <div style={{ fontSize: 12, color: '#65675d' }}>© 2026 Tikiti</div>
      </footer>
    </div>
  );
}
