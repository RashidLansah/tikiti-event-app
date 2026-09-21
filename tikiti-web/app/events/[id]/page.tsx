'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import ShareButton from '@/components/events/ShareButton';
import TrackView from '@/components/events/TrackView';
import Arrow from '@/components/ui/Arrow';
import PublicHeader from '@/components/layout/PublicHeader';
import { trackEvent, isExternalEvent, interestedLabel } from '@/lib/events/track';
import { eventCta, platformFromUrl, platformLabel, type CtaAction } from '@/lib/events/links';
import { displayPhone, normaliseContacts, telLink, waLink, canWhatsApp } from '@/lib/events/contact';

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

  /* Wordmark (footer) */
  .pg-logo { font-size: 38px; font-weight: 700; letter-spacing: -3px; display: inline-flex; align-items: center; gap: 4px; }
  .pg-logo span { font-size: 26px; color: var(--accent); letter-spacing: 0; }

  /* Main */
  .detail-main { max-width: 1440px; margin: 0 auto; padding: 30px 5% 75px; }
  .back-link { display: inline-block; font-size: 14px; color: var(--muted); margin: 4px 0 32px; }

  /* Loading / skeleton */
  .skeleton-block { background: linear-gradient(90deg, #e8e8e0 25%, #f0f0e8 50%, #e8e8e0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; border-radius: 6px; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

  /* Hero grid */
  .event-hero { display: grid; grid-template-columns: 1fr 1fr; column-gap: 6%; row-gap: 40px; align-items: center; overflow: visible; }
  .event-art { height: 510px; position: relative; overflow: hidden; border-radius: 0; background: #333; transform: rotate(-2deg); box-shadow: 10px 10px 0 #f5ee3d; }
  .event-art img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.6); animation: cinema 20s alternate infinite ease-in-out; }
  @keyframes cinema { from { transform: scale(1); } to { transform: scale(1.06); } }
  .event-art-copy { position: absolute; inset: 30px; display: flex; flex-direction: column; justify-content: space-between; color: #fff; overflow: hidden; }
  .event-art-copy > span:first-child { font-size: 12px; letter-spacing: 2px; }
  .event-art-copy > strong { font-family: var(--display); font-size: clamp(60px, 6vw, 105px); font-weight: 800; line-height: 0.88; letter-spacing: -1px; color: #f5ee3d; white-space: pre-line; }
  .art-bottom { display: flex; align-items: center; justify-content: space-between; font-size: 12px; letter-spacing: 2px; line-height: 1.3; }
  .art-bottom b { font-size: 65px; font-weight: 400; font-family: 'DM Sans', sans-serif; }

  /* Overview */
  .eyebrow { font-size: 12px; letter-spacing: 1.7px; font-weight: 600; display: flex; align-items: center; gap: 8px; }
  .event-overview h1 { font-family: var(--display); font-size: clamp(40px, 5vw, 60px); overflow-wrap: anywhere; font-weight: 700; line-height: 0.98; margin: 20px 0; letter-spacing: -1px; text-transform: uppercase; }
  .event-intro { font-size: 19px; line-height: 1.5; color: var(--muted); }
  .event-facts { border-top: 1px solid var(--line); display: grid; gap: 22px; padding: 22px 0; margin-top: 28px; }
  .event-facts span { font-size: 11px; letter-spacing: 1.5px; display: block; color: var(--muted); margin-bottom: 8px; }
  .event-facts strong { font-weight: 500; font-size: 16px; }
  .event-facts p { color: var(--muted); font-size: 14px; margin: 5px 0; }
  .contact-row { display: flex; align-items: center; justify-content: space-between; gap: 10px; flex-wrap: wrap; padding: 4px 0; }
  .contact-row + .contact-row { margin-top: 6px; }
  .contact-pills { display: flex; gap: 8px; }
  .contact-pill { display: inline-flex; align-items: center; gap: 6px; border: 1px solid var(--fg); border-radius: 30px; padding: 7px 13px; font-size: 12px; font-weight: 700; min-height: 34px; background: #fffef9; transition: background 0.15s, color 0.15s; }
  .contact-pill:hover { background: var(--fg); color: #fff; }
  .contact-pill.wa { border-color: #128c4a; color: #0d6b38; }
  .contact-pill.wa:hover { background: #128c4a; color: #fff; }
  .host-line { display: flex; align-items: center; gap: 12px; font-size: 13px; line-height: 1.6; border-top: 1px solid var(--line); padding-top: 22px; margin-top: 6px; }
  .host-avatar { background: var(--accent); color: #151515; border-radius: 50%; width: 44px; height: 44px; display: grid; place-items: center; font-size: 14px; font-weight: 700; flex-shrink: 0; }

  /* Body */
  .event-body { display: grid; grid-template-columns: minmax(0, 1fr) 350px; column-gap: 7%; row-gap: 40px; margin-top: 58px; align-items: start; }
  .detail-nav { display: flex; gap: 24px; border-bottom: 1px solid var(--line); padding-bottom: 20px; font-size: 14px; overflow-x: auto; margin-bottom: 4px; }
  .detail-nav a { color: var(--muted); padding-bottom: 20px; border-bottom: 2px solid transparent; margin-bottom: -21px; white-space: nowrap; transition: color 0.15s; }
  .detail-nav a:hover { color: var(--fg); }
  .event-editorial section { padding: 40px 0; border-bottom: 1px solid var(--line); scroll-margin-top: 20px; }
  .event-editorial h2 { font-family: var(--display); font-size: 42px; font-weight: 600; letter-spacing: -0.5px; margin: 16px 0 20px; line-height: 1.08; color: #6256e8; }
  .event-editorial p { font-size: 16px; color: var(--muted); line-height: 1.75; overflow-wrap: anywhere; }
  .event-editorial { min-width: 0; }
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
  .ticket-heading .eyebrow { font-size: 10px; color: rgba(255,255,255,0.45); letter-spacing: 2px; margin-bottom: 10px; }
  .ticket-panel h2 { font-family: var(--display); font-size: 35px; font-weight: 700; line-height: 1; }
  .ticket-panel fieldset { border: 0; padding: 0; margin: 28px 0 20px; }
  .ticket-panel legend { font-size: 13px; margin-bottom: 13px; color: rgba(255,255,255,0.7); }
  .quantity-row, .total-row { display: flex; align-items: center; justify-content: space-between; font-size: 14px; }
  .quantity-row { color: rgba(255,255,255,0.7); }
  .quantity-row select { background: rgba(255,255,255,0.1); color: #fff; border: 1px solid rgba(255,255,255,0.2); padding: 10px 12px; border-radius: 6px; font: inherit; }
  .total-row { border-top: 1px solid rgba(255,255,255,0.1); margin-top: 22px; padding: 20px 0; }
  .total-row strong { font-size: 22px; }

  /* Bottom CTA */
  .all-bottom { display: flex; justify-content: space-between; align-items: center; gap: 16px; font-family: var(--display); font-size: clamp(30px, 6vw, 45px); font-weight: 600; border-bottom: 1px solid var(--line); border-top: 1px solid var(--line); padding: 28px 0; margin-top: 60px; }
  .all-bottom:hover { color: var(--accent); }

  /* Mobile ticket bar */
  .mobile-ticket { display: none; }

  .mobile-ticket a { display: inline-flex; align-items: center; gap: 8px; white-space: nowrap; }
  .ticket-cta { width: 100%; height: 52px; background: var(--accent); color: #fff; border: 0; border-radius: 40px; font: 700 15px 'DM Sans', sans-serif; display: flex; align-items: center; justify-content: space-between; padding: 0 20px; cursor: pointer; transition: transform 0.2s; }
  .ticket-panel { position: sticky; top: 100px; padding: 28px; background: #f5ee3d; color: #202220; border: 2px solid #202220; box-shadow: 7px 7px 0 #202220; }

  @media (max-width: 900px) {
    .event-hero { grid-template-columns: 1fr; row-gap: 32px; }
    .event-art { height: 340px; margin: 0 8px 0 4px; }
    .event-art-copy { inset: 20px; }
    .event-art-copy > strong { font-size: clamp(34px, 9vw, 60px); }
    .art-bottom b { font-size: 40px; }
    .event-overview h1 { font-size: clamp(36px, 9vw, 52px); }
    .event-intro { font-size: 17px; }
    .event-body { grid-template-columns: minmax(0, 1fr); margin-top: 40px; }
    .event-editorial, .event-overview { min-width: 0; }
    .event-editorial p, .agenda-row h3, .agenda-row p, .event-facts strong { overflow-wrap: anywhere; }
    .event-editorial h2 { font-size: clamp(30px, 8vw, 42px); }
    .ticket-panel { position: static; top: auto; box-shadow: 5px 5px 0 #202220; }
    .detail-main { padding-bottom: 120px; }
    .mobile-ticket { display: flex; position: fixed; bottom: 0; left: 0; right: 0; background: #202220; color: #fff; padding: 14px 20px; padding-bottom: calc(14px + env(safe-area-inset-bottom)); align-items: center; justify-content: space-between; gap: 12px; z-index: 200; border-top: 1px solid rgba(255,255,255,0.1); }
    .mobile-ticket span { font-size: 20px; font-weight: 700; }
    .mobile-ticket a { background: var(--accent); color: #fff; border-radius: 30px; padding: 12px 22px; font-size: 14px; font-weight: 700; min-height: 44px; }
  }
  @media (max-width: 768px) {
    .pg-logo { font-size: 28px; letter-spacing: -2px; }
    .pg-logo span { font-size: 20px; }
    .detail-main { padding-top: 20px; }
    .back-link { margin-bottom: 20px; min-height: 40px; display: inline-flex; align-items: center; }
  }
`;

interface AgendaItem {
  time?: string;
  startTime?: string;
  title?: string;
  name?: string;
  description?: string;
  desc?: string;
}

interface FirestoreEventDetail {
  name: string;
  category: string;
  description: string;
  location: string;
  address?: string;
  date: string;
  time: string;
  endDate?: string;
  type: string;
  ticketPrice?: number;
  price?: number;
  coverImage?: string;
  imageUrl?: string;
  source?: string;
  speakers?: Array<{ name: string; title?: string; company?: string; role?: string; photo?: string }>;
  registrationUrl?: string;
  meetingLink?: string;
  meetingPlatform?: string;
  meetingDetails?: string;
  startTime?: string;
  endTime?: string;
  ticketingDisabled?: boolean;
  status: string;
  organizerName?: string;
  program?: { sessions?: AgendaItem[] };
  agenda?: AgendaItem[];
  venueType?: string;
  isScraped?: boolean;
  contacts?: Array<{ name?: string; phone: string; whatsapp?: boolean }>;
  registrationMethod?: string;
  stats?: { views?: number; registerClicks?: number; contactClicks?: number };
}

function WhatsAppIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.45 1.32 4.95L2.05 22l5.25-1.38a9.9 9.9 0 0 0 4.74 1.21h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2zm0 1.67c2.2 0 4.26.86 5.82 2.42a8.2 8.2 0 0 1 2.41 5.83c0 4.54-3.7 8.23-8.24 8.23a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.2 8.2 0 0 1-1.26-4.38c0-4.54 3.7-8.24 8.25-8.24zM8.53 7.33c-.16 0-.43.06-.66.31-.22.25-.87.85-.87 2.07 0 1.22.89 2.4 1.01 2.56.12.17 1.75 2.67 4.23 3.74.59.26 1.05.41 1.41.52.59.19 1.13.16 1.56.1.48-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.07-.1-.23-.16-.48-.29-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.81-.78.97-.15.17-.29.19-.54.06-.25-.12-1.05-.39-1.99-1.23-.74-.66-1.23-1.47-1.38-1.72-.14-.25-.01-.38.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.42.08-.16.04-.31-.02-.43-.06-.13-.56-1.35-.77-1.85-.2-.48-.41-.42-.56-.43-.14-.01-.31-.01-.47-.01z" />
    </svg>
  );
}

function PhoneIcon({ size = 14 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false" style={{ flexShrink: 0 }}>
      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.8 19.8 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92z" />
    </svg>
  );
}

function formatDateLong(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getShortName(name: string): string {
  const words = name.toUpperCase().split(' ');
  if (words.length <= 2) return words.join('\n');
  const mid = Math.ceil(words.length / 2);
  return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
}

function getAgenda(ev: FirestoreEventDetail): AgendaItem[] {
  if (ev.agenda && Array.isArray(ev.agenda) && ev.agenda.length > 0) return ev.agenda;
  if (ev.program?.sessions && ev.program.sessions.length > 0) return ev.program.sessions;
  return [];
}

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [ev, setEv] = useState<FirestoreEventDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [missing, setMissing] = useState(false);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    async function fetchEvent() {
      try {
        const snap = await getDoc(doc(db, 'events', id));
        if (!snap.exists()) {
          setMissing(true);
        } else {
          setEv(snap.data() as FirestoreEventDetail);
        }
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setMissing(true);
      } finally {
        setLoading(false);
      }
    }
    fetchEvent();
  }, [id]);

  if (missing) {
    notFound();
  }

  const price = ev ? (ev.type === 'free' ? 0 : (ev.ticketPrice ?? ev.price ?? 0)) : 0;
  const total = price * qty;
  const agenda = ev ? getAgenda(ev) : [];
  const imgSrc = ev ? (ev.coverImage || ev.imageUrl || '') : '';
  const shortName = ev ? getShortName(ev.name) : '';
  const category = ev?.category ?? '';
  const intro = ev ? (ev.description?.split('\n')[0] ?? '') : '';
  const external = ev ? isExternalEvent(ev) : false;
  const interested = external ? interestedLabel(ev?.stats) : null;
  // Organiser numbers from the flyer/caption only (events.contacts) — never the submitter's number.
  const contacts = ev ? normaliseContacts(ev.contacts) : [];
  const cta = ev ? eventCta({ ...ev, contacts }) : null;
  const isContactHref = (href?: string) => !!href && (href.startsWith('tel:') || href.startsWith('https://wa.me/'));
  const calendarHref = `/api/events/${id}/calendar`;
  const isVirtual = ev ? ev.venueType === 'virtual' || (!!ev.meetingLink && ev.venueType !== 'hybrid' && ev.venueType !== 'in_person') : false;
  const platform = ev ? platformLabel(ev.meetingPlatform || (ev.meetingLink ? platformFromUrl(ev.meetingLink) : null)) : '';
  /** Resolves a CTA action to anchor props; register + join clicks are tracked. */
  const ctaLink = (a: CtaAction) => {
    if (a.action === 'calendar') return { href: calendarHref };
    if (!a.href) return { href: '#tickets' };
    if (a.href.startsWith('tel:')) return { href: a.href, onClick: () => trackEvent(id, 'contact_click') };
    if (isContactHref(a.href)) return { href: a.href, target: '_blank', rel: 'noopener noreferrer', onClick: () => trackEvent(id, 'contact_click') };
    return { href: a.href, target: '_blank', rel: 'noopener noreferrer', onClick: () => trackEvent(id, 'register_click') };
  };

  return (
    <>
      <style>{PG}</style>

      <PublicHeader cta={{ label: 'All events', href: '/events' }} />

      <main className="detail-main">
        <Link href="/events" className="back-link"><Arrow dir="left" size={13} /> Back to events</Link>

        {loading ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div className="skeleton-block" style={{ height: 510, width: '100%' }} />
            <div className="skeleton-block" style={{ height: 32, width: '60%' }} />
            <div className="skeleton-block" style={{ height: 20, width: '40%' }} />
          </div>
        ) : ev ? (
          <>
            <TrackView eventId={id} />
            {/* Hero */}
            <section className="event-hero">
              <div className="event-art">
                {imgSrc ? (
                  <img src={imgSrc} alt={ev.name} />
                ) : (
                  <div style={{ width: '100%', height: '100%', background: '#2a2a2a' }} />
                )}
                {ev.source !== 'community' && (
                <div className="event-art-copy">
                  <span>{category.toUpperCase()}</span>
                  <strong style={{ whiteSpace: 'pre-line' }}>{shortName}</strong>
                  <div className="art-bottom">
                    <span>IDEAS ARE BETTER<br />WHEN WE&apos;RE TOGETHER.</span>
                    <b><Arrow dir="ne" size={56} strokeWidth={1.5} /></b>
                  </div>
                </div>
                )}
              </div>

              <div className="event-overview">
                <span className="eyebrow">{category.toUpperCase()} · {(ev.location ?? 'ACCRA').toUpperCase()}</span>
                <h1>{ev.name}</h1>
                <p className="event-intro">{intro}</p>
                <div className="event-facts">
                  <div>
                    <span>WHEN</span>
                    <strong>{formatDateLong(ev.date)}</strong>
                    <p>{ev.time}{ev.endDate && ev.endDate !== ev.date ? ` – ends ${formatDateLong(ev.endDate)}` : ''}</p>
                  </div>
                  <div>
                    <span>WHERE</span>
                    <strong>{isVirtual ? `Online${platform ? ` · ${platform}` : ''}` : (ev.location || 'Accra · venue to be announced')}</strong>
                    <p>{isVirtual ? (ev.location && !/^online$/i.test(ev.location.trim()) ? ev.location : 'Join from anywhere') : ev.venueType === 'hybrid' ? `In person & online${platform ? ` · ${platform}` : ''}` : 'In person'}</p>
                  </div>
                  {contacts.length > 0 && (
                    <div>
                      <span>CONTACT</span>
                      {contacts.map((c) => (
                        <div key={c.phone} className="contact-row">
                          <strong>{c.name ? `${c.name} · ` : ''}{displayPhone(c.phone)}</strong>
                          <div className="contact-pills">
                            {canWhatsApp(c) && (
                              <a className="contact-pill wa" href={waLink(c.phone, ev.name)} target="_blank" rel="noopener noreferrer" onClick={() => trackEvent(id, 'contact_click')} aria-label={`WhatsApp ${c.name || displayPhone(c.phone)}`}>
                                <WhatsAppIcon /> WhatsApp
                              </a>
                            )}
                            <a className="contact-pill" href={telLink(c.phone)} onClick={() => trackEvent(id, 'contact_click')} aria-label={`Call ${c.name || displayPhone(c.phone)}`}>
                              <PhoneIcon /> Call
                            </a>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
                <div className="host-line" style={{ justifyContent: 'space-between', flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <span className="host-avatar">{(ev.organizerName ?? 'TB').split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()}</span>
                    <span>Hosted by<br /><b>{ev.organizerName || 'Tikiti Builders Community'}</b></span>
                  </div>
                  <ShareButton eventId={id} title={ev.name} text={intro} />
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
                  {ev.description?.split('\n').filter(Boolean).map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </section>

                {agenda.length > 0 && (
                  <section id="agenda">
                    <span className="eyebrow">YOUR DAY, AT A GLANCE</span>
                    <h2>The programme.</h2>
                    {agenda.map((item, i) => {
                      const time = item.time || item.startTime || '';
                      const title = item.title || item.name || '';
                      const desc = item.description || item.desc || '';
                      return (
                        <div key={i} className="agenda-row">
                          <time>{time}</time>
                          <div>
                            <h3>{title}</h3>
                            {desc && <p>{desc}</p>}
                          </div>
                        </div>
                      );
                    })}
                  </section>
                )}

                <section id="speakers">
                  <span className="eyebrow">PEOPLE BEHIND THE IDEAS</span>
                  <h2>Speakers &amp; facilitators.</h2>
                  {ev.speakers && ev.speakers.length > 0 ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14, marginTop: 18 }}>
                      {ev.speakers.map((sp, i) => (
                        <div key={i} style={{ border: '1px solid rgba(32,34,32,0.15)', borderRadius: 16, padding: 16, background: '#fffef9', display: 'flex', gap: 12, alignItems: 'center' }}>
                          {sp.photo ? (
                            <img src={sp.photo} alt={sp.name} style={{ width: 48, height: 48, borderRadius: 24, objectFit: 'cover' }} />
                          ) : (
                            <div style={{ width: 48, height: 48, borderRadius: 24, background: '#6256e8', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700 }}>{sp.name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0]).join('').toUpperCase()}</div>
                          )}
                          <div style={{ minWidth: 0 }}>
                            {sp.role && <span style={{ fontSize: 10, letterSpacing: 1, color: '#65675d', textTransform: 'uppercase' }}>{sp.role}</span>}
                            <strong style={{ display: 'block', fontSize: 15, color: '#202220' }}>{sp.name}</strong>
                            {(sp.title || sp.company) && <p style={{ margin: 0, fontSize: 13, color: '#65675d' }}>{[sp.title, sp.company].filter(Boolean).join(' · ')}</p>}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <>
                      <p>The speaker lineup will be announced here.</p>
                      <div className="speaker-placeholder">
                        <span><Arrow dir="ne" size={40} strokeWidth={1.75} /></span>
                        <div>
                          <strong>Fresh perspectives. Practical experience.</strong>
                          <p>Hear from the people doing the work.</p>
                        </div>
                      </div>
                    </>
                  )}
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
              <aside id="tickets" className="ticket-panel">
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
                    <b style={{ whiteSpace: 'nowrap', fontSize: 13, color: '#202220' }}>{price === 0 ? 'Free' : `₵${price}`}</b>
                  </label>
                </fieldset>

                {price > 0 && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, color: '#65675d', marginBottom: 16 }}>
                    <label htmlFor="qty">Tickets</label>
                    <select id="qty" value={qty} onChange={e => setQty(Number(e.target.value))} style={{ background: '#fff', color: '#202220', border: '1px solid #202220', padding: '10px 12px', borderRadius: 4, font: 'inherit' }}>
                      {[1, 2, 3, 4].map(n => <option key={n} value={n}>{n} ticket{n > 1 ? 's' : ''}</option>)}
                    </select>
                  </div>
                )}

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 14, borderTop: '1px solid rgba(32,34,32,0.15)', marginTop: 22, padding: '20px 0', color: '#202220' }}>
                  <span>Total</span>
                  <strong style={{ fontSize: 22, color: '#202220' }}>{price === 0 ? 'Free' : `₵${total}`}</strong>
                </div>

                {cta && (cta.kind === 'organiser_tickets' ? (
                  <p style={{ fontSize: 14, textAlign: 'center', color: '#202220', padding: '14px 0' }}>{cta.note}</p>
                ) : cta.kind === 'tikiti' ? (
                  <Link href="/register">
                    <button className="ticket-cta">
                      <span>{cta.primary.label}</span>
                      <Arrow dir="ne" size={16} />
                    </button>
                  </Link>
                ) : (
                  <>
                    <a {...ctaLink(cta.primary)}>
                      <button className="ticket-cta">
                        <span>{cta.primary.label}</span>
                        <Arrow dir="ne" size={16} />
                      </button>
                    </a>
                    {cta.secondary && (
                      <a {...ctaLink(cta.secondary)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 12, fontSize: 14, fontWeight: 700, color: '#202220', textDecoration: 'underline' }}>
                        {cta.secondary.label} <Arrow dir="ne" size={13} />
                      </a>
                    )}
                  </>
                ))}
                {ev.meetingLink && ev.meetingDetails && (
                  <p style={{ fontSize: 12, textAlign: 'center', color: '#202220', marginTop: 12, lineHeight: 1.5, overflowWrap: 'anywhere' }}>{ev.meetingDetails}</p>
                )}

                {cta && cta.kind !== 'organiser_tickets' && (
                  <p style={{ fontSize: 11, textAlign: 'center', color: 'rgba(32,34,32,0.45)', marginTop: 14 }}>{cta.note ?? (cta.kind === 'join_now' ? 'Opens the live session' : price > 0 ? 'Secure payment via Paystack · Instant confirmation' : 'No payment required')}</p>
                )}
                {interested && (
                  <p style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                    <span style={{ font: "600 12px 'DM Sans', sans-serif", letterSpacing: 0.3, color: '#202220', border: '1px solid #202220', borderRadius: 30, padding: '6px 14px', background: 'rgba(255,255,255,0.6)' }}>{interested}</span>
                  </p>
                )}
                <div style={{ borderTop: '1px dashed rgba(32,34,32,0.2)', margin: '25px -28px -6px', padding: '23px 28px 0', fontSize: 12, textAlign: 'center', color: 'rgba(32,34,32,0.45)', lineHeight: 1.6 }}>Your next connection starts here.</div>
              </aside>
            </div>

            <Link href="/events" className="all-bottom">
              <span>Find your next event</span>
              <Arrow dir="ne" size={32} strokeWidth={1.75} />
            </Link>
          </>
        ) : null}
      </main>

      <footer style={{ margin: '0 5%', padding: '25px 0 36px', borderTop: '1px solid rgba(32,34,32,0.13)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, color: '#65675d', flexWrap: 'wrap', gap: 12 }}>
        <Link href="/" className="pg-logo" style={{ fontSize: 28, letterSpacing: -2 }}>tikiti<span style={{ fontSize: 20 }}>{'✳︎'}</span></Link>
        <span>Good ideas start with people.</span>
        <span>© 2026 Tikiti</span>
      </footer>

      {/* Mobile sticky bar */}
      {ev && cta && (
        <div className="mobile-ticket">
          <span>{price === 0 ? 'Free' : `₵${price}`}</span>
          {cta.kind === 'organiser_tickets' || cta.kind === 'tikiti' ? (
            <a href="#tickets">{cta.kind === 'tikiti' && price > 0 ? 'Choose ticket' : cta.primary.label} <Arrow dir="ne" size={14} /></a>
          ) : (
            <a {...ctaLink(cta.primary)}>{cta.primary.label} <Arrow dir="ne" size={14} /></a>
          )}
        </div>
      )}
    </>
  );
}
