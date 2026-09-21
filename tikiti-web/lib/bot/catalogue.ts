// Upcoming-events catalogue for the WhatsApp bot: `events` + `scraped_events`, cached in module memory for 5 minutes.
// PRIVACY: entries are built from a whitelist of fields. `submittedBy`, `communityContact`, `organizerPhone` and any
// other submitter-derived value are never copied, so they cannot reach the model or a reply.
import type { Firestore } from 'firebase-admin/firestore';
import { eventCta, hasEnded, platformLabel, type CtaEventInput } from '../events/links';
import { displayPhone, normaliseContacts, type EventContact } from '../events/contact';
import type { EventCollection } from './types';

const SITE = 'https://www.gettikiti.com';
const CACHE_MS = 5 * 60 * 1000;
const EXCLUDED_STATUSES = new Set(['draft', 'archived', 'cancelled', 'inactive']);
// Only these fields are fetched: event docs can embed base64 images (the full `events` collection is ~10 MB / 30 s),
// and a whitelist also guarantees submitter data (`submittedBy`, `communityContact`, `organizerPhone`) is never read.
const FIELDS = [
  'name', 'title', 'description', 'date', 'startDate', 'endDate', 'time', 'startTime', 'endTime', 'location', 'venue', 'address', 'city',
  'category', 'type', 'price', 'ticketPrice', 'venueType', 'meetingLink', 'meetingPlatform', 'registrationUrl', 'url', 'sourceUrl',
  'contacts', 'registrationMethod', 'ticketingDisabled', 'speakers', 'source', 'status', 'isActive',
];
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export interface CatalogueEvent {
  id: string;
  collection: EventCollection;
  name: string;
  /** YYYY-MM-DD, or '' when unknown */
  date: string;
  endDate: string;
  time: string;
  endTime: string;
  venue: string;
  address: string;
  city: string;
  category: string;
  isFree: boolean;
  price: number;
  online: boolean;
  platform: string;
  description: string;
  speakers: string[];
  contacts: EventContact[];
  /** Link sent to the user: the Tikiti page, or the external page for scraped events that have one */
  link: string;
  cta: CtaEventInput;
}

const str = (v: unknown) => (typeof v === 'string' ? v.trim() : typeof v === 'number' ? String(v) : '');

/** "2026-10-05…" or "05 Oct 2026" → "2026-10-05"; anything else → ''. */
export function normaliseDate(raw: unknown): string {
  const s = str(raw);
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) return `${iso[1]}-${iso[2]}-${iso[3]}`;
  const dmy = s.match(/^(\d{1,2})\s+([A-Za-z]{3})[A-Za-z]*\.?,?\s+(\d{4})/);
  if (dmy) {
    const m = MONTHS.findIndex((x) => x.toLowerCase() === dmy[2].toLowerCase());
    if (m >= 0) return `${dmy[3]}-${String(m + 1).padStart(2, '0')}-${dmy[1].padStart(2, '0')}`;
  }
  return '';
}

/** "2026-10-05" → "Mon, 5 Oct" */
export function formatDay(date: string): string {
  const m = date.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return 'Date TBA';
  const d = new Date(Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3])));
  return `${DAYS[d.getUTCDay()]}, ${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]}`;
}

function locationParts(d: Record<string, any>): { venue: string; address: string; city: string } {
  const loc = d.location;
  if (loc && typeof loc === 'object') {
    return { venue: str(loc.name) || str(loc.venue), address: str(loc.address) || str(d.address), city: str(loc.city) || str(d.city) };
  }
  return { venue: str(loc) || str(d.venue), address: str(d.address), city: str(d.city) };
}

function priceOf(d: Record<string, any>): { isFree: boolean; price: number } {
  const raw = d.ticketPrice ?? d.price;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^\d.]/g, ''));
  const price = Number.isFinite(n) && n > 0 ? n : 0;
  if (d.type === 'free') return { isFree: true, price: 0 };
  return { isFree: price === 0, price };
}

function toEntry(id: string, collection: EventCollection, d: Record<string, any>): CatalogueEvent | null {
  const name = str(d.name) || str(d.title);
  if (!name) return null;
  const date = normaliseDate(d.date || d.startDate);
  const endDate = normaliseDate(d.endDate) || date;
  const { venue, address, city } = locationParts(d);
  const { isFree, price } = priceOf(d);
  const meetingLink = str(d.meetingLink);
  const online = d.venueType === 'virtual' || (!!meetingLink && d.venueType !== 'hybrid' && !venue)
    || /\b(online|virtual|zoom|remote|webinar|google meet)\b/i.test(`${venue} ${city}`);
  const scraped = collection === 'scraped_events';
  const registrationUrl = str(d.registrationUrl) || (scraped ? str(d.url) || str(d.sourceUrl) : '');
  const contacts = normaliseContacts(d.contacts);
  const speakers = (Array.isArray(d.speakers) ? d.speakers : [])
    .map((s: any) => [str(s?.name), str(s?.role) || str(s?.title), str(s?.organisation) || str(s?.organization) || str(s?.company)].filter(Boolean).join(' · '))
    .filter(Boolean)
    .slice(0, 12);
  // Scrapers write 00:00 when the source gave no time
  const rawTime = str(d.time) || str(d.startTime);
  const startTime = scraped && /^0?0:00(:00)?$/.test(rawTime) ? '' : rawTime;
  const cta: CtaEventInput = {
    registrationUrl: registrationUrl || undefined,
    meetingLink: meetingLink || undefined,
    date, endDate, time: startTime, startTime, endTime: str(d.endTime),
    type: isFree ? 'free' : 'paid',
    price,
    source: str(d.source) || undefined,
    isScraped: scraped,
    ticketingDisabled: d.ticketingDisabled === true,
    name,
    contacts,
    registrationMethod: str(d.registrationMethod) || undefined,
  };
  return {
    id, collection, name, date, endDate,
    time: startTime, endTime: cta.endTime || '',
    venue, address, city,
    category: str(d.category),
    isFree, price, online,
    platform: platformLabel(str(d.meetingPlatform)) || (online ? 'Online' : ''),
    description: str(d.description).replace(/\s+/g, ' '),
    speakers, contacts,
    link: scraped && registrationUrl ? registrationUrl : `${SITE}/events/${id}?src=wa`,
    cta,
  };
}

let cache: { at: number; events: CatalogueEvent[] } | null = null;

/** Upcoming events from both collections, soonest first. Cached for 5 minutes per server instance. */
export async function loadCatalogue(db: Firestore, now: Date = new Date()): Promise<CatalogueEvent[]> {
  if (cache && now.getTime() - cache.at < CACHE_MS && now.getTime() >= cache.at) return cache.events.filter((e) => !hasEnded(e.cta, now));
  const [eventsSnap, scrapedSnap] = await Promise.all([
    db.collection('events').select(...FIELDS).get(),
    db.collection('scraped_events').select(...FIELDS).get().catch(() => null),
  ]);
  const out: CatalogueEvent[] = [];
  for (const doc of eventsSnap.docs) {
    const d = doc.data();
    if (d.isActive === false || EXCLUDED_STATUSES.has(String(d.status || ''))) continue;
    const e = toEntry(doc.id, 'events', d);
    if (e && e.date && !hasEnded(e.cta, now)) out.push(e);
  }
  for (const doc of scrapedSnap?.docs || []) {
    const d = doc.data();
    if (String(d.status || '') !== 'active') continue;
    const e = toEntry(doc.id, 'scraped_events', d);
    if (e && e.date && !hasEnded(e.cta, now)) out.push(e);
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || a.time.localeCompare(b.time));
  cache = { at: now.getTime(), events: out };
  return out;
}

export function clearCatalogueCache() { cache = null; }

/** One compact row per event for the matching prompt. */
export function compactRow(e: CatalogueEvent): Record<string, unknown> {
  return {
    id: e.id, src: e.collection === 'events' ? 'tikiti' : 'scraped', name: e.name,
    date: e.endDate && e.endDate !== e.date ? `${e.date}..${e.endDate}` : e.date,
    time: e.time || undefined,
    where: [e.venue, e.city].filter(Boolean).join(', ') || undefined,
    cat: e.category || undefined,
    price: e.isFree ? 'free' : `GHS ${e.price}`,
    online: e.online || undefined,
    desc: e.description.slice(0, 140) || undefined,
  };
}

export const priceLabel = (e: CatalogueEvent) => (e.isFree ? 'Free' : `GH₵${e.price}`);
export const placeLabel = (e: CatalogueEvent) => (e.online
  ? (e.venue && !/^(virtual|online)$/i.test(e.venue) ? e.venue : 'Online')
  : [e.venue, e.city && e.venue.toLowerCase().includes(e.city.toLowerCase()) ? '' : e.city].filter(Boolean).join(', ') || 'Venue TBA');

/** The facts the Q&A model may use. Contains no submitter data. */
export function eventFacts(e: CatalogueEvent, now: Date = new Date()): Record<string, unknown> {
  const cta = eventCta(e.cta, now);
  const contacts = e.contacts.map((c) => [c.name, displayPhone(c.phone)].filter(Boolean).join(' '));
  let howToAttend: string;
  switch (cta.kind) {
    case 'register_external': howToAttend = `Register on the organiser's site: ${cta.primary.href}`; break;
    case 'join_now': howToAttend = `It is online and live today. Join link: ${cta.primary.href}`; break;
    case 'join_later': howToAttend = `It is online. Join link: ${cta.secondary?.href}. ${cta.note || ''}`.trim(); break;
    case 'contact_organiser': howToAttend = `Contact the organiser to register or get tickets: ${contacts.join(', ')}`; break;
    case 'no_registration': howToAttend = 'No registration needed — just show up.'; break;
    case 'organiser_tickets': howToAttend = cta.note || 'Tickets are sold by the organiser directly.'; break;
    default: howToAttend = `${e.isFree ? 'Register free' : 'Get tickets'} on the Tikiti event page: ${e.link}`;
  }
  return {
    name: e.name,
    date: e.date, endDate: e.endDate !== e.date ? e.endDate : undefined,
    day: formatDay(e.date),
    startTime: e.time || undefined, endTime: e.endTime || undefined,
    venue: e.venue || undefined, address: e.address || undefined, city: e.city || undefined,
    online: e.online, onlinePlatform: e.platform || undefined,
    price: e.isFree ? 'Free' : `GHS ${e.price}`,
    category: e.category || undefined,
    description: e.description.slice(0, 1500) || undefined,
    speakers: e.speakers.length ? e.speakers : undefined,
    howToAttend,
    organiserContacts: contacts.length ? contacts : undefined,
    eventPage: e.link,
  };
}
