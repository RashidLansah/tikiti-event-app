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
  } finally {
    await sessionRef.delete().catch(() => {});
    const logs = await db.collection('bot_logs').where('sim', '==', true).get();
    await Promise.all(logs.docs.map((d) => d.ref.delete()));
    console.log(`\nCleanup: deleted wa_sessions/${FROM} and ${logs.size} bot_logs doc(s) tagged sim: true.`);
  }
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
