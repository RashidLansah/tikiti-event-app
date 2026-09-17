// Cheap pre-extraction triage for flyer submissions: is it an event, is it upcoming, is it already listed?
// Runs one small Haiku vision call plus two index-free Firestore lookups. Never throws on the model call
// path being unavailable — callers decide what to do with 'unclear'.
import type { Firestore } from 'firebase-admin/firestore';
import type { SupportedMime } from './extract';
import { INBOX_COLLECTION } from './admin';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const TRIAGE_MODEL = 'claude-haiku-4-5-20251001';
const SITE_URL = 'https://www.gettikiti.com';

export type FlyerKind = 'event' | 'not_event' | 'unclear';

export interface FlyerClassification {
  kind: FlyerKind;
  eventName?: string;
  date?: string | null;
  reason: string;
}

export interface DuplicateMatch {
  type: 'event' | 'inbox';
  id: string;
  name: string;
  publishedEventId?: string;
}

export type TriageDecision = 'accept' | 'reject_not_event' | 'reject_past' | 'reject_duplicate';

export interface TriageMeta {
  kind: FlyerKind;
  eventName: string | null;
  date: string | null;
  reason: string;
  isPast: boolean;
  duplicate: DuplicateMatch | null;
  model: string;
}

export interface TriageResult {
  decision: TriageDecision;
  reply: string;
  meta: TriageMeta;
}

export const TRIAGE_REPLIES = {
  not_event: "That doesn't look like an event flyer. Please send the event poster (with date and venue) and we'll list it on Tikiti.",
  past: "Looks like this event has already happened, so we won't list it. Send us upcoming ones anytime!",
  duplicate: 'Thanks — this one is already on Tikiti!',
} as const;

/** Today's calendar date in Africa/Accra as YYYY-MM-DD. */
export function todayInAccra(now = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Africa/Accra', year: 'numeric', month: '2-digit', day: '2-digit' }).format(now);
}

function parseJson(text: string): any {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error('Triage model did not return JSON');
}

function buildPrompt(caption?: string): string {
  const today = todayInAccra();
  const year = Number(today.slice(0, 4));
  return `Classify this image. Is it a flyer/poster advertising an event (concert, party, conference, workshop, church service, sports, etc.)?
Today's date is ${today} (Ghana).${caption ? `\nSender's caption: """${caption}"""` : ''}
Return ONLY JSON: {"kind":"event"|"not_event"|"unclear","eventName":string,"date":"YYYY-MM-DD"|null,"reason":string}
- kind: "event" if it advertises a specific event; "not_event" for memes, selfies, receipts, product ads, screenshots of chats, etc.; "unclear" if you cannot tell.
- eventName: the event title as printed, "" if none.
- date: the event's start date. If the year is missing, assume ${year} if that date is still upcoming, otherwise ${year + 1}. null if no date is visible.
- reason: one short sentence.`;
}

export async function classifyFlyer(imageBase64: string, mimeType: SupportedMime, caption?: string): Promise<FlyerClassification> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured on the server');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', 'x-api-key': apiKey, 'anthropic-version': '2023-06-01' },
    body: JSON.stringify({
      model: TRIAGE_MODEL,
      max_tokens: 300,
      messages: [
        {
          role: 'user',
          content: [
            { type: 'image', source: { type: 'base64', media_type: mimeType, data: imageBase64 } },
            { type: 'text', text: buildPrompt(caption) },
          ],
        },
      ],
    }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Anthropic API error ${res.status}: ${body.slice(0, 300)}`);
  }
  const json: any = await res.json();
  if (json.stop_reason === 'refusal') throw new Error('The model declined to process this image');
  const text = (json.content || []).filter((b: any) => b.type === 'text').map((b: any) => b.text).join('\n');
  const raw = parseJson(text);
  const kind: FlyerKind = raw?.kind === 'event' || raw?.kind === 'not_event' ? raw.kind : 'unclear';
  const date = typeof raw?.date === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(raw.date) ? raw.date : null;
  return {
    kind,
    eventName: raw?.eventName ? String(raw.eventName).trim() : undefined,
    date,
    reason: raw?.reason ? String(raw.reason).trim() : '',
  };
}

// ---------- fuzzy name matching ----------
const STOPWORDS = new Set([
  'the', 'a', 'an', 'and', 'or', 'of', 'in', 'at', 'on', 'to', 'for', 'with', 'by', 'from', 'edition', 'event', 'live',
  'presents', 'ft', 'feat', 'featuring', 'vs', 'x', 'official', 'night', 'day', 'party', 'show', 'concert', '2024', '2025', '2026', '2027',
]);

export function normaliseName(name: string): string[] {
  return name
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((t) => t && !STOPWORDS.has(t));
}

export function namesMatch(a: string, b: string): boolean {
  const ta = normaliseName(a);
  const tb = normaliseName(b);
  if (!ta.length || !tb.length) return false;
  const ja = ta.join(' ');
  const jb = tb.join(' ');
  if (ja === jb) return true;
  if (ja.includes(jb) || jb.includes(ja)) return true;
  const setB = new Set(tb);
  const overlap = ta.filter((t) => setB.has(t)).length;
  return overlap / Math.min(ta.length, tb.length) >= 0.6;
}

/**
 * Looks for an existing event (any source, not cancelled/archived, same date) or a pending/published inbox item
 * whose name fuzzily matches. Uses only single-field equality queries so no composite index is required.
 */
export async function findDuplicate(db: Firestore, name: string, date: string | null): Promise<DuplicateMatch | null> {
  if (!name || !normaliseName(name).length) return null;

  if (date) {
    try {
      const snap = await db.collection('events').where('date', '==', date).limit(50).get();
      for (const doc of snap.docs) {
        const d = doc.data();
        if (d.status === 'cancelled' || d.status === 'archived') continue;
        const candidate = String(d.name || d.title || '');
        if (namesMatch(name, candidate)) return { type: 'event', id: doc.id, name: candidate, publishedEventId: doc.id };
      }
    } catch (e) {
      console.error('triage: events duplicate lookup failed', e);
    }
  }

  for (const status of ['pending', 'published'] as const) {
    try {
      const snap = await db.collection(INBOX_COLLECTION).where('status', '==', status).limit(200).get();
      for (const doc of snap.docs) {
        const d = doc.data();
        const candidate = String(d.extracted?.name || '');
        if (!candidate) continue;
        const candDate = String(d.extracted?.date || '');
        if (date && candDate && candDate !== date) continue;
        if (namesMatch(name, candidate)) {
          return { type: 'inbox', id: doc.id, name: candidate, publishedEventId: d.publishedEventId || undefined };
        }
      }
    } catch (e) {
      console.error(`triage: inbox (${status}) duplicate lookup failed`, e);
    }
  }
  return null;
}

/** Full triage: classify → past check → duplicate check. Reject decisions carry the WhatsApp reply text. */
export async function triage(db: Firestore, imageBase64: string, mimeType: SupportedMime, caption?: string): Promise<TriageResult> {
  const c = await classifyFlyer(imageBase64, mimeType, caption);
  const meta: TriageMeta = {
    kind: c.kind,
    eventName: c.eventName || null,
    date: c.date || null,
    reason: c.reason,
    isPast: false,
    duplicate: null,
    model: TRIAGE_MODEL,
  };

  if (c.kind === 'not_event') {
    return { decision: 'reject_not_event', reply: TRIAGE_REPLIES.not_event, meta };
  }

  if (c.date && c.date < todayInAccra()) {
    meta.isPast = true;
    return { decision: 'reject_past', reply: TRIAGE_REPLIES.past, meta };
  }

  if (c.eventName) {
    const dup = await findDuplicate(db, c.eventName, c.date || null);
    if (dup) {
      meta.duplicate = dup;
      const link = dup.publishedEventId ? ` ${SITE_URL}/events/${dup.publishedEventId}` : '';
      return { decision: 'reject_duplicate', reply: `${TRIAGE_REPLIES.duplicate}${link}`, meta };
    }
  }

  return { decision: 'accept', reply: '', meta };
}
