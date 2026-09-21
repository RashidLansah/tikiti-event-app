// Flyer -> event JSON extraction via the Anthropic Messages API (plain fetch; SDK not installed)
import { eventCategories } from '@/lib/data/categories';
import { classifyUrl, platformFromUrl } from '@/lib/events/links';
import { MAX_CONTACTS, REGISTRATION_METHODS } from '@/lib/events/contact';
import type { ExtractedContact, ExtractedEvent, ExtractedSpeaker } from './admin';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';

export const EXTRACTION_FIELDS = [
  'name', 'description', 'category', 'date', 'endDate', 'startTime', 'endTime', 'location', 'address', 'city',
  'price', 'isFree', 'registrationUrl', 'joinUrl', 'meetingPlatform', 'meetingDetails', 'contactPhone', 'contacts', 'registrationMethod', 'organiserName', 'speakers', 'confidence', 'missingFields',
] as const;

export function emptyExtraction(): ExtractedEvent {
  return {
    name: '', description: '', category: 'other', date: '', endDate: '', startTime: '', endTime: '',
    location: '', address: '', city: '', price: 0, isFree: true, registrationUrl: '', joinUrl: '', meetingPlatform: '', meetingDetails: '', contactPhone: '',
    contacts: [], registrationMethod: 'unknown',
    organiserName: '', speakers: [], confidence: 0, missingFields: [],
  };
}

function buildPrompt(caption?: string) {
  const today = new Date();
  const year = today.getFullYear();
  const categoryIds = eventCategories.map((c) => c.id).join(', ');
  return `You are extracting structured event details from an event flyer image (often forwarded from a WhatsApp group in Ghana).
Today's date is ${today.toISOString().slice(0, 10)}.
${caption ? `The person who shared the flyer added this caption: """${caption}"""\n` : ''}
Return ONLY a JSON object (no markdown, no prose) with exactly these fields:
- name: string — the event title
- description: string — 2 to 3 sentences describing the event, written by you from what the flyer says
- category: one of [${categoryIds}]
- date: "YYYY-MM-DD" start date. If the year is missing, assume ${year} if that date is still upcoming, otherwise ${year + 1}
- endDate: "YYYY-MM-DD" for multi-day events, else same as date
- startTime: "HH:mm" 24-hour, "" if unknown
- endTime: "HH:mm" 24-hour, "" if unknown
- location: venue name
- address: street address / landmark, "" if unknown
- city: city or town, "" if unknown
- price: number in GHS (0 if free). If several tiers, use the cheapest general ticket
- isFree: boolean
- registrationUrl: URL or "" — a link to SIGN UP: a registration form, ticket page or the event website (Google Forms, Eventbrite, Luma, bit.ly…)
- joinUrl: URL or "" — a link to JOIN the session itself (Zoom, Google Meet, Microsoft Teams, YouTube/Facebook live). A link to JOIN
  the session is joinUrl, a link to SIGN UP is registrationUrl; never put the same URL in both
- meetingPlatform: one of ["zoom", "google_meet", "teams", "youtube", "other"], or "" if the event is not online
- meetingDetails: string — read any Meeting ID / Passcode / dial-in printed on the flyer, e.g. "Meeting ID 123 456 7890 · Passcode 9876"; "" if none
- contacts: array (max 4) of every ENQUIRY / organiser phone number printed on the flyer or written in the caption, in the order
  they appear, each { "name": string, "phone": string, "whatsapp": boolean }. "name" is the person or label next to the number
  ("" if none), "phone" is the number exactly as printed (international or local format), "whatsapp" is true only when the flyer
  or caption marks that number with a WhatsApp icon or the word WhatsApp. Empty array if there are no numbers
- contactPhone: the first contact's phone, "" if none
- registrationMethod: one of ["link", "contact", "walk_in", "unknown"] — how a person attends. "link" = they sign up or join via a
  URL; "contact" = they must call / WhatsApp / DM someone ("call to register", "DM for tickets", "for tickets call", "RSVP to 024…");
  "walk_in" = just show up, no sign-up; "unknown" if the flyer does not say
- organiserName: organiser / host name, "" if unknown
- speakers: array of people printed on the flyer, each { "name": string, "title": string, "organisation": string, "role": string }.
  Read every named person: speakers, panellists, moderators, discussants, hosts, keynote speakers, research fellows, etc.
  "title" is their job title (e.g. "Senior Lecturer", "CEO"), "organisation" their institution/company, "role" their role at the
  event (e.g. "Speaker", "Moderator", "Discussant", "Research Fellow", "Keynote"). Use "" for unknown parts. Empty array if none
- confidence: number 0-1, your overall confidence in the extraction
- missingFields: array of field names (from the list above) you could not determine from the flyer
Never invent details that are not on the flyer or in the caption. Use "" or 0 for unknown values and list them in missingFields.`;
}

function parseJson(text: string): any {
  const trimmed = text.trim().replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '');
  try { return JSON.parse(trimmed); } catch { /* fall through */ }
  const start = trimmed.indexOf('{');
  const end = trimmed.lastIndexOf('}');
  if (start >= 0 && end > start) return JSON.parse(trimmed.slice(start, end + 1));
  throw new Error('Model did not return JSON');
}

export function normaliseSpeakers(raw: any): ExtractedSpeaker[] {
  if (!Array.isArray(raw)) return [];
  const str = (v: any) => (v == null ? '' : String(v).trim());
  const out: ExtractedSpeaker[] = [];
  for (const s of raw) {
    const name = typeof s === 'string' ? str(s) : str(s?.name);
    if (!name) continue;
    const sp: ExtractedSpeaker = { name };
    const title = str(s?.title || s?.jobTitle);
    const organisation = str(s?.organisation || s?.organization || s?.company);
    const role = str(s?.role);
    if (title) sp.title = title;
    if (organisation) sp.organisation = organisation;
    if (role) sp.role = role;
    out.push(sp);
  }
  return out;
}

/** Shape written to events/{id}.speakers (organisation → company, matching the speaker profile shape). */
export function toEventSpeakers(speakers: ExtractedSpeaker[]) {
  return speakers.map((s) => ({
    name: s.name,
    title: s.title || '',
    company: s.organisation || '',
    bio: '',
    role: s.role || 'Speaker',
  }));
}

/** Trims, drops blank numbers, de-duplicates on digits and caps at 4. Numbers stay as printed; publish normalises them. */
export function normaliseExtractedContacts(raw: any, fallbackPhone = ''): ExtractedContact[] {
  const str = (v: any) => (v == null ? '' : String(v).trim());
  const list: any[] = Array.isArray(raw) ? [...raw] : [];
  if (fallbackPhone) list.push({ phone: fallbackPhone });
  const out: ExtractedContact[] = [];
  const seen = new Set<string>();
  for (const c of list) {
    const phone = typeof c === 'string' || typeof c === 'number' ? str(c) : str(c?.phone);
    const digits = phone.replace(/\D/g, '').replace(/^(00233|233|0)/, '');
    if (digits.length < 7 || seen.has(digits)) continue;
    seen.add(digits);
    const entry: ExtractedContact = { phone };
    const name = str(c?.name);
    if (name) entry.name = name;
    if (c?.whatsapp === true) entry.whatsapp = true;
    out.push(entry);
    if (out.length >= MAX_CONTACTS) break;
  }
  return out;
}

const PLATFORMS = ['zoom', 'google_meet', 'teams', 'youtube', 'other'];

/**
 * Fixes links the model filed under the wrong field: a join-type URL in registrationUrl moves to joinUrl and a
 * registration-type URL in joinUrl moves to registrationUrl (swapped when both are wrong; never overwrites a correct one).
 */
export function reconcileLinks<T extends { registrationUrl: string; joinUrl: string; meetingPlatform: ExtractedEvent['meetingPlatform'] }>(f: T, text = ''): Pick<T, 'registrationUrl' | 'joinUrl' | 'meetingPlatform'> {
  let { registrationUrl, joinUrl } = f;
  const regKind = registrationUrl ? classifyUrl(registrationUrl, text) : null;
  const joinKind = joinUrl ? classifyUrl(joinUrl, text) : null;
  if (regKind === 'join' && joinKind === 'registration') [registrationUrl, joinUrl] = [joinUrl, registrationUrl];
  else if (regKind === 'join' && (!joinUrl || joinUrl === registrationUrl)) { joinUrl = registrationUrl; registrationUrl = ''; }
  else if (joinKind === 'registration' && (!registrationUrl || registrationUrl === joinUrl)) { registrationUrl = joinUrl; joinUrl = ''; }
  const detected = joinUrl ? platformFromUrl(joinUrl) : null;
  const meetingPlatform = (joinUrl ? (detected && detected !== 'other' ? detected : f.meetingPlatform || 'other') : f.meetingPlatform) as T['meetingPlatform'];
  return { registrationUrl, joinUrl, meetingPlatform };
}

function normalise(raw: any): ExtractedEvent {
  const base = emptyExtraction();
  const str = (v: any) => (v == null ? '' : String(v).trim());
  const price = Number(raw?.price);
  const validCategory = eventCategories.some((c) => c.id === raw?.category) ? raw.category : 'other';
  const out: ExtractedEvent = {
    ...base,
    name: str(raw?.name),
    description: str(raw?.description),
    category: validCategory,
    date: str(raw?.date),
    endDate: str(raw?.endDate) || str(raw?.date),
    startTime: str(raw?.startTime),
    endTime: str(raw?.endTime),
    location: str(raw?.location),
    address: str(raw?.address),
    city: str(raw?.city),
    price: Number.isFinite(price) && price > 0 ? price : 0,
    isFree: typeof raw?.isFree === 'boolean' ? raw.isFree : !(Number.isFinite(price) && price > 0),
    registrationUrl: str(raw?.registrationUrl),
    joinUrl: str(raw?.joinUrl),
    meetingPlatform: PLATFORMS.includes(raw?.meetingPlatform) ? raw.meetingPlatform : '',
    meetingDetails: str(raw?.meetingDetails),
    contactPhone: str(raw?.contactPhone),
    contacts: normaliseExtractedContacts(raw?.contacts, str(raw?.contactPhone)),
    registrationMethod: REGISTRATION_METHODS.includes(raw?.registrationMethod) ? raw.registrationMethod : 'unknown',
    organiserName: str(raw?.organiserName),
    speakers: normaliseSpeakers(raw?.speakers),
    confidence: Math.max(0, Math.min(1, Number(raw?.confidence) || 0)),
    missingFields: Array.isArray(raw?.missingFields) ? raw.missingFields.map(String) : [],
  };
  if (out.isFree) out.price = 0;
  out.contactPhone = out.contacts[0]?.phone || '';
  Object.assign(out, reconcileLinks(out, `${out.name} ${out.description}`));
  // Derive missing fields for anything the model left blank but did not flag
  const required: (keyof ExtractedEvent)[] = ['name', 'date', 'startTime', 'location'];
  for (const f of required) {
    if (!out[f] && !out.missingFields.includes(f)) out.missingFields.push(f);
  }
  return out;
}

export type SupportedMime = 'image/jpeg' | 'image/png' | 'image/webp' | 'image/gif';

export async function extractEventFromFlyer(imageBase64: string, mimeType: SupportedMime, caption?: string): Promise<ExtractedEvent> {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not configured on the server');

  const res = await fetch(ANTHROPIC_URL, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 2048,
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
  return normalise(parseJson(text));
}
