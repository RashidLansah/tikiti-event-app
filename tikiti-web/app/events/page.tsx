'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import ShareButton from '@/components/events/ShareButton';
import Arrow from '@/components/ui/Arrow';
import PublicHeader from '@/components/layout/PublicHeader';
import WhatsOnSignup from '@/components/audience/WhatsOnSignup';
import { trackEvent, isExternalEvent, interestedLabel } from '@/lib/events/track';
import { cardCtaLabel } from '@/lib/events/links';

const CATEGORIES = ['All', 'Conferences', 'Workshops', 'Meetups', 'Startups', 'Community'];

const PG = `
  @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@700;800;900&family=DM+Sans:wght@400;500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; padding: 0; }
  .pg { font-family: 'DM Sans', Arial, sans-serif; background: #faf9f2; color: #202220; }
  .pg-display { font-family: 'Barlow Condensed', Impact, sans-serif; }
  a { color: inherit; text-decoration: none; }
  .pg-main { max-width: 1280px; margin: 0 auto; padding: 40px 5% 80px; }
  .pg-h1 { font-size: clamp(52px, 11vw, 100px); font-weight: 900; text-transform: uppercase; line-height: 0.88; letter-spacing: -2px; overflow-wrap: anywhere; }
  .pg-title { display: flex; justify-content: space-between; align-items: flex-end; padding: 32px 0 24px; flex-wrap: wrap; gap: 16px; }
  .pg-controls { display: flex; gap: 16px; padding: 16px 0; flex-wrap: wrap; align-items: center; }
  .pg-search {
    display: flex; align-items: center; gap: 12px; border: 1px solid rgba(0,0,0,0.12);
    border-radius: 10px; padding: 0 20px; flex: 1; min-width: 260px; background: #fff;
  }
  .pg-search input { padding: 18px 0; background: none; border: 0; color: #202220; font: inherit; width: 100%; outline: none; font-size: 15px; }
  .pg-search input::placeholder { color: #999; }
  .pg-date select { background: #fff; color: #202220; font: inherit; padding: 18px 16px; border: 1px solid rgba(0,0,0,0.12); border-radius: 10px; outline: none; font-size: 14px; cursor: pointer; }
  .pg-cats { display: flex; gap: 8px; flex-wrap: wrap; padding: 4px 0 28px; }
  .pg-cat { border: 1px solid rgba(0,0,0,0.12); color: #202220; border-radius: 25px; padding: 10px 18px; background: none; font: inherit; font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s; }
  .pg-cat:hover { border-color: #f44929; }
  .pg-cat.active { background: #f44929; color: #fff; border-color: #f44929; }
  .pg-results-heading { display: flex; justify-content: space-between; align-items: center; border-top: 1px solid rgba(0,0,0,0.1); padding: 20px 0; margin-bottom: 8px; }
  .pg-results-heading h2 { font-size: 18px; font-weight: 500; }
  .pg-results-heading span { font-size: 14px; color: #65675d; }
  .pg-grid { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 28px 22px; }
  .pg-card { border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; transition: transform 0.25s; display: flex; flex-direction: column; }
  .pg-card:hover { transform: translateY(-5px); }
  .pg-card-img { height: 260px; position: relative; overflow: hidden; background: #333; }
  .pg-card-img img { width: 100%; height: 100%; object-fit: cover; filter: brightness(0.6); transition: transform 0.4s; }
  .pg-card:hover .pg-card-img img { transform: scale(1.05); }
  .pg-card-img-placeholder { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }
  .pg-card-date { position: absolute; top: 18px; left: 18px; background: #f44929; color: #fff; border-radius: 6px; padding: 6px 10px; font-size: 11px; font-weight: 700; letter-spacing: 1px; }
  .pg-card-cat { position: absolute; right: 14px; top: 20px; font-size: 11px; color: #fff; background: rgba(0,0,0,0.5); padding: 6px 10px; border-radius: 20px; letter-spacing: 0.5px; }
  .pg-card-name { position: absolute; bottom: 20px; left: 20px; color: #fff; font-family: 'Barlow Condensed', Impact, sans-serif; font-size: 46px; font-weight: 800; line-height: 0.9; letter-spacing: -1px; }
  .pg-card-body { padding: 20px; background: #fff; flex: 1; display: flex; flex-direction: column; gap: 8px; }
  .pg-card-body h3 { font-size: 16px; font-weight: 700; }
  .pg-card-body p { font-size: 13px; color: #65675d; line-height: 1.5; flex: 1; }
  .pg-card-foot { display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 12px; border-top: 1px solid rgba(0,0,0,0.07); }
  .pg-card-foot span { font-size: 12px; color: #999; }
  .pg-card-price { font-size: 15px; font-weight: 700; color: #f44929; }
  .pg-tabs { display: flex; gap: 0; border-bottom: 2px solid rgba(0,0,0,0.08); margin-bottom: 0; }
  .pg-tab { background: none; border: none; font: inherit; font-size: 15px; font-weight: 600; color: #65675d; cursor: pointer; padding: 14px 24px; position: relative; transition: color 0.15s; }
  .pg-tab:hover { color: #202220; }
  .pg-tab.active { color: #f44929; }
  .pg-tab.active::after { content: ''; position: absolute; bottom: -2px; left: 0; right: 0; height: 2px; background: #f44929; border-radius: 2px 2px 0 0; }
  .pg-empty { text-align: center; padding: 64px 24px; }
  .pg-skeleton-card { border: 1px solid rgba(0,0,0,0.08); border-radius: 12px; overflow: hidden; }
  .pg-skeleton-img { height: 260px; background: linear-gradient(90deg, #e8e8e0 25%, #f0f0e8 50%, #e8e8e0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
  .pg-skeleton-body { padding: 20px; background: #fff; display: flex; flex-direction: column; gap: 10px; }
  .pg-skeleton-line { height: 14px; border-radius: 4px; background: linear-gradient(90deg, #e8e8e0 25%, #f0f0e8 50%, #e8e8e0 75%); background-size: 200% 100%; animation: shimmer 1.4s infinite; }
  @keyframes shimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }
  .pg-card-body h3 { overflow-wrap: anywhere; }
  @media (max-width: 900px) { .pg-grid { grid-template-columns: repeat(2, 1fr); } }
  @media (max-width: 768px) {
    .pg-main { padding: 20px 5% 60px; }
    .pg-title { padding: 16px 0 12px; }
    .pg-title p { padding-bottom: 0; }
    .pg-search input { padding: 14px 0; }
    .pg-date select { padding: 14px 16px; width: 100%; }
    .pg-date { width: 100%; }
    .pg-tab { padding: 12px 18px; }
    .pg-card-img { height: 220px; }
    .pg-card-name { font-size: 38px; right: 20px; }
  }
  @media (max-width: 600px) { .pg-grid { grid-template-columns: 1fr; gap: 20px; } }
`;

interface FirestoreEvent {
  id: string;
  name: string;
  category: string;
  description: string;
  location: string;
  date: string;
  time: string;
  type: string;
  ticketPrice?: number;
  price?: string;
  coverImage?: string;
  imageUrl?: string;
  status: string;
  isScraped?: boolean;
  registrationUrl?: string;
  meetingLink?: string;
  endDate?: string;
  endTime?: string;
  ticketingDisabled?: boolean;
  isOnline?: boolean;
  source?: string;
  contacts?: Array<{ name?: string; phone: string; whatsapp?: boolean }>;
  registrationMethod?: string;
  stats?: { views?: number; registerClicks?: number; contactClicks?: number };
}

function formatDateShort(dateStr: string): string {
  if (!dateStr) return '';
  // Handle "09 Sep 2026" format from scraped events
  const d = new Date(dateStr.includes('T') ? dateStr : dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) {
    // Try parsing "DD Mon YYYY"
    const parts = dateStr.split(' ');
    if (parts.length === 3) return `${parts[0]} ${parts[1].toUpperCase().slice(0, 3)}`;
    return dateStr.slice(0, 6);
  }
  const day = d.getDate().toString().padStart(2, '0');
  const months = ['JAN','FEB','MAR','APR','MAY','JUN','JUL','AUG','SEP','OCT','NOV','DEC'];
  return `${day} ${months[d.getMonth()]}`;
}

function formatDateLong(dateStr: string): string {
  if (!dateStr) return '';
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}

function getImageSrc(ev: FirestoreEvent): string {
  if (ev.coverImage) return ev.coverImage;
  if (ev.imageUrl) return ev.imageUrl;
  return '';
}

function getEventPrice(ev: FirestoreEvent): string {
  if (ev.isScraped) {
    if (!ev.price || ev.price === '0' || ev.price === 'Free') return 'Free';
    return ev.price;
  }
  const p = ev.ticketPrice ?? 0;
  return p === 0 ? 'Free' : `₵${p}`;
}

function isUpcoming(ev: FirestoreEvent, today: Date): boolean {
  if (!ev.date) return true;
  // Handle "09 Sep 2026" format
  const d = new Date(ev.date + (ev.date.includes('T') ? '' : 'T00:00:00'));
  if (isNaN(d.getTime())) return true; // show in upcoming if unparseable
  return d >= today;
}

function getShortName(name: string): string {
  const words = name.toUpperCase().split(' ');
  if (words.length <= 2) return words.join('\n');
  const mid = Math.ceil(words.length / 2);
  return words.slice(0, mid).join(' ') + '\n' + words.slice(mid).join(' ');
}

export default function EventsPage() {
  const [tab, setTab] = useState<'upcoming' | 'past'>('upcoming');
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('All');
  const [dateFilter, setDateFilter] = useState('');
  const [events, setEvents] = useState<FirestoreEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchEvents() {
      try {
        const [eventsSnap, scrapedSnap] = await Promise.all([
          getDocs(collection(db, 'events')),
          getDocs(collection(db, 'scraped_events')),
        ]);

        const organiserEvents: FirestoreEvent[] = eventsSnap.docs
          .map(doc => ({ id: doc.id, ...(doc.data() as Omit<FirestoreEvent, 'id'>) }))
          .filter(e => e.status === 'published' || e.status === 'active' || e.status === 'draft' || !e.status);

        const scrapedEvents: FirestoreEvent[] = scrapedSnap.docs
          .map(doc => {
            const d = doc.data();
            if (d.price && d.price !== '0' && d.price !== 'Free') return null; // free only
            const loc = (d.location || '').toLowerCase();
            const isOnline = loc.includes('online') || loc.includes('virtual') || loc.includes('zoom') || loc.includes('remote');
            return { id: doc.id, ...d, isScraped: true, isOnline } as FirestoreEvent;
          })
          .filter(Boolean) as FirestoreEvent[];

        setEvents([...organiserEvents, ...scrapedEvents]);
      } catch (err) {
        console.error('Failed to fetch events:', err);
        setError('Could not load events.');
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const tabEvents = events.filter(ev =>
    tab === 'upcoming' ? isUpcoming(ev, today) : !isUpcoming(ev, today)
  );

  const filtered = tabEvents.filter(ev => {
    const cat = ev.category ?? '';
    const matchCat = category === 'All' || cat.toLowerCase().includes(category.toLowerCase());
    const name = ev.name ?? '';
    const desc = ev.description ?? '';
    const matchQ = !query || name.toLowerCase().includes(query.toLowerCase()) || desc.toLowerCase().includes(query.toLowerCase());
    const matchDate = !dateFilter || (ev.date ?? '').includes(dateFilter);
    return matchCat && matchQ && matchDate;
  });

  return (
    <div className="pg">
      <style>{PG}</style>

      <PublicHeader cta={{ label: 'Sign in', href: '/login' }} />

      <main className="pg-main">
        <div className="pg-title">
          <div>
            <div style={{ fontSize: 11, letterSpacing: 3, fontWeight: 700, color: '#65675d', marginBottom: 10 }}>YOUR PEOPLE ARE OUT THERE</div>
            <h1 className="pg-display pg-h1">
              Find your<br /><em style={{ fontStyle: 'normal', color: '#f44929' }}>next spark.</em>
            </h1>
          </div>
          <p style={{ fontSize: 15, color: '#65675d', lineHeight: 1.65, maxWidth: 280, paddingBottom: 8 }}>
            New skills. Fresh perspectives.<br />A room full of possibilities.
          </p>
        </div>

        <div className="pg-controls">
          <label className="pg-search">
            <span style={{ fontSize: 24, color: '#ccc' }}>⌕</span>
            <input
              type="search"
              placeholder="Search events, topics..."
              value={query}
              onChange={e => setQuery(e.target.value)}
            />
          </label>
          <label className="pg-date">
            <select value={dateFilter} onChange={e => setDateFilter(e.target.value)}>
              <option value="">Any date</option>
              <option value="2026-11">November 2026</option>
              <option value="2026-12">December 2026</option>
            </select>
          </label>
        </div>

        <div className="pg-cats">
          {CATEGORIES.map(c => (
            <button key={c} className={`pg-cat${category === c ? ' active' : ''}`} onClick={() => setCategory(c)}>
              {c}
            </button>
          ))}
        </div>

        <div className="pg-tabs">
          <button className={`pg-tab${tab === 'upcoming' ? ' active' : ''}`} onClick={() => setTab('upcoming')}>Upcoming</button>
          <button className={`pg-tab${tab === 'past' ? ' active' : ''}`} onClick={() => setTab('past')}>Past</button>
        </div>

        <div className="pg-results-heading">
          <h2>{tab === 'upcoming' ? 'Upcoming events' : 'Past events'}</h2>
          <span>{loading ? '…' : `${filtered.length} event${filtered.length !== 1 ? 's' : ''}`}</span>
        </div>

        {loading ? (
          <div className="pg-grid">
            {[1, 2, 3].map(n => (
              <div key={n} className="pg-skeleton-card">
                <div className="pg-skeleton-img" />
                <div className="pg-skeleton-body">
                  <div className="pg-skeleton-line" style={{ width: '70%' }} />
                  <div className="pg-skeleton-line" style={{ width: '90%' }} />
                  <div className="pg-skeleton-line" style={{ width: '50%' }} />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="pg-empty">
            <div className="pg-display" style={{ fontSize: 48, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>Couldn't load events.</div>
            <p style={{ color: '#65675d', marginBottom: 24 }}>{error}</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="pg-empty">
            <div className="pg-display" style={{ fontSize: 48, fontWeight: 800, textTransform: 'uppercase', marginBottom: 12 }}>
              {tabEvents.length === 0
                ? (tab === 'upcoming' ? 'No upcoming events.' : 'No past events.')
                : 'No events found.'}
            </div>
            <p style={{ color: '#65675d', marginBottom: 24 }}>
              {tabEvents.length === 0
                ? (tab === 'upcoming' ? 'Check back soon — something is coming.' : 'Past events will appear here.')
                : 'Try another topic or category.'}
            </p>
            {tabEvents.length > 0 && (
              <button className="pg-cat" onClick={() => { setQuery(''); setCategory('All'); setDateFilter(''); }}>Clear filters <Arrow dir="ne" size={13} /></button>
            )}
          </div>
        ) : (
          <div className="pg-grid">
            {filtered.map(ev => {
              const price = getEventPrice(ev);
              const dateShort = formatDateShort(ev.date);
              const shortName = getShortName(ev.name);
              const imgSrc = getImageSrc(ev);
              const intro = ev.description ? ev.description.split('\n')[0].slice(0, 120) : '';
              const interested = isExternalEvent(ev) ? interestedLabel(ev.stats) : null;
              const ctaLabel = isExternalEvent(ev) ? cardCtaLabel(ev) : null;
              const cardContent = (
                <>
                  <div className="pg-card-img">
                    {imgSrc ? (
                      <img src={imgSrc} alt={ev.name} />
                    ) : (
                      <div className="pg-card-img-placeholder" style={{ background: '#2a2a2a' }} />
                    )}
                    {dateShort && <div className="pg-card-date">{dateShort}</div>}
                    {ev.category && <div className="pg-card-cat">{ev.category}</div>}
                    {!imgSrc && <div className="pg-card-name" style={{ whiteSpace: 'pre-line' }}>{shortName}</div>}
                  </div>
                  <div className="pg-card-body">
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 2 }}>
                      {ev.isScraped && (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, background: '#f0efe8', color: '#65675d', border: '1px solid #deded4', borderRadius: 4, padding: '2px 7px' }}>
                          EXTERNAL <Arrow dir="ne" size={10} strokeWidth={2.5} />
                        </span>
                      )}
                      {ev.isOnline && (
                        <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: 0.5, background: '#e6f9f0', color: '#1a8c4e', border: '1px solid #b2e8ce', borderRadius: 4, padding: '2px 7px' }}>
                          ONLINE
                        </span>
                      )}
                    </div>
                    <h3>{ev.name}</h3>
                    <p>{intro}</p>
                    <div className="pg-card-foot">
                      <span>{ev.location || 'Accra'}{interested ? ` · ${interested}` : ''}</span>
                      {ctaLabel && (
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, fontWeight: 700, color: '#202220', whiteSpace: 'nowrap' }}>
                          {ctaLabel}{ctaLabel !== 'Details' && <Arrow dir="ne" size={11} strokeWidth={2.5} />}
                        </span>
                      )}
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 10 }}>
                        <span className="pg-card-price">{price}</span>
                        <ShareButton eventId={ev.id} title={ev.name} text={intro} variant="icon" />
                      </span>
                    </div>
                  </div>
                </>
              );
              return ev.isScraped && ev.registrationUrl ? (
                <a href={ev.registrationUrl} key={ev.id} className="pg-card" target="_blank" rel="noopener noreferrer" onClick={() => trackEvent(ev.id, 'register_click')}>
                  {cardContent}
                </a>
              ) : (
                <Link href={`/events/${ev.id}`} key={ev.id} className="pg-card">
                  {cardContent}
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <WhatsOnSignup />

      <footer style={{ background: '#faf9f2', padding: '40px 5%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(0,0,0,0.08)', flexWrap: 'wrap', gap: 12 }}>
        <Link href="/" style={{ fontSize: 26, fontWeight: 700, letterSpacing: -1.5, color: '#202220' }}>tikiti<span style={{ color: '#f44929' }}>{'✳︎'}</span></Link>
        <span style={{ fontSize: 13, color: '#65675d' }}>Good ideas start with people.</span>
        <span style={{ fontSize: 12, color: '#999' }}>© 2026 Tikiti</span>
      </footer>
    </div>
  );
}
