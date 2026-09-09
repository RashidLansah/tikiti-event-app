'use client';

import { useEffect, useRef, useState } from 'react';
import { techEvents } from '@/data/techEvents';

const WHEEL_EVENTS = techEvents.slice(0, 5);

export default function PlaygroundPage() {
  const [activeIdx, setActiveIdx] = useState(0);
  const [scrolled, setScrolled] = useState(false);
  const lastInteraction = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const select = (i: number, manual = false) => {
    const next = ((i % WHEEL_EVENTS.length) + WHEEL_EVENTS.length) % WHEEL_EVENTS.length;
    setActiveIdx(next);
    if (manual) lastInteraction.current = Date.now();
  };

  useEffect(() => {
    intervalRef.current = setInterval(() => {
      if (Date.now() - lastInteraction.current > 9000) {
        setActiveIdx(prev => (prev + 1) % WHEEL_EVENTS.length);
      }
    }, 4800);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  const ev = WHEEL_EVENTS[activeIdx];

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');

        :root {
          --pg-bg: #faf9f2;
          --pg-fg: #202220;
          --pg-accent: #f44929;
          --pg-yellow: #f5ee3d;
          --pg-purple: #6256e8;
          --pg-muted: #65675d;
          --pg-line: rgba(34,34,34,0.15);
          --pg-display: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif;
        }

        .pg { font-family: 'DM Sans', Arial, sans-serif; background: var(--pg-bg); color: var(--pg-fg); overflow-x: clip; }
        .pg * { box-sizing: border-box; }
        .pg a { color: inherit; text-decoration: none; }
        .pg button { font: inherit; cursor: pointer; }
        .pg button:focus-visible, .pg a:focus-visible { outline: 3px solid #ff7e47; outline-offset: 5px; }

        /* Header */
        .pg-header {
          background: var(--pg-yellow);
          height: 80px;
          padding: 0 5%;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: sticky;
          top: 0;
          z-index: 100;
          transition: background 0.25s, box-shadow 0.25s;
        }
        .pg-header.scrolled {
          background: #fff;
          box-shadow: 0 1px 0 rgba(0,0,0,0.08);
        }
        .pg-logo {
          font-size: 38px;
          font-weight: 700;
          letter-spacing: -3px;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
        .pg-logo span { font-size: 26px; color: var(--pg-accent); letter-spacing: 0; }
        .pg-nav { display: flex; gap: 28px; font-size: 14px; }
        .pg-nav a:hover { opacity: 0.6; }
        .pg-nav-cta {
          border: 1px solid var(--pg-line);
          padding: 11px 18px;
          border-radius: 30px;
          font-size: 13px;
        }
        .pg-nav-cta span { margin-left: 20px; }

        /* Hero */
        .pg-hero {
          background: var(--pg-yellow);
          text-align: center;
          padding: 28px 5% 0;
          overflow: hidden;
        }
        .pg-eyebrow {
          font-size: 12px;
          letter-spacing: 1.7px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          margin-bottom: 18px;
        }
        .pg-pulse {
          width: 7px; height: 7px;
          background: var(--pg-accent);
          border-radius: 50%;
          animation: pgPulse 1.6s infinite;
          display: inline-block;
        }
        .pg-h1 {
          font-family: var(--pg-display);
          font-size: clamp(80px, 9vw, 140px);
          line-height: 0.9;
          letter-spacing: -3px;
          text-transform: uppercase;
          margin: 0 0 18px;
          font-weight: 800;
        }
        .pg-h1 em { font-style: normal; color: var(--pg-accent); display: block; }
        .pg-desc {
          font-size: 16px;
          color: #333;
          max-width: 440px;
          line-height: 1.6;
          margin: 0 auto 24px;
        }
        .pg-primary {
          background: var(--pg-accent);
          color: #fff;
          display: inline-flex;
          align-items: center;
          gap: 24px;
          border-radius: 40px;
          padding: 16px 24px;
          font-size: 14px;
          font-weight: 700;
          border: none;
          transition: transform 0.2s;
          text-decoration: none;
        }
        .pg-primary:hover { transform: translateY(-3px); }
        .pg-primary span { font-size: 20px; }

        /* Posters */
        .pg-visual {
          height: 370px;
          max-width: 880px;
          margin: 28px auto 0;
          position: relative;
          text-align: left;
        }
        .pg-poster {
          position: absolute;
          width: 29%;
          height: 290px;
          border-radius: 7px;
          overflow: hidden;
          box-shadow: 0 20px 55px rgba(0,0,0,0.2);
          border: 1px solid rgba(255,255,255,0.35);
        }
        .pg-poster img { width: 100%; height: 100%; object-fit: cover; }
        .pg-poster::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(transparent, rgba(0,0,0,0.6));
        }
        .pg-poster-text {
          position: absolute;
          inset: 18px;
          z-index: 1;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          color: #fff;
        }
        .pg-poster-text small { font-size: 9px; letter-spacing: 2px; }
        .pg-poster-text strong {
          font-family: var(--pg-display);
          font-size: 46px;
          font-weight: 800;
          line-height: 0.88;
          letter-spacing: -1px;
          white-space: pre-line;
        }
        .pg-poster-two .pg-poster-text strong { color: #e3fa69; }
        .pg-poster-text span { font-size: 8px; letter-spacing: 1.2px; }

        .pg-poster-one { left: 10%; top: 7px; animation: pgFloat1 6s ease-in-out infinite; transform: rotate(-14deg); }
        .pg-poster-two { left: 37%; top: 40px; animation: pgFloat2 7s ease-in-out infinite; transform: rotate(9deg); z-index: 2; }
        .pg-poster-three { left: 64%; top: 5px; width: 27%; height: 265px; animation: pgFloat3 8s ease-in-out infinite; transform: rotate(23deg); }

        .pg-stamp {
          border-radius: 100%;
          background: var(--pg-purple);
          color: #fff;
          width: 112px; height: 112px;
          position: absolute;
          bottom: 60px; left: -10px;
          z-index: 3;
          display: flex;
          flex-direction: column;
          justify-content: center;
          text-align: center;
          font-size: 13px;
          line-height: 1.1;
          transform: rotate(12deg);
          animation: pgStamp 8s ease-in-out infinite;
        }
        .pg-stamp b { font-family: var(--pg-display); font-size: 26px; }

        /* Hero bottom bar */
        .pg-hero-bottom {
          position: relative;
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          letter-spacing: 1.5px;
          color: #303327;
          padding: 16px 0 20px;
          margin-top: 8px;
          border-top: 1px solid rgba(0,0,0,0.1);
        }

        /* Ticker */
        .pg-ticker {
          height: 58px;
          overflow: hidden;
          background: var(--pg-accent);
          color: white;
          display: flex;
          align-items: center;
          transform: rotate(1deg);
          margin: 0 -2%;
          width: 104%;
        }
        .pg-ticker-inner {
          white-space: nowrap;
          font-family: var(--pg-display);
          font-size: 28px;
          word-spacing: 10px;
          font-weight: 600;
          animation: pgMarquee 28s linear infinite;
        }

        /* Discovery */
        .pg-discovery { padding: 90px 5% 48px; overflow: hidden; }
        .pg-section-top { display: flex; justify-content: space-between; align-items: flex-end; margin-bottom: 24px; }
        .pg-section-top h2 {
          font-family: var(--pg-display);
          font-size: clamp(56px, 7vw, 88px);
          font-weight: 700;
          line-height: 0.95;
          letter-spacing: -1.5px;
          margin: 16px 0 24px;
        }
        .pg-section-top h2 em { font-style: normal; color: var(--pg-accent); }
        .pg-disc-intro { line-height: 1.6; color: var(--pg-muted); font-size: 15px; padding-bottom: 24px; max-width: 280px; text-align: right; }

        /* Category pills */
        .pg-cats { display: flex; gap: 8px; justify-content: center; margin: 0 0 24px; flex-wrap: wrap; }
        .pg-cats button {
          border: 1px solid var(--pg-line);
          border-radius: 30px;
          padding: 10px 20px;
          background: transparent;
          color: var(--pg-fg);
          font-size: 13px;
          transition: background 0.15s;
        }
        .pg-cats button.active {
          background: var(--pg-accent);
          border-color: var(--pg-accent);
          color: #fff;
        }

        /* Wheel */
        .pg-wheel { position: relative; height: 520px; max-width: 1200px; margin: 0 auto; overflow: hidden; }
        .pg-wheel-card {
          position: absolute;
          left: 50%;
          top: 26px;
          width: 230px;
          height: 285px;
          overflow: hidden;
          border-radius: 0;
          border: 7px solid #fff;
          transform-origin: center 580px;
          transition: transform 950ms cubic-bezier(0.2, 0.8, 0.2, 1), opacity 0.7s;
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
          background: #333;
        }
        .pg-wheel-card img { height: 100%; width: 100%; object-fit: cover; }
        .pg-wheel-card::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(transparent 20%, rgba(0,0,0,0.7));
        }
        .pg-card-content { position: absolute; bottom: 20px; left: 20px; z-index: 2; color: #fff; }
        .pg-card-content small { font-size: 9px; letter-spacing: 1.3px; }
        .pg-card-content strong {
          font-family: var(--pg-display);
          font-size: 44px;
          font-weight: 700;
          line-height: 0.95;
          display: block;
          margin-top: 6px;
          white-space: pre-line;
        }
        .pg-wheel-center {
          position: absolute;
          bottom: 16px;
          left: 50%;
          transform: translateX(-50%);
          text-align: center;
        }
        .pg-wheel-caption { font-size: 10px; color: var(--pg-muted); letter-spacing: 2px; }
        .pg-wheel-center h3 {
          font-family: var(--pg-display);
          font-size: 40px;
          font-weight: 700;
          margin: 8px 0 12px;
          white-space: nowrap;
        }
        .pg-wheel-link { font-size: 13px; border-bottom: 1px solid var(--pg-accent); padding-bottom: 4px; }
        .pg-wheel-controls { display: flex; justify-content: center; align-items: center; gap: 24px; margin: 12px 0; }
        .pg-wheel-controls button {
          background: transparent;
          color: var(--pg-fg);
          border: 1px solid var(--pg-line);
          width: 44px; height: 44px;
          border-radius: 50%;
          font-size: 22px;
          transition: background 0.15s, color 0.15s;
        }
        .pg-wheel-controls button:hover { background: var(--pg-accent); color: #fff; border-color: var(--pg-accent); }
        .pg-wheel-count { font-size: 12px; color: var(--pg-muted); }
        .pg-view-all { text-align: center; margin: 28px 0 8px; }
        .pg-sample-note { text-align: center; font-size: 11px; color: var(--pg-muted); margin-top: 24px; }

        /* Organisers */
        .pg-organisers {
          margin: 24px 5% 60px;
          padding: 52px;
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: var(--pg-purple);
          color: #fff;
          border-radius: 12px;
          gap: 40px;
        }
        .pg-organisers h2 {
          font-family: var(--pg-display);
          font-size: clamp(36px, 4vw, 52px);
          font-weight: 700;
          line-height: 0.98;
          margin: 16px 0 0;
        }
        .pg-organisers .pg-eyebrow { font-size: 11px; letter-spacing: 1.5px; opacity: 0.65; }
        .pg-organisers p { font-size: 15px; line-height: 1.6; margin-bottom: 24px; }
        .pg-org-cta {
          background: var(--pg-yellow);
          color: #222;
          display: inline-flex;
          align-items: center;
          gap: 20px;
          border-radius: 40px;
          padding: 15px 22px;
          font-size: 14px;
          font-weight: 700;
          transition: transform 0.2s;
          text-decoration: none;
          border: none;
          cursor: pointer;
        }
        .pg-org-cta:hover { transform: translateY(-2px); }
        .pg-org-cta span { font-size: 18px; }

        /* Footer */
        .pg-footer {
          margin: 0 5%;
          padding: 24px 0 36px;
          border-top: 1px solid var(--pg-line);
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 12px;
          color: var(--pg-muted);
        }

        /* Animations */
        @keyframes pgFloat1 { 50% { transform: translateY(-18px) rotate(-9deg); } }
        @keyframes pgFloat2 { 50% { transform: translateY(12px) rotate(3deg); } }
        @keyframes pgFloat3 { 50% { transform: translateY(-12px) rotate(17deg); } }
        @keyframes pgStamp { 50% { transform: rotate(-9deg); } }
        @keyframes pgPulse { 50% { opacity: 0.3; } }
        @keyframes pgMarquee { to { transform: translateX(-50%); } }

        /* Responsive */
        @media (max-width: 768px) {
          .pg-nav { display: none; }
          .pg-h1 { font-size: clamp(62px, 16vw, 88px); letter-spacing: -2px; }
          .pg-visual { height: 330px; }
          .pg-poster-one { width: 44%; left: 2%; height: 255px; }
          .pg-poster-two { left: 30%; top: 28px; width: 40%; }
          .pg-poster-three { left: 60%; width: 36%; height: 245px; }
          .pg-poster-text strong { font-size: 38px; }
          .pg-stamp { left: 0; bottom: 0; width: 90px; height: 90px; font-size: 11px; }
          .pg-stamp b { font-size: 22px; }
          .pg-section-top { display: block; }
          .pg-disc-intro { text-align: left; max-width: none; padding-bottom: 0; }
          .pg-organisers { flex-direction: column; padding: 32px; align-items: flex-start; }
          .pg-footer { flex-wrap: wrap; gap: 20px; }
        }
      `}</style>

      <div className="pg">
        {/* Header */}
        <header className={`pg-header${scrolled ? ' scrolled' : ''}`}>
          <a className="pg-logo" href="#">tikiti<span>✳</span></a>
          <nav className="pg-nav">
            <a href="/events">Discover events</a>
            <a href="https://www.gettikiti.com/register" target="_blank" rel="noopener">For organizers ↗</a>
          </nav>
          <a className="pg-nav-cta" href="/events">Find your next event <span>↗</span></a>
        </header>

        {/* Hero */}
        <section className="pg-hero">
          <div className="pg-eyebrow">
            <span className="pg-pulse" />
            BIG IDEAS. REAL CONNECTIONS.
          </div>
          <h1 className="pg-h1">
            Stay curious.<br />
            <em>Get together.</em>
          </h1>
          <p className="pg-desc">
            Learn something new. Share what you know. Meet the people behind the next big thing.
          </p>
          <a className="pg-primary" href="#discover">
            Find your next moment <span>↗</span>
          </a>

          {/* Floating posters */}
          <div className="pg-visual">
            <div className="pg-poster pg-poster-one">
              <img src="/assets/photo1.jpg" alt="Conference audience and speakers" />
              <div className="pg-poster-text">
                <small>THINK WHAT'S NEXT</small>
                <strong>{'FUTURE\nBUILDERS\nUNITE.'}</strong>
                <span>TECH / CONFERENCES</span>
              </div>
            </div>
            <div className="pg-poster pg-poster-two">
              <img src="/assets/photo2.jpg" alt="Participants at a technology workshop" />
              <div className="pg-poster-text">
                <small>FIND YOUR PEOPLE</small>
                <strong>{'LESS TALK.\nMORE\nBUILD.'}</strong>
                <span>HANDS-ON / WORKSHOPS</span>
              </div>
            </div>
            <div className="pg-poster pg-poster-three">
              <img src="/assets/photo3.jpg" alt="Technology community networking" />
              <div className="pg-poster-text">
                <small>MAKE A CONNECTION</small>
                <strong>{'MEET.\nSHARE.\nGROW.'}</strong>
                <span>PEOPLE / COMMUNITY</span>
              </div>
            </div>
            <div className="pg-stamp">
              YOU HAD<br />TO BE<br /><b>THERE ↗</b>
            </div>
          </div>

          <div className="pg-hero-bottom">
            <span>YOUR NEXT BIG IDEA STARTS IN THE ROOM.</span>
            <a href="#discover">EXPLORE WHAT'S ON ↓</a>
            <span>ACCRA & BEYOND</span>
          </div>
        </section>

        {/* Ticker */}
        <div className="pg-ticker" aria-hidden="true">
          <div className="pg-ticker-inner">
            BE THERE ✳ BUILD WHAT'S NEXT ✳ FIND YOUR PEOPLE ✳ SHARE BIG IDEAS ✳ BE THERE ✳ BUILD WHAT'S NEXT ✳ FIND YOUR PEOPLE ✳ SHARE BIG IDEAS ✳&nbsp;
          </div>
        </div>

        {/* Discovery */}
        <section className="pg-discovery" id="discover">
          <div className="pg-section-top">
            <div>
              <span className="pg-eyebrow">FIND YOUR NEXT CONNECTION</span>
              <h2>Find your<br /><em>next spark.</em></h2>
            </div>
            <div className="pg-disc-intro">
              <p>Fresh ideas. Hands-on learning.<br />People worth meeting.</p>
            </div>
          </div>

          {/* Category pills */}
          <div className="pg-cats">
            {WHEEL_EVENTS.map((e, i) => (
              <button
                key={e.id}
                className={i === activeIdx ? 'active' : ''}
                onClick={() => select(i, true)}
              >
                {e.category}
              </button>
            ))}
          </div>

          {/* Wheel */}
          <div className="pg-wheel">
            {WHEEL_EVENTS.map((e, i) => {
              let offset = (i - activeIdx + WHEEL_EVENTS.length) % WHEEL_EVENTS.length;
              if (offset > 2) offset -= WHEEL_EVENTS.length;
              const angle = offset * 26;
              const isActive = offset === 0;
              return (
                <div
                  key={e.id}
                  className="pg-wheel-card"
                  style={{
                    transform: `translateX(-50%) rotate(${angle}deg) scale(${isActive ? 1 : 0.9})`,
                    opacity: isActive ? 1 : 0.66,
                    zIndex: 5 - Math.abs(offset),
                  }}
                  onClick={() => select(i, true)}
                >
                  <img src={`/assets/photo${e.photo}.jpg`} alt={e.name} />
                  <div className="pg-card-content">
                    <small>{e.label}</small>
                    <strong>{e.short}</strong>
                  </div>
                </div>
              );
            })}
            <div className="pg-wheel-center">
              <span className="pg-wheel-caption">UP NEXT</span>
              <h3>{ev.name}</h3>
              <a className="pg-wheel-link" href={`/events/${ev.id}`}>View event ↗</a>
            </div>
          </div>

          <div className="pg-wheel-controls">
            <button onClick={() => select(activeIdx - 1, true)} aria-label="Previous">←</button>
            <span className="pg-wheel-count">0{activeIdx + 1} / 05</span>
            <button onClick={() => select(activeIdx + 1, true)} aria-label="Next">→</button>
          </div>

          <div className="pg-view-all">
            <a className="pg-primary" href="/events">View all events <span>↗</span></a>
          </div>
          <p className="pg-sample-note">Sample events for this design preview · Dates, prices, and programmes are illustrative.</p>
        </section>

        {/* Organisers */}
        <section className="pg-organisers">
          <div>
            <span className="pg-eyebrow">BRINGING YOUR COMMUNITY TOGETHER?</span>
            <h2>You bring the event.<br />We'll bring the tickets.</h2>
          </div>
          <div>
            <p>Create your event. Sell tickets.<br />Welcome your people.</p>
            <a className="pg-org-cta" href="https://www.gettikiti.com/register" target="_blank" rel="noopener">
              Create an event <span>↗</span>
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer className="pg-footer">
          <a className="pg-logo" href="#">tikiti<span style={{ color: 'var(--pg-accent)', fontSize: 26 }}>✳</span></a>
          <span>Good ideas start with people.</span>
          <a href="https://gettikiti.com" target="_blank" rel="noopener">Visit Tikiti ↗</a>
          <span>© 2026 Tikiti</span>
        </footer>
      </div>
    </>
  );
}
