// Sends ONE sample "What's on in Tamale" digest to a single hard-coded address. Reads Firestore, writes nothing.
// Run: npx tsx scripts/send-sample-digest.ts
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { loadCatalogue, formatDay, priceLabel } from '../lib/bot/catalogue';
import { contactIdFor, unsubscribeToken } from '../lib/audience/contacts';
import { buildEventsDigestEmail, type DigestEvent } from '../lib/email/eventsDigestEmail';
import { sendEmail } from '../lib/email/send';
import { AUDIENCE_COLLECTION } from '../lib/audience/types';

const TO = 'rashidlancergh2@gmail.com';
const SITE = 'https://www.gettikiti.com';
const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4';

const mock = (name: string, category: string, date: string, time: string, venue: string, price?: string): DigestEvent =>
  ({ name, category, date: formatDay(date), time, venue, price, url: `${SITE}/events` });
const MOCKS: DigestEvent[] = [
  mock('Tamale Tech Meetup: Building for the North', 'Technology', '2026-09-26', '4:00 PM', 'HOPin Academy, Tamale'),
  mock('Dagbon Arts Night', 'Arts & Culture', '2026-10-02', '7:00 PM', 'Centre for National Culture, Tamale', 'GH₵40'),
  mock('Northern Startup Pitch Evening', 'Business', '2026-10-06', '5:30 PM', 'Radach Lodge & Conference Centre, Tamale', 'GH₵60'),
  mock('Tamale Health Walk', 'Health & Wellness', '2026-10-10', '6:00 AM', 'Jubilee Park, Tamale'),
  mock('Savannah Sounds Live', 'Music', '2026-10-11', '8:00 PM', 'Aliu Mahama Sports Stadium forecourt, Tamale', 'GH₵80'),
];

async function main() {
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  const real = (await loadCatalogue(db))
    .filter((e) => e.collection === 'events' && /tamale/i.test(`${e.venue} ${e.address} ${e.city}`))
    .slice(0, 5);
  const cards: DigestEvent[] = [];
  for (const e of real) {
    const d = (await db.collection('events').doc(e.id).get()).data() || {};
    const hasPoster = (typeof d.imageBase64 === 'string' && d.imageBase64.length > 0) || /^https?:\/\//.test(String(d.coverImage || d.imageUrl || ''));
    cards.push({
      name: e.name, category: e.category, date: formatDay(e.date), time: e.time,
      venue: [e.venue, e.city].filter(Boolean).join(', ') || e.address, price: priceLabel(e),
      url: `${SITE}/events/${e.id}`, posterUrl: hasPoster ? `${SITE}/api/events/${e.id}/poster` : undefined,
    });
  }
  const realCount = cards.length;
  if (realCount < 3) cards.push(...MOCKS.slice(0, 5 - realCount));

  let unsubscribeUrl = `${SITE}/unsubscribe`;
  const contactId = contactIdFor({ email: TO });
  if (contactId && (await db.collection(AUDIENCE_COLLECTION).doc(contactId).get()).exists) {
    try { unsubscribeUrl = `${SITE}/unsubscribe?t=${encodeURIComponent(unsubscribeToken(contactId))}`; } catch { /* no secret → generic link */ }
  }

  const { subject, html, text } = buildEventsDigestEmail({ city: 'Tamale', events: cards, recipientName: 'Rashid Lansah', unsubscribeUrl, subjectPrefix: '[SAMPLE] ' });
  let id = '';
  const status = await sendEmail({ to: TO, subject, html, text, tag: 'sample-digest', onId: (v) => { id = v; } });
  console.log(`status=${status} id=${id} cards=${cards.length} real=${realCount} mock=${cards.length - realCount} posters=${cards.filter((c) => c.posterUrl).length} signedUnsub=${unsubscribeUrl.includes('?t=')}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
