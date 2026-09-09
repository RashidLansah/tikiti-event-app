'use client';

import dynamic from 'next/dynamic';

// Load Three.js globe client-side only (no SSR)
const GlobeHero = dynamic(() => import('./GlobeHero'), { ssr: false });

export default function HeroSection() {
  return (
    <section className="hero-section">
      {/* Nav */}
      <nav className="hero-nav">
        <span className="logo">TIKITI</span>
        <div className="nav-links">
          <a href="/events">Events</a>
          <a href="#organisers">For Organisers</a>
          <a href="#pricing">Pricing</a>
        </div>
        <a href="#" className="nav-cta">Get the app</a>
      </nav>

      {/* Main split layout */}
      <div className="hero-body">
        {/* Left — editorial */}
        <div className="hero-left">
          <h1 className="hero-headline">
            ONE APP.<br />
            EVERY<br />
            EVENT.
          </h1>
          <p className="hero-sub">
            Sell tickets, scan QR codes at the gate, and keep
            attendees connected long after the event ends — with
            a shared photo album only real ticket holders can post&nbsp;to.
          </p>
          <div className="hero-ctas">
            <a href="#" className="cta-primary">Get the App</a>
            <a href="/events" className="cta-secondary">Browse Events</a>
          </div>
        </div>

        {/* Right — globe */}
        <div className="hero-right">
          <GlobeHero className="globe-mount" />
        </div>
      </div>

      <style jsx>{`
        .hero-section {
          position: relative;
          width: 100%;
          height: 100svh;
          min-height: 640px;
          background: #000;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: var(--font-plus-jakarta, 'Plus Jakarta Sans', sans-serif);
        }

        /* ── Nav ── */
        .hero-nav {
          position: absolute;
          top: 0; left: 0; right: 0;
          z-index: 20;
          display: flex;
          align-items: center;
          padding: 28px 48px;
          gap: 0;
        }

        .logo {
          font-size: 14px;
          font-weight: 800;
          letter-spacing: 4px;
          color: #fff;
          flex-shrink: 0;
        }

        .nav-links {
          display: flex;
          gap: 36px;
          margin-left: auto;
          margin-right: 40px;
        }

        .nav-links a {
          font-size: 13px;
          font-weight: 500;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: color 0.2s;
        }

        .nav-links a:hover { color: #fff; }

        .nav-cta {
          font-size: 13px;
          font-weight: 700;
          color: #fff;
          background: #FF6519;
          text-decoration: none;
          border-radius: 20px;
          padding: 9px 22px;
          flex-shrink: 0;
          transition: opacity 0.2s;
        }

        .nav-cta:hover { opacity: 0.88; }

        /* ── Body split ── */
        .hero-body {
          flex: 1;
          display: grid;
          grid-template-columns: 1fr 1fr;
          /* stretch (default) so right column gets full height for Three.js */
        }

        /* ── Left content ── */
        .hero-left {
          padding: 120px 48px 80px 96px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          gap: 0;
        }

        .hero-headline {
          font-size: clamp(56px, 7vw, 108px);
          font-weight: 800;
          line-height: 0.95;
          letter-spacing: -2px;
          color: #f5f2ee;
          margin: 0 0 32px;
          text-wrap: balance;
        }

        .hero-sub {
          font-size: 16px;
          font-weight: 400;
          line-height: 1.7;
          color: rgba(255,255,255,0.45);
          max-width: 420px;
          margin: 0 0 48px;
        }

        .hero-ctas {
          display: flex;
          gap: 14px;
          align-items: center;
          flex-wrap: wrap;
        }

        .cta-primary {
          font-size: 14px;
          font-weight: 700;
          color: #fff;
          background: #fff;
          color: #000;
          border-radius: 28px;
          padding: 13px 28px;
          text-decoration: none;
          transition: opacity 0.2s, transform 0.2s;
          letter-spacing: 0.1px;
        }

        .cta-primary:hover { opacity: 0.88; transform: translateY(-1px); }

        .cta-secondary {
          font-size: 14px;
          font-weight: 500;
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          border: 1px solid rgba(255,255,255,0.15);
          border-radius: 28px;
          padding: 13px 28px;
          transition: border-color 0.2s, color 0.2s;
        }

        .cta-secondary:hover {
          border-color: rgba(255,255,255,0.4);
          color: #fff;
        }

        /* ── Globe ── */
        .hero-right {
          position: relative;
          /* height comes from grid stretch — do not set height: 100% here */
          overflow: hidden;
        }

        :global(.globe-mount) {
          width: 100% !important;
          height: 100% !important;
        }

        /* Left fade — blends globe into the black left side */
        .hero-right::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(to right, #000 0%, transparent 18%);
          pointer-events: none;
          z-index: 5;
        }

        /* ── Responsive ── */
        @media (max-width: 900px) {
          .hero-body { grid-template-columns: 1fr; }
          .hero-right { height: 50vw; min-height: 280px; }
          .hero-left  { padding: 100px 32px 40px; }
          .nav-links  { display: none; }
        }
      `}</style>
    </section>
  );
}
