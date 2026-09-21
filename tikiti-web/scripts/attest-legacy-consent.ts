// Marks backfilled past registrants as opted in, on the owner's attestation that they agreed to hear from Tikiti.
// Recorded honestly: wordingVersion 'legacy-owner-attested' (NOT the v1 checkbox wording), so these stay distinguishable.
// Never touches a channel that already has a decision (an opt-in or an opt-out), so STOP / unsubscribe always wins.
// Run: npx tsx scripts/attest-legacy-consent.ts [--commit]      (default is a dry run that prints counts only)
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { AUDIENCE_COLLECTION, type AudienceChannel } from '../lib/audience/types';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4';
const WORDING = 'legacy-owner-attested';
const LOG_CAP = 40;

async function main() {
  const commit = process.argv.includes('--commit');
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();

  const snap = await db.collection(AUDIENCE_COLLECTION).where('sources', 'array-contains', 'backfill').get();
  const t = { contacts: snap.size, updated: 0, untouched: 0, whatsapp: 0, sms: 0, email: 0, keptOptOuts: 0 };

  for (const d of snap.docs) {
    const c = d.data();
    const channels: Record<string, any> = { ...(c.channels || {}) };
    const wanted: AudienceChannel[] = [...(c.phone ? (['whatsapp', 'sms'] as AudienceChannel[]) : []), ...(c.email ? (['email'] as AudienceChannel[]) : [])];
    const now = new Date();
    const added: AudienceChannel[] = [];
    for (const ch of wanted) {
      if (channels[ch]) { if (channels[ch].optedIn === false) t.keptOptOuts++; continue; }
      channels[ch] = { optedIn: true, at: now, source: 'backfill', wordingVersion: WORDING };
      added.push(ch);
      t[ch]++;
    }
    if (!added.length) { t.untouched++; continue; }
    t.updated++;
    if (!commit) continue;
    const consentLog = [
      ...(c.consentLog || []),
      ...added.map((channel) => ({ channel, action: 'opt_in', at: now, source: 'backfill', wordingVersion: WORDING })),
    ].slice(-LOG_CAP);
    await d.ref.update({ channels, consentLog, updatedAt: now });
  }

  console.log(commit ? 'COMMITTED' : 'DRY RUN (nothing written)');
  console.log(t);
}

main().catch((e) => { console.error(e); process.exit(1); });
