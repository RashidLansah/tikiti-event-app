// Re-runs Claude extraction for an existing event_inbox item (e.g. after the extraction schema gained new fields)
// and, if the item was already published, updates the event doc's speakers.
// Run: npx tsx scripts/reextract-inbox.ts <inboxId>
//   Loads .env.local (ANTHROPIC_API_KEY) and uses firebase-admin application-default credentials for tikiti-45ac4.
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4';

async function main() {
  const inboxId = process.argv[2];
  if (!inboxId) {
    console.error('Usage: npx tsx scripts/reextract-inbox.ts <inboxId>');
    process.exit(1);
  }
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  // Imported after env is loaded (extract.ts reads ANTHROPIC_API_KEY at call time, but keep ordering explicit)
  const { extractEventFromFlyer, toEventSpeakers } = await import('../lib/inbox/extract');
  type SupportedMime = import('../lib/inbox/extract').SupportedMime;

  const ref = db.collection('event_inbox').doc(inboxId);
  const snap = await ref.get();
  if (!snap.exists) throw new Error(`event_inbox/${inboxId} not found`);
  const data = snap.data()!;
  if (!data.imageUrl) throw new Error('Inbox item has no imageUrl to re-extract from');

  console.log(`Fetching ${data.imageUrl}`);
  const res = await fetch(data.imageUrl);
  if (!res.ok) throw new Error(`Image fetch failed ${res.status}`);
  const ct = (res.headers.get('content-type') || '').split(';')[0].trim();
  const byExt = data.imageUrl.endsWith('.png') ? 'image/png' : data.imageUrl.endsWith('.webp') ? 'image/webp' : 'image/jpeg';
  const mimeType = (['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(ct) ? ct : byExt) as SupportedMime;
  const buffer = Buffer.from(await res.arrayBuffer());

  console.log(`Extracting (${mimeType}, ${Math.round(buffer.length / 1024)} KB)…`);
  const extracted = await extractEventFromFlyer(buffer.toString('base64'), mimeType, data.caption || undefined);

  // Keep any admin-edited values from the previous extraction; only fold in the fresh speakers + confidence.
  const merged = { ...(data.extracted || {}), speakers: extracted.speakers };
  await ref.update({ extracted: merged, updatedAt: FieldValue.serverTimestamp() });
  console.log(`Updated event_inbox/${inboxId}.extracted.speakers (${extracted.speakers.length} speakers)`);

  if (data.publishedEventId) {
    const eventSpeakers = toEventSpeakers(extracted.speakers);
    await db.collection('events').doc(data.publishedEventId).update({ speakers: eventSpeakers, updatedAt: FieldValue.serverTimestamp() });
    console.log(`Updated events/${data.publishedEventId}.speakers`);
  }

  console.log('\nSpeakers found:');
  for (const s of extracted.speakers) {
    console.log(`- ${s.name}${s.role ? ` · ${s.role}` : ''}${s.title ? ` · ${s.title}` : ''}${s.organisation ? ` · ${s.organisation}` : ''}`);
  }
  if (!extracted.speakers.length) console.log('(none)');
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
