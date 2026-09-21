// Who should hear about an event: interest + location match over the audience collection. Server side only.
// This module only COUNTS and SELECTS. Sending lives in lib/audience/send.ts.
import type { Firestore } from 'firebase-admin/firestore';
import { categoryToInterest, cityFromLocation, channelHasIdentifier, contactIdFor, slugKey } from './contacts';
import { AUDIENCE_CHANNELS, AUDIENCE_COLLECTION, type AudienceChannel } from './types';

const MAX_DOCS = 20000;
const PAGE = 1000;
export const DEFAULT_COOLDOWN_DAYS = 3;
export const LEGACY_WORDING = 'legacy-owner-attested';

export type MatchMode = 'both' | 'interest' | 'city' | 'either';
export const MATCH_MODES: MatchMode[] = ['both', 'interest', 'city', 'either'];
export type MatchReason = 'interestAndCity' | 'interestOnly' | 'cityOnly';

export interface MatchEvent {
  id: string; name: string; date: string; time: string; location: string; category: string;
  city: string; interest: string | null; isOnline: boolean; priceLabel: string;
}

export interface MatchRecipient {
  id: string;
  reason: MatchReason;
  channels: Record<AudienceChannel, boolean>;
  legacy: Record<AudienceChannel, boolean>;
  paidBefore: boolean;
  lastActiveMs: number;
}

export interface MatchResult {
  event: MatchEvent;
  mode: MatchMode;
  cooldownDays: number;
  /** true when the event is online (or has no usable city) so location was not used */
  cityIgnored: boolean;
  matched: number;
  byReason: Record<MatchReason, number>;
  reachable: Record<AudienceChannel, number>;
  excluded: { noConsent: number; alreadyBooked: number; recentlyContacted: number };
  /** per channel: how many reachable matches rely on owner-attested (legacy) consent */
  legacyAttested: Record<AudienceChannel, number>;
  truncated: boolean;
  /** server side only — strip before responding to a browser */
  recipients: MatchRecipient[];
}

const toMs = (v: any): number => (v?.toDate ? v.toDate().getTime() : v instanceof Date ? v.getTime() : typeof v === 'string' || typeof v === 'number' ? new Date(v).getTime() || 0 : 0);

export function parseMode(raw: unknown): MatchMode {
  return MATCH_MODES.includes(raw as MatchMode) ? (raw as MatchMode) : 'both';
}

export function parseCooldown(raw: unknown): number {
  const n = Number(raw);
  return raw == null || raw === '' || !Number.isFinite(n) ? DEFAULT_COOLDOWN_DAYS : Math.max(0, Math.min(90, Math.floor(n)));
}

// ---- pure predicates -------------------------------------------------------------------------------------------

export function matchesInterest(contact: Record<string, any>, ev: { interest: string | null; category: string }): boolean {
  const tag = ev.interest;
  if (tag && Array.isArray(contact.interests) && contact.interests.some((i: unknown) => String(i).toLowerCase() === tag.toLowerCase())) return true;
  const cats: Record<string, unknown> = contact.signals?.categories || {};
  const keys = new Set([slugKey(ev.category), slugKey(tag)].filter(Boolean));
  for (const k of keys) if (Number(cats[k]) > 0) return true;
  // a signal recorded under another raw category that maps to the same interest tag also counts
  if (tag) for (const [k, n] of Object.entries(cats)) if (Number(n) > 0 && categoryToInterest(k.replace(/_/g, ' ')) === tag) return true;
  return false;
}

export function matchesCity(contact: Record<string, any>, city: string): boolean {
  const want = city.trim().toLowerCase();
  if (!want) return false;
  if (String(contact.city || '').trim().toLowerCase() === want) return true;
  return Number(contact.signals?.cities?.[slugKey(want)]) > 0;
}

/** Returns the reason the contact matches in this mode, or null. `useCity` false (online event) makes 'both' interest-only. */
export function matchReason(interest: boolean, city: boolean, mode: MatchMode, useCity: boolean): MatchReason | null {
  const c = useCity && city;
  const reason: MatchReason | null = interest && c ? 'interestAndCity' : interest ? 'interestOnly' : c ? 'cityOnly' : null;
  if (!reason) return null;
  switch (mode) {
    case 'interest': return interest ? reason : null;
    case 'city': return c ? reason : null;
    case 'either': return reason;
    default: return useCity ? (interest && c ? reason : null) : (interest ? reason : null);
  }
}

export function reachableChannels(contact: Record<string, any>): Record<AudienceChannel, boolean> {
  const out = { whatsapp: false, sms: false, email: false };
  for (const ch of AUDIENCE_CHANNELS) {
    out[ch] = contact.channels?.[ch]?.optedIn === true && channelHasIdentifier(ch, { phone: contact.phone, email: contact.email });
  }
  return out;
}

export function isRecentlyContacted(contact: Record<string, any>, cooldownDays: number, nowMs: number): boolean {
  const last = toMs(contact.lastContactedAt);
  return cooldownDays > 0 && last > 0 && nowMs - last < cooldownDays * 86400000;
}

const REASON_RANK: Record<MatchReason, number> = { interestAndCity: 0, interestOnly: 1, cityOnly: 2 };
/** Best match first: interest AND city, then paid before, then most recently active. */
export function compareRecipients(a: MatchRecipient, b: MatchRecipient): number {
  return REASON_RANK[a.reason] - REASON_RANK[b.reason]
    || Number(b.paidBefore) - Number(a.paidBefore)
    || b.lastActiveMs - a.lastActiveMs
    || a.id.localeCompare(b.id);
}

// ---- event ---------------------------------------------------------------------------------------------------

export function describeEvent(id: string, d: Record<string, any>): MatchEvent {
  const str = (v: unknown) => String(v ?? '').trim();
  const location = str(d.location) || [str(d.venue), str(d.city)].filter(Boolean).join(', ');
  const isOnline = d.venueType === 'virtual'
    || /\b(online|virtual|zoom|google meet|meet\.google|teams|webinar|livestream|youtube)\b/i.test(location.split(',')[0] || '')
    || (!location && !!str(d.meetingLink));
  const city = isOnline ? '' : (cityFromLocation(str(d.city)) || cityFromLocation(location));
  const raw = d.ticketPrice ?? d.price;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw ?? '').replace(/[^\d.]/g, ''));
  const price = d.type === 'free' || !Number.isFinite(n) || n <= 0 ? 0 : n;
  const category = str(d.category);
  return {
    id, name: str(d.name) || 'Event', date: str(d.date), time: str(d.startTime || d.time), location, category,
    city, interest: categoryToInterest(category), isOnline, priceLabel: price ? `GHS ${price}` : 'Free',
  };
}

async function bookedContactIds(db: Firestore, eventId: string): Promise<Set<string>> {
  const out = new Set<string>();
  const snap = await db.collection('bookings').where('eventId', '==', eventId).get();
  for (const d of snap.docs) {
    const b = d.data();
    if (!['confirmed', 'used'].includes(String(b.status || '')) && b.paymentStatus !== 'paid') continue;
    for (const id of [contactIdFor({ phone: b.phoneNumber, email: b.userEmail }), contactIdFor({ email: b.userEmail })]) if (id) out.add(id);
  }
  return out;
}

export async function matchAudienceForEvent(
  db: Firestore,
  eventId: string,
  opts: { mode?: MatchMode; cooldownDays?: number; now?: Date } = {},
): Promise<MatchResult> {
  const snap = await db.collection('events').doc(eventId).get();
  if (!snap.exists) throw Object.assign(new Error('Event not found'), { status: 404 });
  const event = describeEvent(snap.id, snap.data()!);
  const mode = parseMode(opts.mode);
  const cooldownDays = parseCooldown(opts.cooldownDays);
  const nowMs = (opts.now || new Date()).getTime();
  const useCity = !!event.city;
  const booked = await bookedContactIds(db, eventId);

  const res: MatchResult = {
    event, mode, cooldownDays, cityIgnored: !useCity, matched: 0,
    byReason: { interestAndCity: 0, interestOnly: 0, cityOnly: 0 },
    reachable: { whatsapp: 0, sms: 0, email: 0 },
    excluded: { noConsent: 0, alreadyBooked: 0, recentlyContacted: 0 },
    legacyAttested: { whatsapp: 0, sms: 0, email: 0 },
    truncated: false, recipients: [],
  };

  let seen = 0;
  let last: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  while (seen < MAX_DOCS) {
    let q = db.collection(AUDIENCE_COLLECTION).orderBy('__name__').limit(PAGE);
    if (last) q = q.startAfter(last);
    const page = await q.get();
    if (page.empty) break;
    for (const d of page.docs) {
      seen++;
      const c = d.data();
      const reason = matchReason(matchesInterest(c, event), matchesCity(c, event.city), mode, useCity);
      if (!reason) continue;
      const channels = reachableChannels(c);
      if (!channels.whatsapp && !channels.sms && !channels.email) { res.excluded.noConsent++; continue; }
      const emailOnlyId = c.email ? contactIdFor({ email: c.email }) : null;
      if (booked.has(d.id) || (emailOnlyId && booked.has(emailOnlyId))) { res.excluded.alreadyBooked++; continue; }
      if (isRecentlyContacted(c, cooldownDays, nowMs)) { res.excluded.recentlyContacted++; continue; }
      res.matched++;
      res.byReason[reason]++;
      const legacy = { whatsapp: false, sms: false, email: false };
      for (const ch of AUDIENCE_CHANNELS) {
        if (!channels[ch]) continue;
        res.reachable[ch]++;
        if (c.channels?.[ch]?.wordingVersion === LEGACY_WORDING) { legacy[ch] = true; res.legacyAttested[ch]++; }
      }
      res.recipients.push({
        id: d.id, reason, channels, legacy,
        paidBefore: (Number(c.signals?.paidBookings) || 0) > 0,
        lastActiveMs: toMs(c.signals?.lastActiveAt) || toMs(c.updatedAt),
      });
    }
    last = page.docs[page.docs.length - 1];
    if (page.size < PAGE) break;
  }
  if (seen >= MAX_DOCS) res.truncated = true;
  res.recipients.sort(compareRecipients);
  return res;
}

/** The browser-safe view: everything except recipients. */
export function publicMatch(r: MatchResult): Omit<MatchResult, 'recipients'> {
  const { recipients: _omit, ...rest } = r;
  return rest;
}
