// Firestore writes for the WhatsApp bot: session merge + bot_logs. Sends nothing. Never throws.
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import type { BotPlan } from './types';

const SESSIONS = 'wa_sessions';
const LOGS = 'bot_logs';

/**
 * Merges the plan's session fields into wa_sessions/{from}. planBotReply only returns a plan when no submitter-edit
 * `pick_item` prompt is live, so any `awaiting` fields still on the doc are expired leftovers; they are removed here
 * because the bot's own `expiresAt` would otherwise bring that stale prompt back to life.
 */
export async function persistBotSession(db: Firestore, from: string, plan: BotPlan): Promise<void> {
  if (!plan.session) return;
  try {
    await db.collection(SESSIONS).doc(from).set({
      ...plan.session,
      awaiting: FieldValue.delete(),
      pendingText: FieldValue.delete(),
      candidateIds: FieldValue.delete(),
    }, { merge: true });
  } catch (e) {
    console.error('bot: could not persist session', from, e);
  }
}

/** bot_logs/{auto}: { from, text, intent, pickedIds, eventId, ms, at } (+ any extra fields, e.g. sim: true). */
export async function logBotPlan(db: Firestore, plan: BotPlan, extra: Record<string, unknown> = {}): Promise<void> {
  try {
    await db.collection(LOGS).add({ ...plan.log, ...extra, at: FieldValue.serverTimestamp() });
  } catch (e) {
    console.error('bot: could not write bot_logs', e);
  }
}
