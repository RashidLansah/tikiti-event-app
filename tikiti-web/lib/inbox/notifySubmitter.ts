// WhatsApp notifications to the person who submitted a flyer, sent when an admin approves or rejects
// their inbox item (from the dashboard or the WhatsApp admin commands — both go through lib/inbox/publish.ts).
//
// Only items with source 'whatsapp' have a phone (`submittedBy` = wa_id); everything else is skipped silently.
// Free-form texts only deliver inside the 24h customer-service window; outside it we fall back to an approved
// utility template (see docs/whatsapp-alert-template.md):
//   WHATSAPP_TPL_EVENT_LIVE        params: {{1}} event name, {{2}} event url
//   WHATSAPP_TPL_EVENT_NOT_LISTED  params: {{1}} event name, {{2}} reason text
// Never throws: outcome is logged and recorded on the inbox doc as `submitterNotified`.
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { INBOX_COLLECTION, type InboxRejectedReason } from '@/lib/inbox/admin';
import { isWindowClosedError, postMessage } from '@/lib/inbox/notifyAdmins';

const EVENT_URL = (id: string) => `https://www.gettikiti.com/events/${id}`;

export type SubmitterNotifyStatus = 'sent' | 'template' | 'failed' | 'skipped';

/** Minimal shape of an event_inbox doc needed to message the submitter */
export interface SubmitterItem {
  id: string;
  source?: string | null;
  submittedBy?: string | null;
  extracted?: { name?: string | null } | null;
}

export const REJECT_REASON_TEXT: Record<InboxRejectedReason, string> = {
  not_event: "it doesn't look like an event flyer",
  past: 'the event has already taken place',
  duplicate: "it's already listed on Tikiti",
  missing_details: 'key details (date, venue or how to register) are missing',
  other: 'of an issue with the listing',
};

export const REJECT_REASON_LABEL: Record<InboxRejectedReason, string> = {
  not_event: 'Not an event',
  past: 'Already happened',
  duplicate: 'Duplicate',
  missing_details: 'Missing key details',
  other: 'Other',
};

export function isRejectReason(v: unknown): v is InboxRejectedReason {
  return typeof v === 'string' && v in REJECT_REASON_TEXT;
}

/** Human reason sentence fragment; the note is appended for `other` (and any reason) when given. */
export function rejectReasonText(reason: InboxRejectedReason, note?: string | null): string {
  const base = REJECT_REASON_TEXT[reason] || REJECT_REASON_TEXT.other;
  const n = (note || '').trim();
  return n ? `${base}. ${n}` : base;
}

const itemName = (item: SubmitterItem) => (item.extracted?.name || '').trim() || '(untitled)';

export function buildApprovedText(item: SubmitterItem, eventId: string): string {
  return `Your event is live on Tikiti 🎉\n"${itemName(item)}"\n${EVENT_URL(eventId)}\n\nShare that link anywhere — anyone can register from it.`;
}

export function buildRejectedText(item: SubmitterItem, reason: InboxRejectedReason, note?: string | null): string {
  const n = (note || '').trim();
  const reasonText = REJECT_REASON_TEXT[reason] || REJECT_REASON_TEXT.other;
  return `Thanks for sending "${itemName(item)}". We couldn't list it because ${reasonText}.${n ? ' ' + n : ''}\n\nYou're welcome to send other upcoming events anytime.`;
}

async function record(db: Firestore, inboxId: string, type: 'approved' | 'rejected', status: SubmitterNotifyStatus) {
  try {
    await db.collection(INBOX_COLLECTION).doc(inboxId).update({
      submitterNotified: { type, at: FieldValue.serverTimestamp(), status },
    });
  } catch (e) {
    console.error('notifySubmitter: could not record outcome', inboxId, e);
  }
}

/**
 * Sends `text` to the submitter, falling back to `templateName` (with `templateParams`) when the 24h window
 * is closed. Resolves with the outcome; never rejects.
 */
async function send(
  db: Firestore,
  item: SubmitterItem,
  type: 'approved' | 'rejected',
  text: string,
  templateName: string,
  templateParams: string[],
): Promise<SubmitterNotifyStatus> {
  const to = (item.submittedBy || '').replace(/^\+/, '').trim();
  if (item.source !== 'whatsapp' || !to) return 'skipped';

  const token = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  if (!token || !phoneNumberId) {
    console.warn('notifySubmitter: skipped, WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID not configured');
    await record(db, item.id, type, 'skipped');
    return 'skipped';
  }

  let status: SubmitterNotifyStatus = 'failed';
  try {
    const first = await postMessage(phoneNumberId, token, { to, type: 'text', text: { body: text } });
    if (first.ok) {
      status = 'sent';
    } else if (isWindowClosedError(first.body) && templateName) {
      const second = await postMessage(phoneNumberId, token, {
        to,
        type: 'template',
        template: {
          name: templateName,
          language: { code: 'en' },
          components: [{ type: 'body', parameters: templateParams.map((t) => ({ type: 'text', text: t })) }],
        },
      });
      if (second.ok) status = 'template';
      else console.error('notifySubmitter: template send failed', to, second.status, JSON.stringify(second.body).slice(0, 300));
    } else {
      console.error('notifySubmitter: send failed', to, first.status, JSON.stringify(first.body).slice(0, 300));
    }
  } catch (e) {
    console.error('notifySubmitter: send error', to, e);
  }
  await record(db, item.id, type, status);
  return status;
}

/** Tells the submitter their event is live, with the public link. */
export function notifySubmitterApproved(db: Firestore, item: SubmitterItem, eventId: string): Promise<SubmitterNotifyStatus> {
  return send(
    db, item, 'approved',
    buildApprovedText(item, eventId),
    (process.env.WHATSAPP_TPL_EVENT_LIVE || '').trim(),
    [itemName(item), EVENT_URL(eventId)],
  );
}

/** Tells the submitter their event was not listed and why. */
export function notifySubmitterRejected(
  db: Firestore,
  item: SubmitterItem,
  reasonCode: InboxRejectedReason,
  note?: string | null,
): Promise<SubmitterNotifyStatus> {
  return send(
    db, item, 'rejected',
    buildRejectedText(item, reasonCode, note),
    (process.env.WHATSAPP_TPL_EVENT_NOT_LISTED || '').trim(),
    [itemName(item), rejectReasonText(reasonCode, note)],
  );
}
