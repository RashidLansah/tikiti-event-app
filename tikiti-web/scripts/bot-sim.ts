// Dry-run conversation with the WhatsApp bot's PLANNING layer. Sends nothing: it only calls planBotReply (never
// sendBotPlan / the Graph API) and prints what would be sent. It does read live Firestore (events, scraped_events)
// and makes real Claude Haiku calls.
// Run: npx tsx scripts/bot-sim.ts
//   Loads .env.local (ANTHROPIC_API_KEY) and uses firebase-admin application-default credentials for tikiti-45ac4.
//   Session lives in wa_sessions/sim-bot-user and is deleted at the end, as are the bot_logs docs tagged sim: true.
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });
// Belt and braces: nothing here sends, but make a send impossible anyway.
delete process.env.WHATSAPP_ACCESS_TOKEN;
delete process.env.WHATSAPP_PHONE_NUMBER_ID;

import { initializeApp, getApps, applicationDefault } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const PROJECT_ID = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'tikiti-45ac4';
const FROM = 'sim-bot-user';

type Step = { text: string } | { buttonId: string };
const STEPS: Step[] = [
  { text: 'hi' },
  { buttonId: 'menu:find' },
  { text: 'any events this weekend?' },
  { text: 'what about online events?' },
  { text: '2' },
  { text: 'how much is it and how do I register?' },
  { text: 'is there parking?' },
  { text: 'thanks!' },
  { text: "please list my event, it's on 5th October at Alisa Hotel" },
];

// Second run: audience opt-in / STOP. The sender must be phone-like so contactIdFor() yields a contact id.
const OPTIN_FROM = '233200000003';
const OPTIN_STEPS: Array<{ text: string; expect: string }> = [
  { text: 'any free events this weekend?', expect: 'results + the opt-in offer' },
  { text: 'yes', expect: 'opt-in confirmation' },
  { text: 'any tech events?', expect: 'results and NO second offer' },
  { text: 'STOP', expect: 'opt-out reply' },
  { text: 'yes', expect: 'must NOT subscribe' },
];

async function runOptIn(db: FirebaseFirestore.Firestore) {
  const { planBotReply } = await import('../lib/bot/plan');
  const { persistBotSession, logBotPlan } = await import('../lib/bot/store');
  const sessionRef = db.collection('wa_sessions').doc(OPTIN_FROM);
  const contactRef = db.collection('audience').doc(OPTIN_FROM);
  await Promise.all([sessionRef.delete().catch(() => {}), contactRef.delete().catch(() => {})]);
  console.log(`\n\n════ Opt-in run (sim-bot-optin, sender ${OPTIN_FROM}) ════`);
  try {
    for (const [i, step] of OPTIN_STEPS.entries()) {
      console.log(`\n── ${i + 1}. user: ${JSON.stringify(step.text)}   [expect: ${step.expect}]`);
      try {
        const plan = await planBotReply(db, { from: OPTIN_FROM, hasRecentFlyer: false, text: step.text, profileName: 'Sim Optin' });
        if (!plan) console.log('   null → falls through to the existing flyer/text flow');
        else {
          console.log(`   intent: ${plan.intent}`);
          if (!plan.messages.length) console.log('   (no messages — consumed silently)');
          for (const m of plan.messages) console.log(`   • ${m.kind}\n${m.body.split('\n').map((l) => `       ${l}`).join('\n')}`);
          await persistBotSession(db, OPTIN_FROM, plan);
          await logBotPlan(db, plan, { sim: true });
        }
      } catch (e) {
        console.log(`   ERROR: ${(e as Error)?.message || e}`);
      }
      const c = (await contactRef.get()).data();
      console.log(`   → contact: ${c ? `channels.whatsapp.optedIn = ${c.channels?.whatsapp?.optedIn}, interests = ${JSON.stringify(c.interests || [])}, botQueries = ${c.signals?.botQueries ?? 0}` : '(no contact doc)'}`);
    }
  } finally {
    await Promise.all([sessionRef.delete().catch(() => {}), contactRef.delete().catch(() => {})]);
    console.log(`\nCleanup: deleted audience/${OPTIN_FROM} and wa_sessions/${OPTIN_FROM}.`);
  }
}

async function main() {
  if (!getApps().length) initializeApp({ credential: applicationDefault(), projectId: PROJECT_ID });
  const db = getFirestore();
  const { planBotReply } = await import('../lib/bot/plan');
  const { persistBotSession, logBotPlan } = await import('../lib/bot/store');

  const sessionRef = db.collection('wa_sessions').doc(FROM);
  await sessionRef.delete().catch(() => {});
  try {
    for (const [i, step] of STEPS.entries()) {
      const label = 'text' in step ? JSON.stringify(step.text) : `(button) ${step.buttonId}`;
      console.log(`\n── ${i + 1}. user: ${label}`);
      try {
        const plan = await planBotReply(db, { from: FROM, hasRecentFlyer: false, ...step });
        if (!plan) { console.log('   null → falls through to the existing flyer/text flow'); continue; }
        console.log(`   intent: ${plan.intent}   (${plan.log.ms} ms)`);
        if (!plan.messages.length) console.log('   (no messages — consumed silently)');
        for (const m of plan.messages) {
          const tag = m.kind === 'buttons' ? `buttons [${m.buttons.map((b) => `${b.id}="${b.title}"`).join(', ')}]` : `text${m.previewUrl ? ' +preview' : ''}`;
          console.log(`   • ${tag}\n${m.body.split('\n').map((l) => `       ${l}`).join('\n')}`);
        }
        await persistBotSession(db, FROM, plan);
        await logBotPlan(db, plan, { sim: true });
      } catch (e) {
        console.log(`   ERROR (the webhook would fall through): ${(e as Error)?.message || e}`);
      }
    }
    await runOptIn(db);
  } finally {
    await sessionRef.delete().catch(() => {});
    const logs = await db.collection('bot_logs').where('sim', '==', true).get();
    await Promise.all(logs.docs.map((d) => d.ref.delete()));
    console.log(`\nCleanup: deleted wa_sessions/${FROM} and ${logs.size} bot_logs doc(s) tagged sim: true.`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
