// POST /api/inbox/submit — upload a flyer, extract event details with Claude, create inbox doc (admin only)
// Triage (not-event / past / duplicate) runs too but never auto-rejects here: its result is stored as `triage`
// and echoed in the response as `warnings` so the admin UI can show badges.
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { inboxCollection, isAdminResponse, requireAdmin, serializeInbox, storeFlyer, type InboxSource } from '@/lib/inbox/admin';
import { emptyExtraction, extractEventFromFlyer, type SupportedMime } from '@/lib/inbox/extract';
import { triage, type TriageMeta } from '@/lib/inbox/triage';
import { notifyAdminsOfSubmission } from '@/lib/inbox/notifyAdmins';
import { getAdminFirestore } from '@/lib/firebase/admin';

export const runtime = 'nodejs';
export const maxDuration = 60;

const SUPPORTED: SupportedMime[] = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
const MAX_BYTES = 8 * 1024 * 1024;

async function readBody(req: NextRequest): Promise<{ imageBase64: string; mimeType: string; caption: string; source: InboxSource }> {
  const ct = req.headers.get('content-type') || '';
  if (ct.includes('multipart/form-data')) {
    const form = await req.formData();
    const file = form.get('image') ?? form.get('file');
    if (!(file instanceof File)) throw new Error('image file is required');
    const buf = Buffer.from(await file.arrayBuffer());
    return {
      imageBase64: buf.toString('base64'),
      mimeType: file.type || 'image/jpeg',
      caption: String(form.get('caption') || ''),
      source: (String(form.get('source') || 'upload') as InboxSource),
    };
  }
  const json = await req.json();
  const raw: string = json.imageBase64 || '';
  // Accept data URLs too
  const match = raw.match(/^data:([^;]+);base64,([\s\S]*)$/);
  return {
    imageBase64: match ? match[2] : raw,
    mimeType: json.mimeType || (match ? match[1] : 'image/jpeg'),
    caption: String(json.caption || ''),
    source: (json.source || 'upload') as InboxSource,
  };
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  try {
    const { imageBase64, mimeType, caption, source } = await readBody(req);
    if (!imageBase64) return NextResponse.json({ error: 'imageBase64 is required' }, { status: 400 });
    if (!SUPPORTED.includes(mimeType as SupportedMime)) {
      return NextResponse.json({ error: `Unsupported image type ${mimeType}. Use JPEG, PNG, WebP or GIF.` }, { status: 400 });
    }
    const buffer = Buffer.from(imageBase64, 'base64');
    if (!buffer.length) return NextResponse.json({ error: 'Image is empty' }, { status: 400 });
    if (buffer.length > MAX_BYTES) return NextResponse.json({ error: 'Image must be under 8MB' }, { status: 400 });
    const validSource: InboxSource = ['upload', 'whatsapp', 'email'].includes(source) ? source : 'upload';

    const ref = inboxCollection().doc();
    const { imagePath, imageUrl } = await storeFlyer(ref.id, buffer, mimeType);

    let triageMeta: TriageMeta | null = null;
    const warnings: { past?: boolean; duplicate?: TriageMeta['duplicate']; notEvent?: boolean } = {};
    try {
      const t = await triage(getAdminFirestore(), imageBase64, mimeType as SupportedMime, caption || undefined);
      triageMeta = t.meta;
      if (t.decision === 'reject_past') warnings.past = true;
      if (t.decision === 'reject_duplicate') warnings.duplicate = t.meta.duplicate;
      if (t.decision === 'reject_not_event') warnings.notEvent = true;
    } catch (e) {
      console.error('Flyer triage failed', e);
    }

    let extracted = emptyExtraction();
    let extractionError: string | null = null;
    try {
      extracted = await extractEventFromFlyer(imageBase64, mimeType as SupportedMime, caption || undefined);
    } catch (e: any) {
      console.error('Flyer extraction failed', e);
      extractionError = e.message || 'Extraction failed';
      extracted.missingFields = ['name', 'date', 'startTime', 'location'];
    }

    await ref.set({
      status: 'pending',
      imagePath,
      imageUrl,
      caption: caption || '',
      source: validSource,
      submittedBy: admin.uid,
      submittedByEmail: admin.email,
      extracted,
      confidence: extracted.confidence,
      missingFields: extracted.missingFields,
      publishedEventId: null,
      extractionError,
      triage: triageMeta,
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });
    const snap = await ref.get();
    notifyAdminsOfSubmission({
      inboxId: ref.id,
      senderName: admin.email,
      submittedBy: admin.uid,
      name: extracted.name,
      date: extracted.date,
      startTime: extracted.startTime,
      location: extracted.location,
      confidence: extracted.confidence,
      missingFields: extracted.missingFields,
    }).catch((e) => console.error('inbox submit: admin alert failed', e));
    return NextResponse.json({ item: serializeInbox(ref.id, snap.data()!), warnings }, { status: 201 });
  } catch (e: any) {
    console.error('inbox submit error', e);
    return NextResponse.json({ error: e.message || 'Failed to submit flyer' }, { status: 500 });
  }
}
