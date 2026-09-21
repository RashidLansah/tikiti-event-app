// Audience contact store (collection `audience`). Server side only — uses the Admin SDK.
// This module only CAPTURES data. Nothing in here sends a message.
import { createHash, createHmac, timingSafeEqual } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { normaliseGhPhone } from '@/lib/events/contact';
import { INTEREST_TAGS } from './interests';
import { CONSENT_VERSION } from './consent';
import {
  AUDIENCE_CHANNELS, AUDIENCE_COLLECTION, PRICE_COMFORTS, emptySignals,
  type AudienceChannel, type AudienceSignals, type AudienceSource, type ConsentLogEntry, type PriceComfort, type SignalType,
} from './types';

const CONSENT_LOG_CAP = 40;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function normaliseEmail(raw: unknown): string | null {
  const s = raw == null ? '' : String(raw).trim().toLowerCase();
  return s && s.length <= 254 && EMAIL_RE.test(s) ? s : null;
}

function emailId(email: string): string {
  return `e_${createHash('sha256').update(email).digest('hex').slice(0, 24)}`;
}

/** Phone wins (normalised digits are the id); else `e_` + first 24 hex of sha256(lowercased email); null if neither usable. */
export function contactIdFor(input: { phone?: unknown; email?: unknown }): string | null {
  const phone = normaliseGhPhone(input.phone);
  if (phone) return phone;
  const email = normaliseEmail(input.email);
  return email ? emailId(email) : null;
}

/** Lowercase, non-alphanumerics → `_` (trimmed). Used for signals.categories / signals.cities keys. */
export function slugKey(raw: unknown): string {
  return String(raw ?? '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 60);
}

/** "Accra, Ghana" → "Accra" */
/** First segment of a location string, or '' when it names an online venue rather than a place. */
export function cityFromLocation(raw: unknown): string {
  const first = String(raw ?? '').split(',')[0].trim().slice(0, 80);
  if (/\b(online|virtual|zoom|google meet|meet\.google|teams|webinar|livestream|youtube)\b/i.test(first)) return '';
  return first;
}

export function validInterests(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const out: string[] = [];
  for (const r of raw) {
    const needle = String(r ?? '').trim().toLowerCase();
    const hit = INTEREST_TAGS.find((t) => t.toLowerCase() === needle);
    if (hit && !out.includes(hit)) out.push(hit);
  }
  return out;
}

export function channelHasIdentifier(ch: AudienceChannel, ids: { phone?: string | null; email?: string | null }): boolean {
  return ch === 'email' ? Boolean(ids.email) : Boolean(ids.phone);
}

const clean = (v: unknown, max = 120) => String(v ?? '').trim().slice(0, max);

function mergeSignals(a: Partial<AudienceSignals> | undefined, b: Partial<AudienceSignals> | undefined): AudienceSignals {
  const out = emptySignals();
  for (const src of [a, b]) {
    if (!src) continue;
    for (const k of ['views', 'registerClicks', 'contactClicks', 'registrations', 'paidBookings', 'paidTotalPesewas', 'attended', 'botQueries'] as const) {
      out[k] += Number(src[k]) || 0;
    }
    for (const k of ['categories', 'cities'] as const) {
      for (const [key, n] of Object.entries(src[k] || {})) out[k][key] = (out[k][key] || 0) + (Number(n) || 0);
    }
    if (src.lastActiveAt) out.lastActiveAt = src.lastActiveAt;
  }
  return out;
}

export interface UpsertContactInput {
  phone?: string;
  email?: string;
  name?: string;
  city?: string;
  interests?: string[];
  priceComfort?: PriceComfort;
  profession?: string;
  uid?: string;
  source: AudienceSource;
  consent?: { channels: AudienceChannel[]; wordingVersion?: string; at?: Date };
}

/**
 * Transactional merge into `audience/{id}`. Non-empty values are never replaced by empty ones; interests and
 * sources are unioned; channel consent only changes when `consent` is passed. If an email-keyed doc exists and a
 * phone is supplied, the email doc is folded into the phone-keyed doc and deleted.
 */
export async function upsertContact(db: Firestore, input: UpsertContactInput): Promise<{ id: string; created: boolean } | null> {
  const phone = normaliseGhPhone(input.phone);
  const email = normaliseEmail(input.email);
  const id = phone || (email ? emailId(email) : null);
  if (!id) return null;

  const col = db.collection(AUDIENCE_COLLECTION);
  const ref = col.doc(id);
  const oldRef = phone && email ? col.doc(emailId(email)) : null;

  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    const oldSnap = oldRef ? await tx.get(oldRef) : null;
    const cur: Record<string, any> = snap.exists ? snap.data()! : {};
    const old: Record<string, any> = oldSnap?.exists ? oldSnap.data()! : {};
    const now = new Date();

    const pick = (incoming: string, key: string) => incoming || cur[key] || old[key] || '';
    const doc: Record<string, any> = {
      interests: validInterests([...(old.interests || []), ...(cur.interests || []), ...(input.interests || [])]),
      sources: Array.from(new Set<string>([...(old.sources || []), ...(cur.sources || []), input.source])),
      channels: { ...(old.channels || {}), ...(cur.channels || {}) },
      consentLog: [...(old.consentLog || []), ...(cur.consentLog || [])] as ConsentLogEntry[],
      signals: mergeSignals(old.signals, cur.signals),
      createdAt: cur.createdAt || old.createdAt || now,
      updatedAt: now,
    };
    const finalPhone = phone || cur.phone || '';
    const finalEmail = cur.email || old.email || email || '';
    if (finalPhone) doc.phone = finalPhone;
    if (finalEmail) doc.email = finalEmail;
    const name = pick(clean(input.name), 'name');
    const city = pick(clean(input.city, 80), 'city');
    const profession = pick(clean(input.profession), 'profession');
    const uid = pick(clean(input.uid, 128), 'uid');
    if (name) doc.name = name;
    if (city) doc.city = city;
    if (profession) doc.profession = profession;
    if (uid) doc.uid = uid;
    const price = input.priceComfort && PRICE_COMFORTS.includes(input.priceComfort) ? input.priceComfort : cur.priceComfort || old.priceComfort;
    if (price) doc.priceComfort = price;
    const lastContactedAt = cur.lastContactedAt || old.lastContactedAt;
    if (lastContactedAt) doc.lastContactedAt = lastContactedAt;

    if (input.consent) {
      const at = input.consent.at instanceof Date && Number.isFinite(input.consent.at.getTime()) ? input.consent.at : now;
      const wordingVersion = clean(input.consent.wordingVersion, 40) || CONSENT_VERSION;
      const wanted = Array.from(new Set(input.consent.channels || [])).filter((c) => AUDIENCE_CHANNELS.includes(c));
      for (const ch of wanted) {
        if (!channelHasIdentifier(ch, { phone: finalPhone, email: finalEmail })) continue;
        doc.channels[ch] = { optedIn: true, at, source: input.source, wordingVersion };
        doc.consentLog.push({ channel: ch, action: 'opt_in', at, source: input.source, wordingVersion });
      }
    }
    doc.consentLog = doc.consentLog.slice(-CONSENT_LOG_CAP);

    tx.set(ref, doc);
    if (oldRef && oldSnap?.exists) tx.delete(oldRef);
    return { id, created: !snap.exists && !oldSnap?.exists };
  });
}

const COUNTER_BY_SIGNAL: Record<SignalType, string> = {
  view: 'views', register_click: 'registerClicks', contact_click: 'contactClicks', registration: 'registrations',
  paid_booking: 'paidBookings', attended: 'attended', bot_query: 'botQueries',
};

/** Increments behaviour counters. No-op when the contact doesn't exist. Never throws. */
export async function recordSignal(
  db: Firestore,
  contactId: string,
  s: { type: SignalType; category?: string; city?: string; amountPesewas?: number }
): Promise<void> {
  try {
    const counter = COUNTER_BY_SIGNAL[s.type];
    if (!counter || !isContactId(contactId)) return;
    const update: Record<string, unknown> = {
      [`signals.${counter}`]: FieldValue.increment(1),
      'signals.lastActiveAt': new Date(),
    };
    if (s.type === 'paid_booking' && Number(s.amountPesewas) > 0) {
      update['signals.paidTotalPesewas'] = FieldValue.increment(Math.round(Number(s.amountPesewas)));
    }
    const cat = slugKey(s.category);
    const city = slugKey(s.city);
    if (cat) update[`signals.categories.${cat}`] = FieldValue.increment(1);
    if (city) update[`signals.cities.${city}`] = FieldValue.increment(1);
    // update() fails with NOT_FOUND when the doc is missing, which is the no-op we want.
    await db.collection(AUDIENCE_COLLECTION).doc(contactId).update(update);
  } catch {
    // never throw from signal capture
  }
}

export function isContactId(v: unknown): v is string {
  return typeof v === 'string' && /^(\d{8,15}|e_[0-9a-f]{24})$/.test(v);
}

/** Marks one channel (or all) as opted out. Returns false when the contact doesn't exist. */
export async function optOut(db: Firestore, contactId: string, channel: AudienceChannel | 'all', source: AudienceSource): Promise<boolean> {
  if (!isContactId(contactId)) return false;
  if (channel !== 'all' && !AUDIENCE_CHANNELS.includes(channel)) return false;
  const ref = db.collection(AUDIENCE_COLLECTION).doc(contactId);
  return db.runTransaction(async (tx) => {
    const snap = await tx.get(ref);
    if (!snap.exists) return false;
    const cur = snap.data()!;
    const now = new Date();
    const channels: Record<string, any> = { ...(cur.channels || {}) };
    // 'all' also records an explicit opt-out for channels never opted into, so a later no-consent merge can't imply reachability.
    for (const ch of channel === 'all' ? AUDIENCE_CHANNELS : [channel]) {
      channels[ch] = { optedIn: false, at: now, source, wordingVersion: channels[ch]?.wordingVersion || CONSENT_VERSION };
    }
    const consentLog = [...(cur.consentLog || []), { channel, action: 'opt_out', at: now, source }].slice(-CONSENT_LOG_CAP);
    tx.update(ref, { channels, consentLog, updatedAt: now });
    return true;
  });
}

function secret(): string | null {
  return process.env.AUDIENCE_SECRET || process.env.CRON_SECRET || null;
}

function sign(contactId: string, key: string): string {
  return createHmac('sha256', key).update(contactId).digest('hex').slice(0, 16);
}

/** `${contactId}.${sig16}` — throws if no secret is configured. */
export function unsubscribeToken(contactId: string): string {
  const key = secret();
  if (!key) throw new Error('AUDIENCE_SECRET is not set');
  return `${contactId}.${sign(contactId, key)}`;
}

/** Returns the contactId when the token is valid, else null. */
export function verifyUnsubscribeToken(token: unknown): string | null {
  const key = secret();
  if (!key || typeof token !== 'string') return null;
  const at = token.lastIndexOf('.');
  if (at <= 0) return null;
  const contactId = token.slice(0, at);
  const sig = token.slice(at + 1);
  if (!isContactId(contactId) || sig.length !== 16) return null;
  const a = Buffer.from(sig);
  const b = Buffer.from(sign(contactId, key));
  return a.length === b.length && timingSafeEqual(a, b) ? contactId : null;
}

const CATEGORY_RULES: Array<[RegExp, string]> = [
  [/tech|software|developer|coding|\bai\b|data|digital|innovation/, 'Technology'],
  [/startup|founder|entrepreneur/, 'Startup'],
  [/financ|invest|fintech|money/, 'Finance'],
  [/educat|workshop|masterclass|bootcamp|training|seminar|lecture|school|learn/, 'Education'],
  [/network|meetup|meet_up|community|social|mixer/, 'Networking'],
  [/business|professional|conference|summit|exhibition|trade|career/, 'Business'],
  [/music|concert|festival|\bdj\b/, 'Music'],
  [/entertain|comedy|party|nightlife|film|movie|travel|adventure/, 'Entertainment'],
  [/art|culture|theatre|theater|poetry|museum/, 'Arts & Culture'],
  [/sport|fitness|run|football|gym/, 'Sports'],
  [/food|drink|dining|culinary/, 'Food & Drink'],
  [/health|wellness|yoga|mental/, 'Health & Wellness'],
  [/fashion|beauty/, 'Fashion'],
  [/charity|fundrais|impact|volunteer|ngo/, 'Social Impact'],
  [/faith|church|gospel|worship|religio|islam|christian/, 'Faith'],
];

/** Maps an event category (id or display name from lib/data/categories.ts, or free text) to the closest INTEREST_TAGS entry. */
export function categoryToInterest(category?: string): string | null {
  const raw = String(category ?? '').trim().toLowerCase();
  if (!raw || raw === 'other') return null;
  const exact = INTEREST_TAGS.find((t) => t.toLowerCase() === raw);
  if (exact) return exact;
  for (const [re, tag] of CATEGORY_RULES) if (re.test(raw)) return tag;
  return null;
}
