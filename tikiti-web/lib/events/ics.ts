// Minimal RFC 5545 VEVENT builder for the public "Add to calendar" link.
import { accraDateToUtcMs, parseTimeToMinutes } from './links';

export interface IcsEventInput {
  id: string;
  name?: string;
  description?: string;
  date?: string;
  endDate?: string;
  time?: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  address?: string;
  venueType?: string;
  meetingLink?: string;
  meetingDetails?: string;
  registrationUrl?: string;
}

const SITE = 'https://www.gettikiti.com';

const esc = (s: string) => s.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/([,;])/g, '\\$1');

const stamp = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z$/, 'Z');

/** Folds a content line at 75 octets (approximated per character, split at 73 to stay safe with multi-byte text). */
function fold(line: string): string {
  const chars = Array.from(line);
  if (chars.length <= 73) return line;
  const out: string[] = [];
  for (let i = 0; i < chars.length; i += 73) out.push(chars.slice(i, i + 73).join(''));
  return out.join('\r\n ');
}

export function slugify(name: string, fallback = 'event'): string {
  const s = (name || '').toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);
  return s || fallback;
}

/** Returns null when the event has no parseable YYYY-MM-DD date. */
export function buildIcs(ev: IcsEventInput, now: Date = new Date()): string | null {
  const startMin = parseTimeToMinutes(ev.startTime || ev.time);
  const start = accraDateToUtcMs(ev.date, startMin ?? 0);
  if (start == null) return null;

  const allDay = startMin == null;
  const endMin = parseTimeToMinutes(ev.endTime);
  let end = start + 2 * 3600000;
  if (endMin != null) {
    const candidate = accraDateToUtcMs(ev.endDate || ev.date, endMin);
    if (candidate != null && candidate > start) end = candidate;
  }

  const url = `${SITE}/events/${ev.id}`;
  const venue = [ev.location, ev.address].filter(Boolean).join(', ');
  const location = ev.venueType === 'virtual' ? 'Online' : venue;
  const desc = [
    (ev.description || '').split('\n')[0],
    ev.meetingLink ? `Join: ${ev.meetingLink}` : '',
    ev.meetingDetails || '',
    ev.registrationUrl ? `Register: ${ev.registrationUrl}` : '',
    `Event page: ${url}`,
  ].filter(Boolean).join('\n');

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Tikiti//Events//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${ev.id}@gettikiti.com`,
    `DTSTAMP:${stamp(now.getTime())}`,
  ];
  if (allDay) {
    // No start time known: all-day event spanning date..endDate (DTEND is exclusive)
    const last = accraDateToUtcMs(ev.endDate) ?? start;
    const d = (ms: number) => stamp(ms).slice(0, 8);
    lines.push(`DTSTART;VALUE=DATE:${d(start)}`, `DTEND;VALUE=DATE:${d(Math.max(last, start) + 24 * 3600000)}`);
  } else {
    lines.push(`DTSTART:${stamp(start)}`, `DTEND:${stamp(end)}`);
  }
  lines.push(
    `SUMMARY:${esc(ev.name || 'Event')}`,
    `LOCATION:${esc(location || 'Online')}`,
    `DESCRIPTION:${esc(desc)}`,
    `URL:${url}`,
    'END:VEVENT',
    'END:VCALENDAR',
  );
  return lines.map(fold).join('\r\n') + '\r\n';
}
