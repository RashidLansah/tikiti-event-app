import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { sendTicketEmail } from '@/lib/email/ticketEmail';
import { sendTicketSms } from '@/lib/sms/ticketSms';
import { ensureTicketToken, ticketBaseUrl, ticketUrl } from '@/lib/tickets/ticketToken';
import { cityFromLocation, recordSignal, upsertContact } from '@/lib/audience/contacts';
import { AUDIENCE_CHANNELS, type AudienceChannel } from '@/lib/audience/types';

export const TIKITI_FEE_PERCENT = Number(process.env.TIKITI_FEE_PERCENT ?? 5);
export const MIN_PAYOUT_GHS = Number(process.env.MIN_PAYOUT_GHS ?? 20);

export function toPesewas(ghs: number) { return Math.round(ghs * 100); }

export function splitAmount(grossPesewas: number) {
  const tikitiFee = Math.round((grossPesewas * TIKITI_FEE_PERCENT) / 100);
  return { gross: grossPesewas, tikitiFee, net: grossPesewas - tikitiFee };
}

export function eventPriceGhs(event: any): number {
  const raw = event?.price;
  if (raw == null) return 0;
  const n = typeof raw === 'number' ? raw : parseFloat(String(raw).replace(/[^\d.]/g, ''));
  return Number.isFinite(n) ? n : 0;
}

export function eventHasEnded(event: any): boolean {
  const dateStr = event?.endDate || event?.date;
  if (!dateStr) return false;
  const time = event?.endTime || '23:59';
  const d = new Date(`${dateStr}T${time}:00`);
  return Number.isFinite(d.getTime()) && d.getTime() < Date.now();
}

/**
 * Idempotently mark a pending booking as paid and update the event counters.
 * Safe to call from both the webhook and the client-triggered verify route.
 */
export async function markBookingPaid(
  db: Firestore,
  bookingId: string,
  payment: { reference: string; amountPesewas: number; channel?: string; paidAt?: Date }
): Promise<'paid' | 'already_paid' | 'not_found' | 'amount_mismatch'> {
  const bookingRef = db.collection('bookings').doc(bookingId);
  const result = await db.runTransaction(async (tx) => {
    const snap = await tx.get(bookingRef);
    if (!snap.exists) return 'not_found';
    const b = snap.data()!;
    if (b.paymentStatus === 'paid') return 'already_paid';
    if (b.gross !== payment.amountPesewas) return 'amount_mismatch';

    const eventRef = db.collection('events').doc(b.eventId);
    tx.update(bookingRef, {
      status: 'confirmed',
      paymentStatus: 'paid',
      paystackReference: payment.reference,
      paymentChannel: payment.channel || null,
      paidAt: payment.paidAt || new Date(),
      updatedAt: new Date(),
    });
    tx.update(eventRef, {
      soldTickets: FieldValue.increment(b.quantity || 1),
      availableTickets: FieldValue.increment(-(b.quantity || 1)),
    });
    return 'paid';
  });
  if (result === 'paid') await deliverTicket(db, bookingId);
  return result;
}

/** Sends the ticket email and SMS once each and records the outcomes on the booking. */
export async function deliverTicket(db: Firestore, bookingId: string) {
  const ref = db.collection('bookings').doc(bookingId);
  const snap = await ref.get();
  const b = snap.data();
  if (!b) return;
  await recordAudience(db, bookingId, b);
  const emailDone = b.ticketEmailStatus === 'sent';
  const smsDone = b.ticketSmsStatus === 'sent';
  if (emailDone && smsDone) return;
  const token = await ensureTicketToken(db, bookingId);
  const url = ticketUrl(ticketBaseUrl(), bookingId, token);
  const update: Record<string, unknown> = {};
  if (!emailDone) {
    update.ticketEmailStatus = await sendTicketEmail(bookingId, b, url).catch(() => 'failed' as const);
    update.ticketEmailAt = new Date();
  }
  if (!smsDone) {
    update.ticketSmsStatus = await sendTicketSms(bookingId, b, url).catch(() => 'failed' as const);
    update.ticketSmsAt = new Date();
  }
  await ref.update(update);
}

/**
 * Audience capture for a confirmed booking: one contact per person plus a registration / paid_booking signal.
 * Runs once per booking (`audienceRecorded`). Channel consent is stored ONLY when the booking carries
 * `marketingConsent`. Sends nothing and never throws.
 */
async function recordAudience(db: Firestore, bookingId: string, b: FirebaseFirestore.DocumentData): Promise<void> {
  try {
    if (b.audienceRecorded === true) return;
    const ref = db.collection('bookings').doc(bookingId);
    // Claim the flag first so concurrent webhook + verify calls can't double count.
    const claimed = await db.runTransaction(async (tx) => {
      const fresh = await tx.get(ref);
      if (!fresh.exists || fresh.data()!.audienceRecorded === true) return false;
      tx.update(ref, { audienceRecorded: true });
      return true;
    });
    if (!claimed) return;

    const mc = b.marketingConsent;
    const channels: AudienceChannel[] = Array.isArray(mc?.channels)
      ? mc.channels.filter((c: unknown): c is AudienceChannel => AUDIENCE_CHANNELS.includes(c as AudienceChannel))
      : [];
    const contact = await upsertContact(db, {
      phone: b.phoneNumber,
      email: b.userEmail,
      name: b.userName,
      city: cityFromLocation(b.eventLocation),
      uid: b.userId,
      source: b.source === 'ussd' ? 'ussd' : 'registration',
      consent: channels.length ? { channels, wordingVersion: typeof mc?.wordingVersion === 'string' ? mc.wordingVersion : undefined } : undefined,
    });
    if (!contact) return;
    const ev = b.eventId ? (await db.collection('events').doc(String(b.eventId)).get()).data() : undefined;
    const paid = b.paymentStatus === 'paid' && Number(b.gross) > 0;
    await recordSignal(db, contact.id, {
      type: paid ? 'paid_booking' : 'registration',
      category: ev?.category,
      city: cityFromLocation(ev?.city || b.eventLocation || ev?.location),
      amountPesewas: paid ? Number(b.gross) : undefined,
    });
  } catch (err) {
    console.error('[audience] booking capture failed', bookingId, err);
  }
}

export interface EarningsSummary {
  grossPesewas: number;
  feesPesewas: number;
  netPesewas: number;
  availablePesewas: number;
  pendingPesewas: number;
  paidOutPesewas: number;
  inFlightPesewas: number;
  entries: Array<{ bookingId: string; eventId: string; eventName: string; quantity: number; gross: number; net: number; paidAt: string | null; cleared: boolean }>;
  payouts: Array<{ id: string; amount: number; status: string; createdAt: string | null; reference: string }>;
}

export async function assertOrgRole(db: Firestore, uid: string, orgId: string, roles: string[] = ['owner', 'admin', 'project_manager', 'gate_staff']): Promise<string> {
  const member = await db.collection('organizations').doc(orgId).collection('members').doc(uid).get();
  const role = member.data()?.role;
  if (!member.exists || !roles.includes(role)) throw Object.assign(new Error('You do not have access to this organisation'), { status: 403 });
  return role;
}

export async function computeEarnings(db: Firestore, orgId: string): Promise<EarningsSummary> {
  const eventsSnap = await db.collection('events').where('organizationId', '==', orgId).get();
  const events = new Map<string, any>();
  eventsSnap.forEach((d) => events.set(d.id, { id: d.id, ...d.data() }));

  const entries: EarningsSummary['entries'] = [];
  let gross = 0, fees = 0, net = 0, available = 0, pending = 0;
  if (events.size > 0) {
    const ids = [...events.keys()];
    for (let i = 0; i < ids.length; i += 30) {
      const chunk = ids.slice(i, i + 30);
      const snap = await db.collection('bookings')
        .where('eventId', 'in', chunk)
        .where('paymentStatus', '==', 'paid')
        .get();
      snap.forEach((d) => {
        const b = d.data();
        const ev = events.get(b.eventId);
        const cleared = eventHasEnded(ev);
        gross += b.gross || 0; fees += b.tikitiFee || 0; net += b.net || 0;
        if (cleared) available += b.net || 0; else pending += b.net || 0;
        entries.push({
          bookingId: d.id, eventId: b.eventId, eventName: b.eventName || ev?.name || 'Event',
          quantity: b.quantity || 1, gross: b.gross || 0, net: b.net || 0,
          paidAt: b.paidAt?.toDate ? b.paidAt.toDate().toISOString() : null, cleared,
        });
      });
    }
  }

  const payoutsSnap = await db.collection('payouts').where('organizationId', '==', orgId).get();
  let paidOut = 0, inFlight = 0;
  const payouts: EarningsSummary['payouts'] = [];
  payoutsSnap.forEach((d) => {
    const p = d.data();
    if (p.status === 'success') paidOut += p.amount || 0;
    else if (p.status === 'pending' || p.status === 'processing') inFlight += p.amount || 0;
    payouts.push({ id: d.id, amount: p.amount || 0, status: p.status, reference: p.reference,
      createdAt: p.createdAt?.toDate ? p.createdAt.toDate().toISOString() : null });
  });

  entries.sort((a, b) => (b.paidAt || '').localeCompare(a.paidAt || ''));
  payouts.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

  return {
    grossPesewas: gross, feesPesewas: fees, netPesewas: net,
    availablePesewas: Math.max(0, available - paidOut - inFlight),
    pendingPesewas: pending, paidOutPesewas: paidOut, inFlightPesewas: inFlight,
    entries, payouts,
  };
}
