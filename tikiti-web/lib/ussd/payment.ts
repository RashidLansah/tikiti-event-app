// Creates the booking for a USSD purchase and, for paid events, triggers a Paystack mobile-money charge.
import type { Firestore } from 'firebase-admin/firestore';
import { FieldValue } from 'firebase-admin/firestore';
import { paystackRequest } from '@/lib/billing/billingService';
import { deliverTicket, eventPriceGhs, splitAmount, toPesewas } from '@/lib/payments/tickets';
import { generateTicketToken } from '@/lib/tickets/ticketToken';
import { normaliseGhanaPhone } from '@/lib/sms/arkesel';
import { isUssdSellable } from './events';

export type MomoProvider = 'mtn' | 'vod' | 'atl';

/** Maps the Arkesel `network` field to a Paystack GH mobile-money provider code. */
export function momoProviderFromNetwork(network: string | undefined | null): MomoProvider | null {
  const n = String(network || '').toLowerCase();
  if (n.includes('mtn')) return 'mtn';
  if (n.includes('voda') || n.includes('telecel')) return 'vod';
  if (n.includes('airtel') || n.includes('tigo') || n.includes('atl')) return 'atl';
  return null;
}

export function ussdPlaceholderEmail(msisdn: string): string {
  const digits = String(msisdn || '').replace(/\D/g, '');
  return `${digits}@ussd.gettikiti.com`;
}

export interface UssdPurchaseInput {
  eventId: string;
  quantity: number;
  msisdn: string;
  network?: string;
  sessionId?: string;
}

export type UssdPurchaseResult =
  | { ok: true; bookingId: string; kind: 'free' | 'paid'; reference?: string }
  | { ok: false; error: string };

export async function createUssdPurchase(db: Firestore, input: UssdPurchaseInput): Promise<UssdPurchaseResult> {
  const qty = Math.max(1, Math.min(5, Number(input.quantity) || 1));
  const phone = normaliseGhanaPhone(input.msisdn);
  if (!phone) return { ok: false, error: 'Invalid phone number.' };

  const eventSnap = await db.collection('events').doc(input.eventId).get();
  const event = eventSnap.data();
  if (!eventSnap.exists || !isUssdSellable(event)) return { ok: false, error: 'This event is no longer available.' };
  if (typeof event!.availableTickets === 'number' && event!.availableTickets < qty) {
    return { ok: false, error: `Only ${event!.availableTickets} tickets left.` };
  }

  const priceGhs = eventPriceGhs(event);
  const isFree = priceGhs <= 0;
  const split = splitAmount(toPesewas(priceGhs * qty));
  const bookingRef = db.collection('bookings').doc();
  const reference = `TKT-${bookingRef.id}`;
  const email = ussdPlaceholderEmail(phone);
  const now = new Date();

  const base = {
    eventId: input.eventId,
    organizerId: event!.organizerId || event!.createdBy || null,
    organizationId: event!.organizationId || null,
    userId: null,
    quantity: qty,
    unitPriceGhs: priceGhs,
    totalPrice: priceGhs * qty,
    gross: split.gross,
    tikitiFee: split.tikitiFee,
    net: split.net,
    currency: 'GHS',
    ticketToken: generateTicketToken(),
    source: 'ussd',
    ussdSessionId: input.sessionId || null,
    ussdNetwork: input.network || null,
    userEmail: '',
    userName: '',
    firstName: '',
    lastName: '',
    phoneNumber: phone,
    gender: '',
    cohortId: null,
    cohortName: null,
    eventName: event!.name,
    eventDate: event!.date,
    eventTime: event!.startTime || event!.time || '',
    eventLocation: typeof event!.location === 'object' ? (event!.location?.name || event!.location?.address || '') : (event!.location || ''),
    createdAt: now,
    updatedAt: now,
  };

  if (isFree) {
    await db.runTransaction(async (tx) => {
      tx.set(bookingRef, { ...base, registrationType: 'rsvp', status: 'confirmed', paymentStatus: 'free' });
      tx.update(eventSnap.ref, {
        soldTickets: FieldValue.increment(qty),
        availableTickets: FieldValue.increment(-qty),
      });
    });
    await deliverTicket(db, bookingRef.id);
    return { ok: true, bookingId: bookingRef.id, kind: 'free' };
  }

  const provider = momoProviderFromNetwork(input.network);
  if (!provider) return { ok: false, error: 'Mobile money is not supported on your network.' };

  await bookingRef.set({
    ...base,
    registrationType: 'paid',
    status: 'pending_payment',
    paymentStatus: 'pending',
    paystackReference: reference,
    paymentChannel: 'mobile_money',
    momoProvider: provider,
  });

  try {
    // Paystack Charge API — Ghana mobile money. The customer gets an approval prompt on their phone.
    await paystackRequest('POST', '/charge', {
      email,
      amount: split.gross,
      currency: 'GHS',
      reference,
      mobile_money: { phone: `0${phone.slice(3)}`, provider },
      metadata: { type: 'ticket', bookingId: bookingRef.id, eventId: input.eventId, quantity: qty, source: 'ussd' },
    });
  } catch (err: any) {
    console.error('[ussd/payment] charge failed', err);
    await bookingRef.update({ status: 'payment_failed', paymentStatus: 'failed', paymentError: String(err?.message || err), updatedAt: new Date() });
    return { ok: false, error: 'Could not start payment. Please try again.' };
  }

  return { ok: true, bookingId: bookingRef.id, kind: 'paid', reference };
}
