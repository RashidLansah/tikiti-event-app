// Read-only simulation of "Promote an event": match counts for the 3 soonest upcoming events in every mode, plus one
// dry-run send (limit 5). Prints counts only — never a name, phone or email — and NEVER sends (dryRun is hard-coded,
// and the send path is refused unless the result confirms it was a dry run).
// Run: npx tsx scripts/promo-sim.ts        (needs `gcloud auth application-default login` for tikiti-45ac4)
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { MATCH_MODES, matchAudienceForEvent } from '../lib/audience/match';
import { buildSms, channelStatus, sendEventPromo } from '../lib/audience/send';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4';
const EXCLUDED = new Set(['draft', 'archived', 'cancelled', 'inactive']);

async function main() {
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();
  const today = new Date().toISOString().slice(0, 10);
  const snap = await db.collection('events').select('name', 'date', 'status', 'isActive').get();
  const upcoming = snap.docs
    .filter((d) => d.data().isActive !== false && !EXCLUDED.has(String(d.data().status || '')) && String(d.data().date || '') >= today)
    .sort((a, b) => String(a.data().date).localeCompare(String(b.data().date)))
    .slice(0, 3);
  console.log(`upcoming events: ${upcoming.length} (of ${snap.size} total)`);
  const status = channelStatus();
  console.log('channel status:', Object.entries(status).map(([k, v]) => `${k}=${v ? `BLOCKED (${v})` : 'ready'}`).join(' | '));

  for (const d of upcoming) {
    for (const mode of MATCH_MODES) {
      const r = await matchAudienceForEvent(db, d.id, { mode });
      if (mode === MATCH_MODES[0]) {
        console.log(`\n== ${r.event.name} | ${r.event.date} | category="${r.event.category}" -> interest=${r.event.interest} | city="${r.event.city}" | online=${r.event.isOnline}${r.cityIgnored ? ' (location ignored)' : ''}`);
        console.log(`   sms (${buildSms(r.event).length} chars): ${buildSms(r.event)}`);
      }
      console.log(`   ${mode.padEnd(8)} matched=${r.matched} reasons=${JSON.stringify(r.byReason)} reachable=${JSON.stringify(r.reachable)} excluded=${JSON.stringify(r.excluded)} legacy=${JSON.stringify(r.legacyAttested)}`);
    }
  }

  if (upcoming[0]) {
    for (const channel of ['sms', 'whatsapp'] as const) {
      const r = await sendEventPromo(db, { eventId: upcoming[0].id, channel, mode: 'either', limit: 5, dryRun: true, adminEmail: 'promo-sim@local' });
      if (!r.dryRun) throw new Error('refusing: result was not a dry run');
      console.log(`\ndry-run send (${channel}, mode either, limit 5): status=${r.status} requested=${r.requested} sent=${r.sent} failed=${r.failed}${r.blockedReason ? ` blocked="${r.blockedReason}"` : ''} errors=${JSON.stringify(r.sampleErrors)}`);
    }
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
