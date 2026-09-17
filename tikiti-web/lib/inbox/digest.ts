// Daily WhatsApp digest of flyers auto-rejected by triage in the last 24h.
//
// Sent to INBOX_ADMIN_PHONES via the Graph API, mirroring lib/inbox/notifyAdmins.ts (plain text first, falling
// back to the WHATSAPP_ALERT_TEMPLATE utility template when the 24h customer-service window is closed).
// Triggered by GET/POST /api/inbox/digest (cron). Never throws.

import type { Firestore, Timestamp } from 'firebase-admin/firestore';
import { adminPhones } from './notifyAdmins';
import type { InboxRejectedReason } from './admin';

const GRAPH = 'https://graph.facebook.com/v21.0';
const REVIEW_URL = 'https://www.gettikiti.com/admin/inbox';
const LOOKBACK_MS = 24 * 60 * 60 * 1000;
const MAX_ITEMS = 50;
const MAX_LISTED = 8;

const REASON_LABELS: Record<InboxRejectedReason, string> = {
  not_event: 'Not an event',
  past: 'Past event',
  duplicate: 'Duplicate',
};

export interface DigestItem {
  reason: InboxRejectedReason | string | null;
  name: string | null;
  sender: string | null;
}

function reasonLabel(reason: DigestItem['reason']): string {
  return (reason && REASON_LABELS[reason as InboxRejectedReason]) || 'Rejected';
}

export function buildDigestText(items: DigestItem[]): string {
  const n = items.length;
  const lines = items.slice(0, MAX_LISTED).map((it) =>
    `• ${reasonLabel(it.reason)} — "${it.name || 'untitled'}" from ${it.sender || 'unknown'}`,
  );
  if (n > MAX_LISTED) lines.push(`…and ${n - MAX_LISTED} more`);
  return `Tikiti inbox — last 24h\n${n} flyer(s) auto-rejected:\n${lines.join('\n')}\nSee them under Rejected: ${REVIEW_URL}`;
}

function toMillis(v: any): number | null {
  if (!v) return null;
  if (typeof v.toMillis === 'function') return (v as Timestamp).toMillis();
  if (v instanceof Date) return v.getTime();
  if (typeof v === 'number') return v;
  if (typeof v === 'string') { const t = Date.parse(v); return Number.isNaN(t) ? null : t; }
  return null;
}

async function loadRejectedLast24h(db: Firestore): Promise<DigestItem[]> {
  const since = Date.now() - LOOKBACK_MS;
  // Single-field filter only, so no composite index is needed; the time window is applied in code.
  const snap = await db.collection('event_inbox').where('status', '==', 'rejected').get();
  const rows: Array<{ ts: number; item: DigestItem }> = [];
  for (const doc of snap.docs) {
    const d = doc.data();
    const ts = toMillis(d.createdAt);
    if (ts === null || ts < since) continue;
    rows.push({
      ts,
      item: {
        reason: d.rejectedReason || null,
        name: d.triage?.eventName || d.triage?.meta?.eventName || d.extracted?.name || null,
        sender: d.senderName || d.submittedBy || null,
      },
    });
  }
  rows.sort((a, b) => b.ts - a.ts);
  return rows.slice(0, MAX_ITEMS).map((r) => r.item);
}

function isWindowClosedError(body: any): boolean {
  const err = body?.error;
  if (!err) return false;
  if (err.code === 131047 || err.error_data?.details?.includes?.('131047')) return true;
  const msg = `${err.message || ''} ${err.error_data?.details || ''}`.toLowerCase();
  return msg.includes('re-engagement') || msg.includes('24');
}

async function postMessage(phoneNumberId: string, token: string, payload: Record<string, any>) {
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...payload }),
  });
  const body: any = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

/** Sends the digest to every admin. Returns how many admins were messaged and how many items were included. */
export async function sendRejectionDigest(db: Firestore): Promise<{ sent: number; count: number }> {
  try {
    const items = await loadRejectedLast24h(db);
    if (!items.length) return { sent: 0, count: 0 };

    const phones = adminPhones();
    const token = process.env.WHATSAPP_ACCESS_TOKEN;
    const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
    if (!phones.length || !token || !phoneNumberId) {
      console.warn('inbox digest: skipped, INBOX_ADMIN_PHONES / WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured');
      return { sent: 0, count: items.length };
    }
    const template = (process.env.WHATSAPP_ALERT_TEMPLATE || '').trim();
    const text = buildDigestText(items);
    let sent = 0;

    await Promise.all(phones.map(async (to) => {
      try {
        const first = await postMessage(phoneNumberId, token, { to, type: 'text', text: { body: text } });
        if (first.ok) { sent++; return; }
        if (isWindowClosedError(first.body) && template) {
          const second = await postMessage(phoneNumberId, token, {
            to,
            type: 'template',
            template: {
              name: template,
              language: { code: 'en' },
              components: [{ type: 'body', parameters: [
                { type: 'text', text: `${items.length} auto-rejected flyer(s) in the last 24h` },
                { type: 'text', text: 'Tikiti inbox digest' },
              ] }],
            },
          });
          if (second.ok) { sent++; return; }
          console.error('inbox digest: template send failed', to, second.status, JSON.stringify(second.body).slice(0, 300));
          return;
        }
        console.error('inbox digest: send failed', to, first.status, JSON.stringify(first.body).slice(0, 300));
      } catch (e) {
        console.error('inbox digest: send error', to, e);
      }
    }));
    return { sent, count: items.length };
  } catch (e) {
    console.error('inbox digest: failed', e);
    return { sent: 0, count: 0 };
  }
}
