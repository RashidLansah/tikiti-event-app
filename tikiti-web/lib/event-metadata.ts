// Shared Open Graph / Twitter metadata for event pages (/events/[id] and /event/[id]).
// Crawlers (WhatsApp, Facebook, X, LinkedIn, iMessage, Slack) read these tags
// server-side, so everything here must be absolute URLs.
import type { Metadata } from 'next';
import { fetchEventFromFirebase, extractLocationText, type EventData } from '@/lib/firebase/rest-api';

export const SITE_URL = 'https://www.gettikiti.com';

export function formatEventDate(dateStr?: string): string {
  if (!dateStr) return '';
  const d = new Date(/^\d{4}-\d{2}-\d{2}$/.test(dateStr) ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' });
}

export function eventPosterUrl(id: string): string {
  return `${SITE_URL}/api/events/${encodeURIComponent(id)}/poster?og=1`;
}

function truncate(text: string, max: number): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  return clean.length <= max ? clean : `${clean.slice(0, max - 1).trimEnd()}…`;
}

export function buildEventDescription(event: EventData): string {
  const date = formatEventDate(event.date);
  const venue = extractLocationText(event.location, event.address);
  const dateVenue = [date, venue].filter(Boolean).join(' · ');
  if (event.description) return truncate(event.description, 150);
  return dateVenue || `Join us for ${event.name || 'this event'} on Tikiti`;
}

/** Build page metadata for an event. `path` is the canonical path, e.g. `/events/abc`. */
export async function buildEventMetadata(id: string, path: string): Promise<Metadata> {
  const event = await fetchEventFromFirebase(id);
  const pageUrl = `${SITE_URL}${path}`;

  if (!event) {
    return {
      title: 'Event Not Found · Tikiti',
      description: 'This event could not be found on Tikiti.',
      metadataBase: new URL(SITE_URL),
      alternates: { canonical: pageUrl },
    };
  }

  const name = event.name || 'Event';
  const title = `${name} · Tikiti`;
  const description = buildEventDescription(event);
  const image = { url: eventPosterUrl(id), width: 1200, height: 630, alt: `${name} — event poster` };

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: pageUrl },
    openGraph: { type: 'website', url: pageUrl, title, description, siteName: 'Tikiti', images: [image] },
    twitter: { card: 'summary_large_image', title, description, images: [image.url] },
  };
}
