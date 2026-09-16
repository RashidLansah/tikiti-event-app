// USSD session state, stored in Firestore `ussd_sessions/{sessionId}` with a 10-minute TTL.
import type { Firestore } from 'firebase-admin/firestore';

export const USSD_SESSION_TTL_MS = 10 * 60 * 1000;

export type UssdStep = 'list' | 'detail' | 'quantity' | 'confirm';

export interface UssdSessionState {
  step: UssdStep;
  page: number;          // 0-based page of the event list
  eventId: string | null;
  quantity: number | null;
}

export const INITIAL_SESSION: UssdSessionState = { step: 'list', page: 0, eventId: null, quantity: null };

export async function loadSession(db: Firestore, sessionId: string): Promise<UssdSessionState | null> {
  const snap = await db.collection('ussd_sessions').doc(sessionId).get();
  const d = snap.data();
  if (!d) return null;
  const updated = d.updatedAt?.toMillis ? d.updatedAt.toMillis() : new Date(d.updatedAt).getTime();
  if (!Number.isFinite(updated) || Date.now() - updated > USSD_SESSION_TTL_MS) return null;
  return {
    step: d.step || 'list',
    page: Number(d.page) || 0,
    eventId: d.eventId || null,
    quantity: d.quantity ?? null,
  };
}

export async function saveSession(
  db: Firestore,
  sessionId: string,
  state: UssdSessionState,
  meta: { msisdn: string; network?: string }
): Promise<void> {
  const ref = db.collection('ussd_sessions').doc(sessionId);
  const now = new Date();
  await ref.set(
    {
      ...state,
      msisdn: meta.msisdn,
      network: meta.network || null,
      updatedAt: now,
      expiresAt: new Date(now.getTime() + USSD_SESSION_TTL_MS),
    },
    { mergeFields: ['step', 'page', 'eventId', 'quantity', 'msisdn', 'network', 'updatedAt', 'expiresAt'] }
  );
  // Set createdAt only once.
  await ref.set({ createdAt: now }, { mergeFields: ['createdAt'] }).catch(() => undefined);
}

export async function clearSession(db: Firestore, sessionId: string): Promise<void> {
  await db.collection('ussd_sessions').doc(sessionId).delete().catch(() => undefined);
}
