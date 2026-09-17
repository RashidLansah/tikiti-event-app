// WhatsApp alerts to admins when a new flyer lands in the community inbox.
//
// Env: INBOX_ADMIN_PHONES (comma-separated E.164 without '+'), WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_NUMBER_ID,
//      WHATSAPP_ALERT_TEMPLATE (optional approved utility template used when the 24h session window is closed —
//      see docs/whatsapp-alert-template.md).
// Never throws: every failure is logged and swallowed so callers can fire-and-forget.

const GRAPH = 'https://graph.facebook.com/v21.0';
const REVIEW_URL = 'https://www.gettikiti.com/admin/inbox';

export interface SubmissionSummary {
  senderName?: string | null;
  submittedBy?: string | null;
  name?: string | null;
  date?: string | null;
  confidence?: number | null;
  missingFields?: string[] | null;
}

export function adminPhones(): string[] {
  return (process.env.INBOX_ADMIN_PHONES || '')
    .split(',')
    .map((p) => p.trim().replace(/^\+/, ''))
    .filter(Boolean);
}

export function buildAlertText(item: SubmissionSummary): string {
  const sender = item.senderName || item.submittedBy || 'unknown';
  const name = item.name || '(untitled)';
  const pct = Math.round(Math.max(0, Math.min(1, item.confidence ?? 0)) * 100);
  const missing = (item.missingFields || []).filter(Boolean);
  const dateStr = item.date ? ` ${item.date}` : '';
  const missingStr = missing.length ? ` · missing: ${missing.join(', ')}` : '';
  return `New flyer from ${sender}: "${name}"${dateStr} · ${pct}% confidence${missingStr}\nReview: ${REVIEW_URL}`;
}

/** True when Graph rejects a free-form message because the customer-service window is closed. */
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
      const first = await postMessage(phoneNumberId, token, { to, type: 'text', text: { body: text } });
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
      console.error('notifyAdmins: text send failed', to, first.status, JSON.stringify(first.body).slice(0, 300));
    } catch (e) {
      console.error('notifyAdmins: send error', to, e);
    }
  }));
}
