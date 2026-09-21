// Builds audience contacts (NO consent) + behaviour signals from existing confirmed/used bookings.
// Run: npx tsx scripts/backfill-audience.ts [--commit]      (default is a dry run that prints counts only)
// Bookings already captured live (audienceRecorded: true) are skipped; committed bookings get that flag.
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { cityFromLocation, contactIdFor, recordSignal, upsertContact } from '../lib/audience/contacts';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4';

async function main() {
  const commit = process.argv.includes('--commit');
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  const snap = await db.collection('bookings').where('status', 'in', ['confirmed', 'used']).get();
  const events = new Map<string, FirebaseFirestore.DocumentData | null>();
  const eventFor = async (id?: string) => {
    if (!id) return null;
    if (!events.has(id)) events.set(id, (await db.collection('events').doc(id).get()).data() || null);
    return events.get(id)!;
  };

  const contacts = new Map<string, { phone: boolean; paid: boolean }>();
  const t = { bookings: snap.size, alreadyRecorded: 0, noIdentifier: 0, registrations: 0, paidBookings: 0, paidPesewas: 0 };

  for (const d of snap.docs) {
    const b = d.data();
    if (b.audienceRecorded === true) { t.alreadyRecorded++; continue; }
    const id = contactIdFor({ phone: b.phoneNumber, email: b.userEmail });
    if (!id) { t.noIdentifier++; continue; }
    const paid = b.paymentStatus === 'paid' && Number(b.gross) > 0;
    const c = contacts.get(id) || { phone: !id.startsWith('e_'), paid: false };
    if (paid) { c.paid = true; t.paidBookings++; t.paidPesewas += Number(b.gross); } else t.registrations++;
    contacts.set(id, c);

    if (commit) {
      const ev = await eventFor(b.eventId);
      const res = await upsertContact(db, {
        phone: b.phoneNumber, email: b.userEmail, name: b.userName, city: cityFromLocation(b.eventLocation), uid: b.userId, source: 'backfill',
      });
      if (!res) continue;
      await recordSignal(db, res.id, {
        type: paid ? 'paid_booking' : 'registration', category: ev?.category,
        city: cityFromLocation(ev?.city || b.eventLocation || ev?.location), amountPesewas: paid ? Number(b.gross) : undefined,
      });
      await d.ref.update({ audienceRecorded: true });
    }
  }

  // How many of these contact ids already exist
  let existing = 0;
  const ids = [...contacts.keys()];
  for (let i = 0; i < ids.length; i += 300) {
    const refs = ids.slice(i, i + 300).map((id) => db.collection('audience').doc(id));
    if (refs.length && !commit) existing += (await db.getAll(...refs)).filter((s) => s.exists).length;
  }

  const all = [...contacts.values()];
  console.log(commit ? 'COMMITTED' : 'DRY RUN (nothing written; pass --commit to write)');
  console.log(`bookings confirmed/used: ${t.bookings} | already recorded: ${t.alreadyRecorded} | no usable phone/email: ${t.noIdentifier}`);
  console.log(`contacts: ${all.length} (with phone ${all.filter((c) => c.phone).length}, email-only ${all.filter((c) => !c.phone).length})${commit ? '' : ` | already in audience: ${existing} | would be created: ${all.length - existing}`}`);
  console.log(`paid-before contacts: ${all.filter((c) => c.paid).length} | signals: registrations ${t.registrations}, paidBookings ${t.paidBookings}, paid total GHS ${(t.paidPesewas / 100).toFixed(2)}`);
  console.log('Consent: none (backfilled contacts are insight-only).');
}

main().catch((e) => { console.error(e.message || e); process.exit(1); });
