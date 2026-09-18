// WhatsApp alerts to admins when a new flyer lands in the community inbox.
//
// The alert is an interactive "reply button" message (Approve / Reject) whose button ids are
// `approve:<inboxId>` / `reject:<inboxId>`; the WhatsApp webhook (app/api/inbox/whatsapp/route.ts) turns those
// replies — or typed `approve <REF>` / `reject <REF>` commands, where REF is the last 6 chars of the inbox id —
// into publishInboxItem / rejectInboxItem calls.
//
// Env: INBOX_ADMIN_PHONES (comma-separated E.164 without '+'), WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
//      WHATSAPP_ALERT_TEMPLATE (optional approved utility template used when the 24h session window is closed —
//      templates can't carry these buttons, so that path falls back to the review link; see
//      docs/whatsapp-alert-template.md).
// Never throws: every failure is logged and swallowed so callers can fire-and-forget.

const GRAPH = 'https://graph.facebook.com/v21.0';
const REVIEW_URL = 'https://www.gettikiti.com/admin/inbox';

export interface SubmissionSummary {
  /** event_inbox doc id; required for the Approve / Reject buttons and the Ref code */
  inboxId?: string | null;
  senderName?: string | null;
  submittedBy?: string | null;
  name?: string | null;
  date?: string | null;
  startTime?: string | null;
  location?: string | null;
  confidence?: number | null;
  missingFields?: string[] | null;
}

export function adminPhones(): string[] {
  return (process.env.INBOX_ADMIN_PHONES || '')
    .split(',')
    .map((p) => p.trim().replace(/^\+/, ''))
    .filter(Boolean);
}

export function isAdminPhone(waId: string | null | undefined): boolean {
  if (!waId) return false;
  return adminPhones().includes(waId.replace(/^\+/, ''));
}

/** Short code admins can type to target an item: last 6 chars of the inbox id, upper-cased. */
export function inboxRef(inboxId: string): string {
  return inboxId.slice(-6).toUpperCase();
}

export function buildAlertText(item: SubmissionSummary): string {
  const sender = item.senderName || item.submittedBy || 'unknown';
  const name = item.name || '(untitled)';
  const pct = Math.round(Math.max(0, Math.min(1, item.confidence ?? 0)) * 100);
  const missing = (item.missingFields || []).filter(Boolean);
  const date = item.date || 'date?';
  const time = item.startTime ? ` · ${item.startTime}` : '';
  const venue = item.location || 'venue?';
  const missingStr = missing.length ? `\nMissing: ${missing.join(', ')}` : '';
  const refStr = item.inboxId ? `\nRef ${inboxRef(item.inboxId)}` : '';
  return `New flyer from ${sender}\n"${name}"\n${date}${time} · ${venue}\n${pct}% confidence${missingStr}${refStr}\n\nTap Approve to publish under Tikiti Community, or review: ${REVIEW_URL}`;
}

/** True when Graph rejects a free-form message because the customer-service window is closed. */
export function isWindowClosedError(body: any): boolean {
  const err = body?.error;
  if (!err) return false;
  if (err.code === 131047 || err.error_data?.details?.includes?.('131047')) return true;
  const msg = `${err.message || ''} ${err.error_data?.details || ''}`.toLowerCase();
  return msg.includes('re-engagement') || msg.includes('24');
}

/** Low-level Graph send; shared with lib/inbox/notifySubmitter.ts. */
export async function postMessage(phoneNumberId: string, token: string, payload: Record<string, any>) {
  const res = await fetch(`${GRAPH}/${phoneNumberId}/messages`, {
    method: 'POST',
    headers: { authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', recipient_type: 'individual', ...payload }),
  });
  const body: any = await res.json().catch(() => ({}));
  return { ok: res.ok, status: res.status, body };
}

function alertPayload(to: string, item: SubmissionSummary, text: string): Record<string, any> {
  if (!item.inboxId) return { to, type: 'text', text: { body: text } };
  return {
    to,
    type: 'interactive',
    interactive: {
      type: 'button',
      body: { text },
      action: {
        buttons: [
          { type: 'reply', reply: { id: `approve:${item.inboxId}`, title: 'Approve' } },
          { type: 'reply', reply: { id: `reject:${item.inboxId}`, title: 'Reject' } },
        ],
      },
    },
  };
}

export async function notifyAdminsOfSubmission(item: SubmissionSummary): Promise<void> {
  const phones = adminPhones();
  if (!phones.length) return;
  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    console.warn('notifyAdmins: skipped, WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured');
    return;
  }
  const template = (process.env.WHATSAPP_ALERT_TEMPLATE || '').trim();
  const text = buildAlertText(item);
  const name = item.name || '(untitled)';
  const sender = item.senderName || item.submittedBy || 'unknown';

  await Promise.all(phones.map(async (to) => {
    try {
      const first = await postMessage(phoneNumberId, token, alertPayload(to, item, text));
      if (first.ok) return;
      if (isWindowClosedError(first.body) && template) {
        const second = await postMessage(phoneNumberId, token, {
          to,
          type: 'template',
          template: {
            name: template,
            language: { code: 'en' },
            components: [{ type: 'body', parameters: [{ type: 'text', text: name }, { type: 'text', text: sender }] }],
          },
        });
        if (!second.ok) console.error('notifyAdmins: template send failed', to, second.status, JSON.stringify(second.body).slice(0, 300));
        return;
      }
      console.error('notifyAdmins: alert send failed', to, first.status, JSON.stringify(first.body).slice(0, 300));
    } catch (e) {
      console.error('notifyAdmins: send error', to, e);
    }
  }));
}
