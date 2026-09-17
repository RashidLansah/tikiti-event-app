// Flyer -> event JSON extraction via the Anthropic Messages API (plain fetch; SDK not installed)
import { eventCategories } from '@/lib/data/categories';
import type { ExtractedEvent } from './admin';

const ANTHROPIC_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = 'claude-sonnet-5';

export const EXTRACTION_FIELDS = [
  'name', 'description', 'category', 'date', 'endDate', 'startTime', 'endTime', 'location', 'address', 'city',
  'price', 'isFree', 'registrationUrl', 'contactPhone', 'organiserName', 'confidence', 'missingFields',
] as const;

export function emptyExtraction(): ExtractedEvent {
  return {
    name: '', description: '', category: 'other', date: '', endDate: '', startTime: '', endTime: '',
    location: '', address: '', city: '', price: 0, isFree: true, registrationUrl: '', contactPhone: '',
    organiserName: '', confidence: 0, missingFields: [],
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
- registrationUrl: URL or "" — a website, ticket link or registration link printed on the flyer
- contactPhone: phone number in international or local format, "" if none
- organiserName: organiser / host name, "" if unknown
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
    contactPhone: str(raw?.contactPhone),
    organiserName: str(raw?.organiserName),
    confidence: Math.max(0, Math.min(1, Number(raw?.confidence) || 0)),
    missingFields: Array.isArray(raw?.missingFields) ? raw.missingFields.map(String) : [],
  };
  if (out.isFree) out.price = 0;
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
