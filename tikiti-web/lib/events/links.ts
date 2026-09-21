// Link classification + CTA rules for events (shared by the public pages, inbox extraction and publish).
// No 'use client' and no server-only imports: safe on both sides.

export type UrlKind = 'join' | 'registration' | 'info';
export type MeetingPlatform = 'zoom' | 'google_meet' | 'teams' | 'youtube' | 'other';

function parse(url: string): { host: string; path: string } | null {
  const raw = (url || '').trim();
  if (!raw) return null;
  try {
    const u = new URL(/^[a-z][a-z0-9+.-]*:\/\//i.test(raw) ? raw : `https://${raw}`);
    return { host: u.hostname.toLowerCase().replace(/^www\./, ''), path: u.pathname.toLowerCase() };
  } catch {
    return null;
  }
}

const isHost = (host: string, ...domains: string[]) => domains.some((d) => host === d || host.endsWith(`.${d}`));

const SHORTENERS = ['bit.ly', 'tinyurl.com', 't.co', 'rb.gy', 'cutt.ly', 'shorturl.at', 'tiny.cc', 'is.gd', 'ow.ly', 'buff.ly', 'linktr.ee'];

/**
 * 'join' = opens the live session, 'registration' = a sign-up / ticket page, 'info' = anything else.
 * `text` is optional surrounding copy (caption / flyer text) used to decide whether a YouTube link is a live stream.
 */
export function classifyUrl(url: string, text = ''): UrlKind {
  const p = parse(url);
  if (!p) return 'info';
  const { host, path } = p;

  if (isHost(host, 'zoom.us', 'zoom.com')) return /\/(webinar\/)?register/.test(path) ? 'registration' : 'join';
  if (isHost(host, 'meet.google.com')) return 'join';
  if (isHost(host, 'teams.microsoft.com', 'teams.live.com')) return 'join';
  if (isHost(host, 'youtube.com')) return path.startsWith('/live') || /\/live$/.test(path) || /\blive|stream/i.test(text) ? 'join' : 'info';
  if (isHost(host, 'youtu.be')) return /\blive|stream/i.test(text) ? 'join' : 'info';
  if (isHost(host, 'webex.com', 'streamyard.com', 'whereby.com')) return 'join';
  if (isHost(host, 'facebook.com', 'fb.watch', 'fb.me')) return /\/live/.test(path) ? 'join' : 'info';

  if (isHost(host, 'forms.gle', 'eventbrite.com', 'eventbrite.co.uk', 'lu.ma', 'luma.com', 'typeform.com', 'tally.so',
    'jotform.com', 'tix.africa', 'egotickets.com', 'airmeet.com', 'hopin.com', 'forms.office.com')) return 'registration';
  if (isHost(host, 'docs.google.com')) return path.startsWith('/forms') ? 'registration' : 'info';
  if (isHost(host, ...SHORTENERS)) return 'registration';

  return 'info';
}

export function platformFromUrl(url: string): MeetingPlatform | null {
  const p = parse(url);
  if (!p) return null;
  const { host } = p;
  if (isHost(host, 'zoom.us', 'zoom.com')) return 'zoom';
  if (isHost(host, 'meet.google.com')) return 'google_meet';
  if (isHost(host, 'teams.microsoft.com', 'teams.live.com')) return 'teams';
  if (isHost(host, 'youtube.com', 'youtu.be')) return 'youtube';
  return 'other';
}

export function platformLabel(platform?: string | null): string {
  switch (platform) {
    case 'zoom': return 'Zoom';
    case 'google_meet': return 'Google Meet';
    case 'teams': return 'Microsoft Teams';
    case 'youtube': return 'YouTube';
    default: return '';
  }
}

export const URL_KIND_LABEL: Record<UrlKind, string> = {
  join: 'Join link',
  registration: 'Registration page',
  info: 'Info page',
};

// ── CTA ──────────────────────────────────────────────────────────────────────

export interface CtaEventInput {
  registrationUrl?: string;
  meetingLink?: string;
  date?: string;
  endDate?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  type?: string;
  price?: number | string;
  ticketPrice?: number;
  source?: string;
  isScraped?: boolean;
  ticketingDisabled?: boolean;
}

export type CtaKind = 'register_external' | 'join_now' | 'join_later' | 'no_registration' | 'organiser_tickets' | 'tikiti';
export type CtaActionType = 'calendar' | 'native';
export interface CtaAction { label: string; href?: string; action?: CtaActionType }
export interface EventCta { kind: CtaKind; primary: CtaAction; secondary?: CtaAction; note?: string }

/** "18:30", "6:30 PM", "6pm" → minutes since midnight, or null. */
export function parseTimeToMinutes(time?: string): number | null {
  const m = (time || '').trim().match(/^(\d{1,2})(?::(\d{2}))?\s*([ap])\.?\s*m?\.?/i) || (time || '').trim().match(/^(\d{1,2}):(\d{2})/);
  if (!m) return null;
  let h = Number(m[1]);
  const min = Number(m[2] || 0);
  const ap = (m[3] || '').toLowerCase();
  if (ap === 'p' && h < 12) h += 12;
  if (ap === 'a' && h === 12) h = 0;
  if (h > 23 || min > 59) return null;
  return h * 60 + min;
}

/** Africa/Accra is UTC+0 with no DST, so Accra wall-clock time equals UTC. */
export function accraDateToUtcMs(date?: string, minutes = 0): number | null {
  const m = (date || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  return Date.UTC(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, minutes);
}

/** True from 00:00 (Accra) on `date` until endTime + 2h on the last day, or the end of the last day when there is no endTime. */
export function isEventDay(ev: CtaEventInput, now: Date = new Date()): boolean {
  const start = accraDateToUtcMs(ev.date);
  if (start == null) return false;
  const lastDay = accraDateToUtcMs(ev.endDate) ?? start;
  const endMin = parseTimeToMinutes(ev.endTime);
  const end = endMin != null ? Math.max(lastDay, start) + (endMin + 120) * 60000 : Math.max(lastDay, start) + 24 * 3600000;
  const t = now.getTime();
  return t >= start && t < end;
}

function isFree(ev: CtaEventInput): boolean {
  if (ev.type === 'free') return true;
  if (ev.type === 'paid') return false;
  const p = ev.ticketPrice ?? ev.price;
  return p == null || p === '' || p === 0 || p === '0' || (typeof p === 'string' && /^free$/i.test(p));
}

function goesLive(ev: CtaEventInput): string {
  const ms = accraDateToUtcMs(ev.date);
  const day = ms == null ? (ev.date || '') : new Date(ms).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' });
  const time = ev.time || ev.startTime || '';
  return `Goes live ${[day, time].filter(Boolean).join(' · ')}`;
}

/** True once the event-day window (see isEventDay) has fully passed. */
export function hasEnded(ev: CtaEventInput, now: Date = new Date()): boolean {
  const start = accraDateToUtcMs(ev.date);
  if (start == null) return false;
  const lastDay = accraDateToUtcMs(ev.endDate) ?? start;
  const endMin = parseTimeToMinutes(ev.endTime);
  const end = endMin != null ? Math.max(lastDay, start) + (endMin + 120) * 60000 : Math.max(lastDay, start) + 24 * 3600000;
  return now.getTime() >= end;
}

export function eventCta(ev: CtaEventInput, now: Date = new Date()): EventCta {
  const today = isEventDay(ev, now);
  const addToCalendar: CtaAction = { label: 'Add to calendar', action: 'calendar' };

  // External events that are over: no register/join/calendar buttons, just say so.
  if (hasEnded(ev, now) && (ev.registrationUrl || ev.meetingLink || ev.ticketingDisabled || ev.source === 'community' || ev.isScraped)) {
    return { kind: 'organiser_tickets', primary: { label: 'Event ended' }, note: 'This event has ended.' };
  }

  if (ev.registrationUrl) {
    return {
      kind: 'register_external',
      primary: { label: 'Register on their site', href: ev.registrationUrl },
      secondary: ev.meetingLink && today ? { label: 'Join now', href: ev.meetingLink } : undefined,
      note: 'Registration is handled by the organiser',
    };
  }
  if (ev.meetingLink) {
    if (today) return { kind: 'join_now', primary: { label: 'Join now', href: ev.meetingLink }, secondary: addToCalendar };
    return { kind: 'join_later', primary: addToCalendar, secondary: { label: 'Join link', href: ev.meetingLink }, note: goesLive(ev) };
  }
  if ((ev.source === 'community' || ev.isScraped) && isFree(ev)) {
    return { kind: 'no_registration', primary: addToCalendar, note: 'No registration needed — just show up.' };
  }
  if (ev.ticketingDisabled) {
    return {
      kind: 'organiser_tickets',
      primary: { label: 'Ticket details' },
      note: 'Tickets are sold by the organiser directly — check the flyer for details.',
    };
  }
  return { kind: 'tikiti', primary: { label: isFree(ev) ? 'Register free' : 'Get tickets', action: 'native' } };
}

/** Short label for grid cards of external events. */
export function cardCtaLabel(ev: CtaEventInput, now: Date = new Date()): 'Register' | 'Join online' | 'Details' {
  const kind = eventCta(ev, now).kind;
  if (kind === 'register_external') return 'Register';
  if (kind === 'join_now' || kind === 'join_later') return 'Join online';
  return 'Details';
}
