// WhatsApp Cloud API (Meta Graph API) inbound webhook for the community event inbox.
//
//   GET  /api/inbox/whatsapp  — Meta verification handshake (hub.mode / hub.verify_token / hub.challenge)
//   POST /api/inbox/whatsapp  — message notifications, signed with X-Hub-Signature-256 (HMAC-SHA256 of raw body)
//
// Flow per message:
//   image → download media from Graph → store flyer in Storage → create event_inbox doc (source 'whatsapp')
//           → run Claude extraction inline (bounded by EXTRACTION_TIMEOUT_MS) → auto-reply
//   text  → if the same sender has a pending flyer from the last 30 min, append the text to its caption
//           (+ extraTexts) and re-run extraction → reply "Added to your event"; otherwise create an
//           event_inbox doc with no image (needsImage: true) when it contains a URL or looks like event
//           details → auto-reply asking for the flyer
//   image → if the same sender has a text-only (needsImage) item from the last 30 min, attach the image to it
//   new image submissions are triaged first (lib/inbox/triage.ts): not-an-event / past / duplicate flyers are
//           stored as status 'rejected' with rejectedReason and get a tailored reply instead of full extraction;
//           accepted ones proceed as above and alert admins via WhatsApp (lib/inbox/notifyAdmins.ts)
//   statuses / other types → ignored
// Every message id is recorded in whatsapp_messages/{id} so Meta retries are de-duplicated.
// The route always answers 200 once the signature is valid; Meta retries on non-200.
//
// Env: WHATSAPP_VERIFY_TOKEN, WHATSAPP_APP_SECRET, WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID
//
// Local testing hook (never active when NODE_ENV === 'production'): if the request carries an
// `x-tikiti-test-image` header with a base64 image (optionally a data: URL), it is used instead of the
// Graph media download, so scripts/whatsapp-sim.ts can exercise the full path without a real media id.
import { NextRequest, NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'crypto';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { inboxCollection, storeFlyer } from '@/lib/inbox/admin';
import { emptyExtraction, extractEventFromFlyer, type SupportedMime } from '@/lib/inbox/extract';
import { triage, type TriageResult } from '@/lib/inbox/triage';
import { notifyAdminsOfSubmission } from '@/lib/inbox/notifyAdmins';

export const runtime = 'nodejs';
export const maxDuration = 60;

const GRAPH = 'https://graph.facebook.com/v21.0';
const PROCESSED_COLLECTION = 'whatsapp_messages';
const SUPPORTED: SupportedMime[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024;
const EXTRACTION_TIMEOUT_MS = 20_000;
const TRIAGE_TIMEOUT_MS = 15_000;

const REPLY_IMAGE = "Got it! We'll review this event and list it on Tikiti soon. 🎟";
const REPLY_TEXT = 'Thanks! Please forward the event flyer image too so we can list it.';
const REPLY_MERGED = 'Added to your event — thanks!';
const MERGE_WINDOW_MS = 30 * 60 * 1000;
const REQUIRED_FIELDS = ['name', 'date', 'startTime', 'location'];

type WaMessage = {
  id: string;
  from: string;
  type: string;
  timestamp?: string;
  text?: { body?: string };
  image?: { id: string; mime_type?: string; caption?: string; sha256?: string };
};
type WaContact = { wa_id?: string; profile?: { name?: string } };

// ---------- GET: verification handshake ----------
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const mode = sp.get('hub.mode');
  const token = sp.get('hub.verify_token');
  const challenge = sp.get('hub.challenge') || '';
  const expected = process.env.WHATSAPP_VERIFY_TOKEN;
  if (mode === 'subscribe' && expected && token === expected) {
    return new NextResponse(challenge, { status: 200, headers: { 'content-type': 'text/plain' } });
  }
  return new NextResponse('Forbidden', { status: 403 });
}

// ---------- POST: message notifications ----------
export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  if (!verifySignature(rawBody, req.headers.get('x-hub-signature-256'))) {
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let payload: any;
  try {
    payload = JSON.parse(rawBody);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const testImage = process.env.NODE_ENV !== 'production' ? (req.headers.get('x-tikiti-test-image') || payload?._tikitiTestImage || null) : null;

  try {
    for (const entry of payload?.entry || []) {
      for (const change of entry?.changes || []) {
        const value = change?.value;
        if (!value || value.messaging_product !== 'whatsapp') continue;
        const contacts: WaContact[] = value.contacts || [];
        for (const message of (value.messages || []) as WaMessage[]) {
          try {
            await handleMessage(message, contacts, testImage);
          } catch (e) {
            console.error('whatsapp webhook: failed to handle message', message?.id, e);
          }
        }
      }
    }
  } catch (e) {
    console.error('whatsapp webhook: payload processing error', e);
  }
  return NextResponse.json({ ok: true }, { status: 200 });
}

// ---------- helpers ----------
function verifySignature(rawBody: string, header: string | null): boolean {
  const secret = process.env.WHATSAPP_APP_SECRET;
  if (!secret || !header || !header.startsWith('sha256=')) return false;
  const expected = Buffer.from(createHmac('sha256', secret).update(rawBody, 'utf8').digest('hex'), 'utf8');
  const received = Buffer.from(header.slice('sha256='.length), 'utf8');
  return expected.length === received.length && timingSafeEqual(expected, received);
}

/** Records message id; returns false if it was already processed (Meta retry). */
async function claimMessage(message: WaMessage): Promise<boolean> {
  const ref = getAdminFirestore().collection(PROCESSED_COLLECTION).doc(message.id);
  try {
    await ref.create({ from: message.from, type: message.type, receivedAt: FieldValue.serverTimestamp() });
    return true;
  } catch (e: any) {
    if (e?.code === 6 || /already exists/i.test(String(e?.message))) return false; // ALREADY_EXISTS
    throw e;
  }
}

function senderNameFor(message: WaMessage, contacts: WaContact[]): string | null {
  const match = contacts.find((c) => c.wa_id === message.from) || contacts[0];
  return match?.profile?.name?.trim() || null;
}

function looksLikeEventText(text: string): boolean {
  if (/https?:\/\/\S+|www\.\S+/i.test(text)) return true;
  const signals = [
    /\bevent\b/i, /\bconcert\b/i, /\bparty\b/i, /\bfestival\b/i, /\bshow\b/i, /\bconference\b/i, /\bworkshop\b/i,
    /\bsummit\b/i, /\bvenue\b/i, /\btickets?\b/i, /\bfree entry\b/i, /\bgh[sc₵]\s?\d/i, /\bghs?\b/i,
    /\b\d{1,2}(st|nd|rd|th)?\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)/i,
    /\b(mon|tue|wed|thu|fri|sat|sun)[a-z]*day\b/i, /\b\d{1,2}\s?(am|pm)\b/i, /\b\d{1,2}:\d{2}\b/,
  ];
  return signals.filter((r) => r.test(text)).length >= 2 || text.length > 120;
}

async function handleMessage(message: WaMessage, contacts: WaContact[], testImage: string | null) {
  if (!message?.id || !message.from) return;
  if (message.type !== 'image' && message.type !== 'text') return;
  if (!(await claimMessage(message))) {
    console.log('whatsapp webhook: duplicate message skipped', message.id);
    return;
  }

  const senderName = senderNameFor(message, contacts);
  const base = {
    status: 'pending',
    source: 'whatsapp',
    submittedBy: message.from,
    senderName,
    whatsappMessageId: message.id,
    publishedEventId: null,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  };

  if (message.type === 'text') {
    const text = (message.text?.body || '').trim();
    if (!text) {
      await sendReply(message.from, REPLY_TEXT);
      return;
    }

    // Follow-up text for a flyer this sender just sent → merge into that item
    const recent = await findRecentPending(message.from, (d) => !d.needsImage && !!d.imageUrl);
    if (recent) {
      const data = recent.data()!;
      const caption = [data.caption, text].filter(Boolean).join('\n');
      const update: Record<string, any> = {
        caption,
        extraTexts: FieldValue.arrayUnion(text),
        updatedAt: FieldValue.serverTimestamp(),
      };
      try {
        const { buffer, mimeType } = await downloadStoredFlyer(data.imageUrl);
        const extracted = await withTimeout(
          extractEventFromFlyer(buffer.toString('base64'), mimeType, caption),
          EXTRACTION_TIMEOUT_MS,
          'Extraction timed out',
        );
        update.extracted = extracted;
        update.confidence = extracted.confidence;
        update.missingFields = extracted.missingFields;
        update.extractionError = null;
      } catch (e: any) {
        console.error('whatsapp webhook: re-extraction after text merge failed', e);
        update.extractionError = e?.message || 'Extraction failed';
      }
      await recent.ref.update(update);
      await sendReply(message.from, REPLY_MERGED);
      return;
    }

    if (!looksLikeEventText(text)) {
      await sendReply(message.from, REPLY_TEXT);
      return;
    }
    const extracted = emptyExtraction();
    extracted.missingFields = [...REQUIRED_FIELDS];
    await inboxCollection().doc().set({
      ...base,
      imagePath: '',
      imageUrl: null,
      caption: text,
      needsImage: true,
      extracted,
      confidence: 0,
      missingFields: extracted.missingFields,
      extractionError: null,
    });
    await sendReply(message.from, REPLY_TEXT);
    return;
  }

  // image
  const imageCaption = (message.image?.caption || '').trim();
  const { buffer, mimeType } = await fetchImage(message, testImage);
  if (!buffer.length) throw new Error('Downloaded image is empty');
  if (buffer.length > MAX_BYTES) throw new Error('Image exceeds 8MB');
  if (!SUPPORTED.includes(mimeType)) throw new Error(`Unsupported image type ${mimeType}`);

  // Reverse order: the sender texted the details first, now the flyer arrives → attach to that item
  const textOnly = await findRecentPending(message.from, (d) => !!d.needsImage);
  const ref = textOnly ? textOnly.ref : inboxCollection().doc();
  const caption = textOnly
    ? [textOnly.data()?.caption, imageCaption].filter(Boolean).join('\n')
    : imageCaption;
  const { imagePath, imageUrl } = await storeFlyer(ref.id, buffer, mimeType);
  const imageBase64 = buffer.toString('base64');

  // Triage only brand-new image submissions (not image-attach to an existing text item)
  let triageResult: TriageResult | null = null;
  if (!textOnly) {
    try {
      triageResult = await withTimeout(
        triage(getAdminFirestore(), imageBase64, mimeType, caption || undefined),
        TRIAGE_TIMEOUT_MS,
        'Triage timed out',
      );
    } catch (e) {
      console.error('whatsapp webhook: triage failed, accepting submission', e);
    }
  }
  if (triageResult && triageResult.decision !== 'accept') {
    const rejectedReason = triageResult.decision.replace(/^reject_/, '') as 'not_event' | 'past' | 'duplicate';
    const extracted = emptyExtraction();
    extracted.name = triageResult.meta.eventName || '';
    extracted.date = triageResult.meta.date || '';
    extracted.endDate = extracted.date;
    extracted.missingFields = REQUIRED_FIELDS.filter((f) => !(extracted as any)[f]);
    await ref.set({
      ...base,
      status: 'rejected',
      rejectedReason,
      rejectedAt: FieldValue.serverTimestamp(),
      triage: triageResult.meta,
      imagePath,
      imageUrl,
      caption,
      extracted,
      confidence: 0,
      missingFields: extracted.missingFields,
      extractionError: null,
    });
    await sendReply(message.from, triageResult.reply);
    return;
  }

  let extracted = emptyExtraction();
  let extractionError: string | null = null;
  try {
    extracted = await withTimeout(
      extractEventFromFlyer(imageBase64, mimeType, caption || undefined),
      EXTRACTION_TIMEOUT_MS,
      'Extraction timed out',
    );
  } catch (e: any) {
    console.error('whatsapp webhook: flyer extraction failed', e);
    extractionError = e?.message || 'Extraction failed';
    extracted.missingFields = [...REQUIRED_FIELDS];
  }

  if (textOnly) {
    await ref.update({
      imagePath,
      imageUrl,
      caption,
      needsImage: false,
      whatsappImageMessageId: message.id,
      extracted,
      confidence: extracted.confidence,
      missingFields: extracted.missingFields,
      extractionError,
      updatedAt: FieldValue.serverTimestamp(),
    });
    await sendReply(message.from, REPLY_IMAGE);
    notifyAdminsOfSubmission({
      senderName,
      submittedBy: message.from,
      name: extracted.name,
      date: extracted.date,
      confidence: extracted.confidence,
      missingFields: extracted.missingFields,
    }).catch((e) => console.error('whatsapp webhook: admin alert failed', e));
    return;
  }

  await ref.set({
    ...base,
    imagePath,
    imageUrl,
    caption,
    extracted,
    confidence: extracted.confidence,
    missingFields: extracted.missingFields,
    extractionError,
    triage: triageResult ? triageResult.meta : null,
  });
  await sendReply(message.from, REPLY_IMAGE);
  notifyAdminsOfSubmission({
    senderName,
    submittedBy: message.from,
    name: extracted.name,
    date: extracted.date,
    confidence: extracted.confidence,
    missingFields: extracted.missingFields,
  }).catch((e) => console.error('whatsapp webhook: admin alert failed', e));
}

/**
 * Most recent pending event_inbox item from this sender created within MERGE_WINDOW_MS that passes `accept`.
 * Queries only submittedBy + createdAt (index {submittedBy ASC, createdAt DESC}) and filters status/time in code.
 */
async function findRecentPending(
  waId: string,
  accept: (data: FirebaseFirestore.DocumentData) => boolean,
): Promise<FirebaseFirestore.QueryDocumentSnapshot | null> {
  try {
    const snap = await inboxCollection().where('submittedBy', '==', waId).orderBy('createdAt', 'desc').limit(5).get();
    const cutoff = Date.now() - MERGE_WINDOW_MS;
    for (const doc of snap.docs) {
      const d = doc.data();
      if (d.status !== 'pending') continue;
      const created = typeof d.createdAt?.toMillis === 'function' ? d.createdAt.toMillis() : 0;
      if (created < cutoff) continue;
      if (accept(d)) return doc;
    }
  } catch (e) {
    console.error('whatsapp webhook: recent-item lookup failed', e);
  }
  return null;
}

/** Re-downloads a stored flyer (public Storage URL) so it can be re-extracted with a richer caption. */
async function downloadStoredFlyer(imageUrl: string): Promise<{ buffer: Buffer; mimeType: SupportedMime }> {
  const res = await fetch(imageUrl);
  if (!res.ok) throw new Error(`Could not fetch stored flyer (${res.status})`);
  const ct = (res.headers.get('content-type') || '').split(';')[0].trim();
  const byExt = imageUrl.endsWith('.png') ? 'image/png' : imageUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const mimeType = (SUPPORTED.includes(ct as SupportedMime) ? ct : byExt) as SupportedMime;
  return { buffer: Buffer.from(await res.arrayBuffer()), mimeType };
}

async function fetchImage(message: WaMessage, testImage: string | null): Promise<{ buffer: Buffer; mimeType: SupportedMime }> {
  if (testImage) {
    const m = testImage.match(/^data:([^;]+);base64,([\s\S]*)$/);
    const mime = (m ? m[1] : message.image?.mime_type || 'image/jpeg') as SupportedMime;
    return { buffer: Buffer.from(m ? m[2] : testImage, 'base64'), mimeType: mime };
  }
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  if (!token) throw new Error('WHATSAPP_ACCESS_TOKEN is not configured');
  const mediaId = message.image?.id;
  if (!mediaId) throw new Error('Image message has no media id');

  const metaRes = await fetch(`${GRAPH}/${mediaId}`, { headers: { authorization: `Bearer ${token}` } });
  if (!metaRes.ok) throw new Error(`Graph media lookup failed ${metaRes.status}: ${(await metaRes.text().catch(() => '')).slice(0, 200)}`);
  const meta: any = await metaRes.json();
  if (!meta?.url) throw new Error('Graph media lookup returned no url');

  const binRes = await fetch(meta.url, { headers: { authorization: `Bearer ${token}` } });
  if (!binRes.ok) throw new Error(`Graph media download failed ${binRes.status}`);
  const mimeType = ((meta.mime_type || message.image?.mime_type || binRes.headers.get('content-type') || 'image/jpeg') as string)
    .split(';')[0].trim() as SupportedMime;
  return { buffer: Buffer.from(await binRes.arrayBuffer()), mimeType };
}

async function sendReply(to: string, body: string) {
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    console.warn('whatsapp webhook: reply skipped, WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured');
    return;
  }
  try {
    const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
      method: 'POST',
      headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
      body: JSON.stringify({ messaging_product: 'whatsapp', to, type: 'text', text: { body } }),
    });
    if (!res.ok) console.error('whatsapp webhook: reply failed', res.status, (await res.text().catch(() => '')).slice(0, 300));
  } catch (e) {
    console.error('whatsapp webhook: reply error', e);
  }
}

function withTimeout<T>(p: Promise<T>, ms: number, msg: string): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new Error(msg)), ms);
    p.then((v) => { clearTimeout(t); resolve(v); }, (e) => { clearTimeout(t); reject(e); });
  });
}
