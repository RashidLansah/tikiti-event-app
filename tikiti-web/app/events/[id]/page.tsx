'use client';

import { useState, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { techEvents } from '@/data/techEvents';

const PG = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@600;700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  :root {
    --bg: #faf9f2; --fg: #202220; --accent: #f44929;
    --muted: #65675d; --line: rgba(32,34,32,0.13);
    --display: 'Barlow Condensed', 'Arial Narrow', Impact, sans-serif;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html { scroll-behavior: smooth; scroll-padding-top: 90px; }
  body { background: var(--bg); color: var(--fg); overflow-x: clip; }
  a { color: inherit; text-decoration: none; }
  button { font: inherit; cursor: pointer; }
  button:focus-visible, a:focus-visible { outline: 3px solid #ff7e47; outline-offset: 5px; }

  /* Header */
  .pg-header {
    background: #f5ee3d; height: 80px; padding: 0 5%;
    display: flex; align-items: center; justify-content: space-between;
    position: sticky; top: 0; z-index: 100;
  }
  .pg-logo { font-size: 38px; font-weight: 700; letter-spacing: -3px; display: inline-flex; align-items: center; gap: 4px; }
  .pg-logo span { font-size: 26px; color: var(--accent); letter-spacing: 0; }
  .pg-nav { display: flex; gap: 28px; font-size: 14px; align-items: center; }
  .pg-nav-cta { border: 1px solid var(--line); padding: 11px 18px; border-radius: 30px; font-size: 13px; }

  /* Main */
  .detail-main { max-width: 1440px; margin: 0 auto; padding: 30px 5% 75px; }
  .back-link { display: inline-block; font-size: 14px; color: var(--muted); margin: 4px 0 32px; }

  /* Hero grid */
  .event-hero { display: grid; grid-template-columns: 1fr 1fr; gap: 6%; align-items: center; overflow: visible; }
  .event-art { height: 510px; position: relative; overflow: hidden; border-radius: 0; background: #333; transform: rotate(-2deg); box-shadow: 10px 10px 0 #f5ee3d; }
  .event-art img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.6); animation: cinema 20s alternate infinite ease-in-out; }
  @keyframes cinema { from { transform: scale(1); } to { transform: scale(1.06); } }
  .event-art-copy { position: absolute; inset: 30px; display: flex; flex-direction: column; justify-content: space-between; color: #fff; }
  .event-art-copy > span:first-child { font-size: 12px; letter-spacing: 2px; }
  .event-art-copy > strong { font-family: var(--display); font-size: clamp(60px, 6vw, 105px); font-weight: 800; line-height: 0.88; letter-spacing: -1px; color: #f5ee3d; white-space: pre-line; }
  .art-bottom { display: flex; align-items: center; justify-content: space-between; font-size: 12px; letter-spacing: 2px; line-height: 1.3; }
  .art-bottom b { font-size: 65px; font-weight: 400; font-family: 'DM Sans', sans-serif; }

  /* Overview */
  .eyebrow { font-size: 12px; letter-spacing: 1.7px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .event-overview h1 { font-family: var(--display); font-size: 60px; font-weight: 700; line-height: 0.98; margin: 20px 0; letter-spacing: -1px; text-transform: uppercase; }
  .event-intro { font-size: 19px; line-height: 1.5; color: var(--muted); }
  .event-facts { border-top: 1px solid var(--line); display: grid; gap: 22px; padding: 22px 0; margin-top: 28px; }
  .event-facts span { font-size: 11px; letter-spacing: 1.5px; display: block; color: var(--muted); margin-bottom: 8px; }
  .event-facts strong { font-weight: 500; font-size: 16px; }
  .event-facts p { color: var(--muted); font-size: 14px; margin: 5px 0; }
  .host-line { display: flex; align-items: center; gap: 12px; font-size: 13px; line-height: 1.6; border-top: 1px solid var(--line); padding-top: 22px; margin-top: 6px; }
  .host-avatar { background: var(--accent); color: #151515; border-radius: 50%; width: 44px; height: 44px; display: grid; place-items: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }

  /* Body */
  .event-body { display: grid; grid-template-columns: minmax(0, 1fr) 350px; gap: 7%; margin-top: 58px; align-items: start; }
  .detail-nav { display: flex; gap: 24px; border-bottom: 1px solid var(--line); padding-bottom: 20px; font-size: 14px; overflow-x: auto; margin-bottom: 4px; }
  .detail-nav a { color: var(--muted); padding-bottom: 20px; border-bottom: 2px solid transparent; margin-bottom: -21px; white-space: nowrap; transition: color 0.15s; }
  .detail-nav a:hover { color: var(--fg); }
  .event-editorial section { padding: 40px 0; border-bottom: 1px solid var(--line); scroll-margin-top: 20px; }
  .event-editorial h2 { font-family: var(--display); font-size: 42px; font-weight: 600; letter-spacing: -0.5px; margin: 16px 0 20px; line-height: 1.08; color: #6256e8; }
  .event-editorial p { font-size: 16px; color: var(--muted); line-height: 1.75; }
  .event-editorial p + p { margin-top: 14px; }

  /* Agenda */
  .agenda-row { display: grid; grid-template-columns: 75px 1fr; gap: 18px; padding: 23px 0; border-bottom: 1px solid var(--line); }
  .agenda-row:last-child { border: 0; }
  .agenda-row time { font-size: 16px; color: #6256e8; font-weight: 600; padding-top: 2px; font-variant-numeric: tabular-nums; }
  .agenda-row h3 { font-size: 17px; margin: 0; font-weight: 500; }
  .agenda-row p { margin: 6px 0 0; font-size: 14px; color: var(--muted); }

  /* Speakers placeholder */
  .speaker-placeholder { display: flex; gap: 20px; align-items: center; border: 1px solid var(--line); padding: 24px; border-radius: 8px; margin-top: 16px; }
  .speaker-placeholder > span { font-size: 45px; color: var(--accent); }
  .speaker-placeholder strong { font-size: 16px; font-weight: 500; }
  .speaker-placeholder p { margin: 8px 0 0; font-size: 14px; color: var(--muted); }

  /* FAQ */
  details { border-bottom: 1px solid var(--line); padding: 16px 0; }
  details:last-child { border: 0; }
  summary { font-size: 15px; font-weight: 500; cursor: pointer; list-style: none; display: flex; justify-content: space-between; }
  summary::after { content: '+'; font-size: 20px; color: var(--accent); }
  details[open] summary::after { content: '−'; }
  details p { font-size: 14px; color: var(--muted); line-height: 1.7; margin-top: 12px; }

  /* Ticket panel */
  .ticket-panel { position: sticky; top: 100px; border: 1px solid var(--line); padding: 28px; border-radius: 12px; background: #202220; color: #fff; }
  .ticket-heading .eyebrow { font-size: 10px; color: rgba(255,255,255,0.45); letter-spacing: 2px; margin-bottom: 10px; }
  .ticket-panel h2 { font-family: var(--display); font-size: 35px; font-weight: 700; line-height: 1; }
  .ticket-panel fieldset { border: 0; padding: 0; margin: 28px 0 20px; }
  .ticket-panel legend { font-size: 13px; margin-bottom: 13px; color: rgba(255,255,255,0.7); }
  .ticket-option { display: flex; align-items: flex-start; gap: 10px; border: 1px solid var(--accent); padding: 16px; border-radius: 7px; cursor: pointer; }
  .ticket-option input { accent-color: var(--accent); margin: 4px 0; flex-shrink: 0; }
  .ticket-option strong { display: block; font-size: 14px; }
  .ticket-option small { display: block; font-size: 12px; line-height: 1.5; color: rgba(255,255,255,0.5); margin-top: 5px; }
  .ticket-option b { white-space: nowrap; font-size: 13px; margin-left: auto; }
  .quantity-row, .total-row { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
  .quantity-row { color: rgba(255,255,255,0.7); }
  .quantity-row select { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 10px 12px; border-radius: 6px; font: inherit; }
  .total-row { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 22px; padding: 20px 0; }
  .total-row strong { font-size: 22px; }
  .reserve { width: 100%; height: 52px; background: var(--accent); color: #fff; border: 0; border-radius: 40px; font: 700 15px 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; transition: transform 0.2s; }
  .reserve:hover { transform: translateY(-2px); }
  .ticket-note { font-size: 11px; text-align: center; color: rgba(255,255,255,0.35); margin-top: 14px; }
  .ticket-bottom { border-top: 1px dashed rgba(255,255,255,0.12); margin: 25px -28px -6px; padding: 23px 28px 0; font-size: 12px; text-align: center; color: rgba(255,255,255,0.35); line-height: 1.6; }

  /* Bottom CTA */
  .all-bottom { display: flex; justify-content: space-between; font-family: var(--display); font-size: 45px; font-weight: 600; border-bottom: 1px solid var(--line); border-top: 1px solid var(--line); padding: 28px 0; margin-top: 60px; }
  .all-bottom:hover { color: var(--accent); }

  /* Mobile ticket bar */
  .mobile-ticket { display: none; }

  @media (max-width: 900px) {
    .event-hero { grid-template-columns: 1fr; }
    .event-art { height: 340px; }
    .event-body { grid-template-columns: 1fr; }
    .ticket-panel { position: static; }
    .mobile-ticket { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: #202220; color: #fff; padding: 16px 24px; align-items: center; justify-content: space-between; z-index: 200; border-top: 1px solid rgba(255,255,255,0.1); }
    .mobile-ticket span { font-size: 20px; font-weight: 700; }
    .mobile-ticket a { background: var(--accent); color: #fff; border-radius: 30px; padding: 12px 22px; font-size: 14px; font-weight: 700; }
  }
`;

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const ev = techEvents.find(e => e.id === id);
  if (!ev) notFound();

  const [qty, setQty] = useState(1);
  const total = ev.price * qty;

  return (
    <>
      <style>{PG}</style>

      <header className="pg-header">
        <Link href="/" className="pg-logo">tikiti<span>✳</span></Link>
        <nav className="pg-nav">
          <Link href="/events">Discover events</Link>
          <Link href="/organisers">For organisers ↗</Link>
          <Link href="/events" className="pg-nav-cta">All events ↗</Link>
        </nav>
      </header>

      <main className="detail-main">
        <Link href="/events" className="back-link">← Back to events</Link>

        {/* Hero */}
        <section className="event-hero">
          <div className="event-art">
            <img src={`/assets/photo${ev.photo}.jpg`} alt={ev.name} />
            <div className="event-art-copy">
              <span>{ev.tag}</span>
              <strong style={{ whiteSpace: 'pre-line' }}>{ev.short}</strong>
              <div className="art-bottom">
                <span>IDEAS ARE BETTER<br />WHEN WE&apos;RE TOGETHER.</span>
                <b>↗</b>
              </div>
            </div>
          </div>

          <div className="event-overview">
            <span className="eyebrow">{ev.label}</span>
            <h1>{ev.name}</h1>
            <p className="event-intro">{ev.intro}</p>
            <div className="event-facts">
              <div>
                <span>WHEN</span>
                <strong>{ev.date}</strong>
                <p>{ev.time}</p>
              </div>
              <div>
                <span>WHERE</span>
                <strong>{ev.venue}</strong>
                <p>In person</p>
              </div>
            </div>
            <div className="host-line">
              <span className="host-avatar">TB</span>
              <span>Hosted by<br /><b>Tikiti Builders Community</b></span>
            </div>
          </div>
        </section>

        {/* Body */}
        <div className="event-body">
          <div className="event-editorial">
            <nav className="detail-nav">
              <a href="#about">Overview</a>
              <a href="#agenda">Agenda</a>
              <a href="#speakers">Speakers</a>
              <a href="#know">Good to know</a>
            </nav>

            <section id="about">
              <span className="eyebrow">THE IDEA</span>
              <h2>Be part of the conversation.</h2>
              <p>{ev.about}</p>
              <p>{ev.audience}</p>
            </section>

            {ev.agenda && ev.agenda.length > 0 && (
              <section id="agenda">
                <span className="eyebrow">YOUR DAY, AT A GLANCE</span>
                <h2>The programme.</h2>
                {ev.agenda.map(([time, title, desc]) => (
                  <div key={time} className="agenda-row">
                    <time>{time}</time>
                    <div>
                      <h3>{title}</h3>
                      <p>{desc}</p>
                    </div>
                  </div>
                ))}
              </section>
            )}

            <section id="speakers">
              <span className="eyebrow">PEOPLE BEHIND THE IDEAS</span>
              <h2>Speakers &amp; facilitators.</h2>
              <p>The speaker lineup will be announced here.</p>
              <div className="speaker-placeholder">
                <span>↗</span>
                <div>
                  <strong>Fresh perspectives. Practical experience.</strong>
                  <p>Hear from the people doing the work.</p>
                </div>
              </div>
            </section>

            <section id="know">
              <span className="eyebrow">BEFORE YOU COME</span>
              <h2>A few useful details.</h2>
              <details>
                <summary>What should I bring?</summary>
                <p>Bring your ticket confirmation. For a hands-on workshop, bring a charged laptop and your charger.</p>
              </details>
              <details>
                <summary>Where can I find venue and access details?</summary>
                <p>The confirmed venue, directions, and accessibility information will appear here before the event.</p>
              </details>
              <details>
                <summary>Is there a refund policy?</summary>
                <p>Refunds are available up to 7 days before the event. After that, tickets can be transferred to another attendee.</p>
              </details>
            </section>
          </div>

          {/* Ticket panel */}
          <aside id="tickets" style={{ position: 'sticky', top: 100, padding: 28, borderRadius: 0, background: '#f5ee3d', color: '#202220', border: '2px solid #202220', boxShadow: '7px 7px 0 #202220' }}>
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 10, letterSpacing: 2, color: 'rgba(32,34,32,0.5)', marginBottom: 10 }}>YOUR SEAT IN THE ROOM</div>
              <h2 style={{ fontFamily: "'Barlow Condensed', Impact, sans-serif", fontSize: 35, fontWeight: 700, lineHeight: 1, color: '#202220' }}>Make it a plan.</h2>
            </div>

            <fieldset style={{ border: 0, padding: 0, margin: '28px 0 20px' }}>
              <legend style={{ fontSize: 13, marginBottom: 13, color: '#65675d' }}>Choose your ticket</legend>
              <label style={{ display: 'flex', alignItems: 'flex-start', gap: 10, border: '1px solid #202220', padding: 16, borderRadius: 0, cursor: 'pointer', background: 'rgba(255,255,255,0.6)' }}>
                <input type="radio" name="ticket" value="general" defaultChecked style={{ accentColor: '#f44929', marginTop: 4, flexShrink: 0 }} />
                <span style={{ flex: 1 }}>
                  <strong style={{ display: 'block', fontSize: 14, color: '#202220' }}>General admission</strong>
                  <small style={{ display: 'block', fontSize: 12, lineHeight: 1.5, color: '#65675d', marginTop: 5 }}>Access to all scheduled sessions</small>
                </span>
                <b style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#202220' }}>{ev.price === 0 ? 'Free' : `₵${ev.price}`}</b>
              </label>
            </fieldset>

            {ev.price > 0 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: '#65675d', marginBottom: 16 }}>
                <label htmlFor="qty">Tickets</label>
                <select id="qty" value={qty} onChange={e => setQty(Number(e.target.value))} style={{ background: '#fff', color: '#202220', border: '1px solid #202220', padding: '10px 12px', borderRadius: 4, font: 'inherit' }}>
                  {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} ticket{n > 1 ? 's' : ''}</option>)}
                </select>
              </div>
            )}

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid rgba(32,34,32,0.15)', marginTop: 22, padding: '20px 0', color: '#202220' }}>
              <span>Total</span>
              <strong style={{ fontSize: 22, color: '#202220' }}>{ev.price === 0 ? 'Free' : `₵${total}`}</strong>
            </div>

            <Link href="/register">
              <button style={{ width: '100%', height: 52, background: '#f44929', color: '#fff', border: 0, borderRadius: 40, font: "700 15px 'DM Sans', sans-serif", display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 20px', cursor: 'pointer', transition: 'transform 0.2s' }}>
                <span>{ev.price === 0 ? 'Register free' : 'Get tickets'}</span>
                <span>↗</span>
              </button>
            </Link>

            <p style={{ fontSize: 11, textAlign: 'center', color: 'rgba(32,34,32,0.45)', marginTop: 14 }}>{ev.price > 0 ? 'Secure payment via Paystack · Instant confirmation' : 'No payment required'}</p>
            <div style={{ borderTop: '1px dashed rgba(32,34,32,0.2)', margin: '25px -28px -6px', padding: '23px 28px 0', fontSize: 12, textAlign: 'center', color: 'rgba(32,34,32,0.45)', lineHeight: 1.6 }}>Your next connection starts here.</div>
          </aside>
        </div>

        <Link href="/events" className="all-bottom">
          <span>Find your next event</span>
          <span>↗</span>
        </Link>
      </main>

      <footer style={{ margin: '0 5%', padding: '25px 0 36px', borderTop: '1px solid rgba(32,34,32,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#65675d', flexWrap: 'wrap', gap: 12 }}>
        <Link href="/" className="pg-logo" style={{ fontSize: 28, letterSpacing: -2 }}>tikiti<span style={{ fontSize: 20 }}>✳</span></Link>
        <span>Good ideas start with people.</span>
        <span>© 2026 Tikiti</span>
      </footer>

      {/* Mobile sticky bar */}
      <div className="mobile-ticket">
        <span>{ev.price === 0 ? 'Free' : `₵${ev.price}`}</span>
        <a href="#tickets">Choose ticket ↗</a>
      </div>
    </>
  );
}
