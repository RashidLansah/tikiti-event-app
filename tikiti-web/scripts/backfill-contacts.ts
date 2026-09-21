// Backfills events.contacts for community events published before the contacts list existed.
// For every events doc with source == 'community' that has organizerPhone or communityContact.phone but no contacts,
// sets contacts: [{ phone: <normalised> }]. Those fields only ever held the number printed on the flyer / caption
// (never the WhatsApp submitter's number), so this exposes nothing new.
// Run: npx tsx scripts/backfill-contacts.ts [--dry]
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore, FieldValue } from 'firebase-admin/firestore';
import { normaliseGhPhone, displayPhone } from '../lib/events/contact';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4';

async function main() {
  const dry = process.argv.includes('--dry');
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  const snap = await db.collection('events').where('source', '==', 'community').get();
  console.log(`${snap.size} community events${dry ? ' (dry run)' : ''}`);
  let changed = 0, already = 0, noPhone = 0, unusable = 0;
  for (const doc of snap.docs) {
    const d = doc.data();
    if (Array.isArray(d.contacts) && d.contacts.length) { already++; continue; }
    const raw = String(d.organizerPhone || d.communityContact?.phone || '').trim();
    if (!raw) { noPhone++; continue; }
    const phone = normaliseGhPhone(raw);
    if (!phone) { unusable++; console.log(`SKIP  ${doc.id} "${d.name}" — unusable phone "${raw}"`); continue; }
    if (!dry) await doc.ref.update({ contacts: [{ phone }], updatedAt: FieldValue.serverTimestamp() });
    changed++;
    console.log(`${dry ? 'WOULD SET' : 'SET'}  ${doc.id} "${d.name}" — "${raw}" -> ${displayPhone(phone)}`);
  }
  console.log(`\nDone: ${changed} updated, ${already} already had contacts, ${noPhone} without a phone, ${unusable} unusable.`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
