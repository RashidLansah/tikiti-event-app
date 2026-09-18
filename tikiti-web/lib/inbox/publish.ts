// Publish / reject an event_inbox item (server side only).
// Shared by the admin REST routes (app/api/inbox/[id]/publish, /reject) and the WhatsApp admin commands
// (app/api/inbox/whatsapp/route.ts), so both paths create identical events.
import { FieldValue, type Firestore } from 'firebase-admin/firestore';
import { eventCategories } from '@/lib/data/categories';
import { INBOX_COLLECTION, type InboxRejectedReason } from '@/lib/inbox/admin';
import { normaliseSpeakers, toEventSpeakers } from '@/lib/inbox/extract';
import { notifySubmitterApproved, notifySubmitterRejected } from '@/lib/inbox/notifySubmitter';

/** Default organisation used by the REST publish route when the caller sends none. */
export const DEFAULT_COMMUNITY_ORG_ID = '1Mvh7AnKIphfnDeOgWUd';
/** "Tikiti Community" organisation the admin inbox UI (app/admin/inbox/page.tsx) publishes under by default. */
export const INBOX_DEFAULT_ORG_ID = '1Mvh7AnKIphfnDeOgWUd';

// Mirrors the default registration form eventService.create sets
const DEFAULT_REGISTRATION_FORM = {
  fields: [
    { id: 'firstName', type: 'text', label: 'First Name', placeholder: 'Enter your first name', required: true },
    { id: 'lastName', type: 'text', label: 'Last Name', placeholder: 'Enter your last name', required: true },
    { id: 'email', type: 'email', label: 'Email Address', placeholder: 'Enter your email address', required: true },
    { id: 'phone', type: 'phone', label: 'Phone Number', placeholder: 'Enter your phone number', required: true },
    { id: 'gender', type: 'dropdown', label: 'Gender', placeholder: 'Select gender', required: true, options: ['Male', 'Female', 'Other'] },
  ],
  consentRequired: false,
};

const str = (v: any) => (v == null ? '' : String(v).trim());

export type InboxPublishErrorCode = 'not_found' | 'already_published' | 'already_rejected' | 'validation';

/** Thrown by publishInboxItem / rejectInboxItem for expected failures; `status` is the matching HTTP code. */
export class InboxPublishError extends Error {
  code: InboxPublishErrorCode;
  status: number;
  /** Present for `already_published` */
  eventId?: string;
  /** Present for `validation` */
  missingFields?: string[];
  constructor(code: InboxPublishErrorCode, message: string, extra: { eventId?: string; missingFields?: string[] } = {}) {
    super(message);
    this.name = 'InboxPublishError';
    this.code = code;
    this.status = code === 'not_found' ? 404 : code === 'already_published' ? 409 : code === 'already_rejected' ? 409 : 400;
    this.eventId = extra.eventId;
    this.missingFields = extra.missingFields;
  }
}

export interface PublishInboxOptions {
  /** Organisation the event is created under; defaults to DEFAULT_COMMUNITY_ORG_ID */
  organizationId?: string | null;
  /** Firebase uid (or a stable pseudo-uid such as 'whatsapp-admin') recorded as organizerId / publishedBy */
  uid: string;
  /** Field overrides merged over `extracted` (same shape the REST publish body accepts) */
  overrides?: Record<string, any> | null;
}

export interface PublishInboxResult {
  eventId: string;
  name: string;
  ticketingDisabled: boolean;
  organizationId: string;
}

/**
 * Creates a real `events` doc from an inbox item and marks the item published, atomically.
 * Throws InboxPublishError for missing item, already-published item, or when the minimum fields
 * (name, date as YYYY-MM-DD, location) are missing — the message lists what is missing.
 */
export async function publishInboxItem(db: Firestore, inboxId: string, opts: PublishInboxOptions): Promise<PublishInboxResult> {
  const ref = db.collection(INBOX_COLLECTION).doc(inboxId);
  const snap = await ref.get();
  if (!snap.exists) throw new InboxPublishError('not_found', 'Inbox item not found');
  const inbox = snap.data()!;
  if (inbox.status === 'published' && inbox.publishedEventId) {
    throw new InboxPublishError('already_published', 'Already published', { eventId: inbox.publishedEventId });
  }

  const f = { ...(inbox.extracted || {}), ...(opts.overrides || {}) };
  const name = str(f.name);
  const date = str(f.date);
  const location = str(f.location);
  const missing: string[] = [];
  if (!name) missing.push('name');
  if (!date) missing.push('date');
  else if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) missing.push('date (must be YYYY-MM-DD)');
  if (!location) missing.push('location');
  if (missing.length) {
    throw new InboxPublishError('validation', `missing ${missing.join(', ')}`, { missingFields: missing });
  }

  const organizationId = str(opts.organizationId) || DEFAULT_COMMUNITY_ORG_ID;
  const priceNum = Number(f.price);
  const price = Number.isFinite(priceNum) && priceNum > 0 ? priceNum : 0;
  const isFree = typeof f.isFree === 'boolean' ? f.isFree : price === 0;
  const registrationUrl = str(f.registrationUrl);
  const category = eventCategories.some((c) => c.id === f.category) ? f.category : 'other';
  const startTime = str(f.startTime);
  const endDate = str(f.endDate) || date;
  const ticketingDisabled = !isFree && !registrationUrl;

  const event: Record<string, any> = {
    name,
    description: str(f.description),
    venueType: /online|zoom|virtual|google meet|teams|webinar|livestream/i.test(`${location} ${name}`) ? 'virtual' : 'in_person',
    location,
    date,
    time: startTime,
    startTime,
    startDate: date,
    endDate,
    category,
    type: isFree ? 'free' : 'paid',
    price: isFree ? 0 : price,
    totalTickets: 100,
    availableTickets: 100,
    soldTickets: 0,
    organizerId: opts.uid,
    organizationId,
    organizerName: 'Tikiti Community',
    imageUrl: inbox.imageUrl,
    status: 'active',
    isActive: true,
    registrationForm: DEFAULT_REGISTRATION_FORM,
    source: 'community',
    communityContact: { phone: str(f.contactPhone), organiserName: str(f.organiserName) },
    inboxId,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
    publishedAt: FieldValue.serverTimestamp(),
  };
  if (str(f.address)) event.address = str(f.address);
  if (str(f.city)) event.city = str(f.city);
  if (str(f.endTime)) event.endTime = str(f.endTime);
  if (registrationUrl) event.registrationUrl = registrationUrl;
  if (str(f.contactPhone)) event.organizerPhone = str(f.contactPhone);
  if (ticketingDisabled) event.ticketingDisabled = true;
  const speakers = normaliseSpeakers(f.speakers);
  if (speakers.length) event.speakers = toEventSpeakers(speakers);

  const eventRef = db.collection('events').doc();
  const batch = db.batch();
  batch.set(eventRef, event);
  batch.update(ref, {
    status: 'published',
    publishedEventId: eventRef.id,
    publishedBy: opts.uid,
    extracted: {
      ...(inbox.extracted || {}),
      name, description: str(f.description), category, date, endDate, startTime, endTime: str(f.endTime),
      location, address: str(f.address), city: str(f.city), price: isFree ? 0 : price, isFree,
      registrationUrl, contactPhone: str(f.contactPhone), organiserName: str(f.organiserName), speakers,
    },
    organizationId,
    updatedAt: FieldValue.serverTimestamp(),
  });
  await batch.commit();

  // Tell the submitter (WhatsApp sources only) — fire-and-forget, never blocks or fails the publish
  notifySubmitterApproved(db, { id: inboxId, source: inbox.source, submittedBy: inbox.submittedBy, extracted: { name } }, eventRef.id)
    .catch((e) => console.error('publishInboxItem: submitter notify failed', inboxId, e));

  return { eventId: eventRef.id, name, ticketingDisabled, organizationId };
}

/**
 * Marks an inbox item rejected and notifies the submitter (WhatsApp sources only, fire-and-forget).
 * `reason` is the reason code stored as `rejectedReason`; `note` is an optional free-text note (`rejectedNote`)
 * relayed to the submitter. Throws InboxPublishError if missing or already published.
 */
export async function rejectInboxItem(
  db: Firestore,
  inboxId: string,
  reason: InboxRejectedReason | null,
  uid: string,
  note?: string | null,
): Promise<{ name: string; reason: InboxRejectedReason }> {
  const ref = db.collection(INBOX_COLLECTION).doc(inboxId);
  const snap = await ref.get();
  if (!snap.exists) throw new InboxPublishError('not_found', 'Inbox item not found');
  const data = snap.data()!;
  if (data.status === 'published') {
    throw new InboxPublishError('already_published', 'Already published; unpublish the event instead', { eventId: data.publishedEventId || undefined });
  }
  const reasonCode: InboxRejectedReason = reason || 'other';
  const rejectedNote = str(note) || null;
  await ref.update({
    status: 'rejected',
    rejectedBy: uid,
    rejectedReason: reasonCode,
    rejectedNote,
    rejectedAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
  });
  const name = str(data.extracted?.name) || '(untitled)';
  notifySubmitterRejected(db, { id: inboxId, source: data.source, submittedBy: data.submittedBy, extracted: { name } }, reasonCode, rejectedNote)
    .catch((e) => console.error('rejectInboxItem: submitter notify failed', inboxId, e));
  return { name, reason: reasonCode };
}
