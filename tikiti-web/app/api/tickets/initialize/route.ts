// POST /api/tickets/initialize — start a Paystack checkout for a paid event ticket
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, verifyRequestUser } from '@/lib/firebase/admin';
import { initializeTransaction } from '@/lib/billing/billingService';
import { eventPriceGhs, splitAmount, toPesewas } from '@/lib/payments/tickets';
import { generateTicketToken } from '@/lib/tickets/ticketToken';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRequestUser(req.headers.get('authorization'));
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { eventId, quantity = 1, email, attendee = {} } = await req.json();
    if (!eventId) return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
    const qty = Math.max(1, Math.min(10, Number(quantity) || 1));

    const db = getAdminFirestore();
    const eventSnap = await db.collection('events').doc(eventId).get();
    if (!eventSnap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const event = eventSnap.data()!;
    if (event.status !== 'active' && event.isActive !== true) {
      return NextResponse.json({ error: 'This event is no longer accepting bookings' }, { status: 400 });
    }
    if (typeof event.availableTickets === 'number' && event.availableTickets < qty) {
      return NextResponse.json({ error: `Only ${event.availableTickets} tickets remaining` }, { status: 400 });
    }
    const priceGhs = eventPriceGhs(event);
    if (priceGhs <= 0) return NextResponse.json({ error: 'This is a free event' }, { status: 400 });

    const split = splitAmount(toPesewas(priceGhs * qty));
    const payerEmail = email || auth.email;
    if (!payerEmail) return NextResponse.json({ error: 'An email is required for payment' }, { status: 400 });

    // Marketing consent is only ever what the attendee explicitly ticked; absent or invalid → not stored.
    const ALLOWED_CHANNELS = ['whatsapp', 'sms', 'email'];
    const rawChannels = attendee?.marketingConsent?.channels;
    const consentChannels: string[] = Array.isArray(rawChannels) && rawChannels.length <= 3
      ? Array.from(new Set(rawChannels.filter((c: unknown): c is string => typeof c === 'string' && ALLOWED_CHANNELS.includes(c))))
      : [];
    const wording = attendee?.marketingConsent?.wordingVersion;
    const marketingConsent = consentChannels.length
      ? { channels: consentChannels, ...(typeof wording === 'string' && wording ? { wordingVersion: wording.slice(0, 40) } : {}) }
      : null;

    const bookingRef = db.collection('bookings').doc();
    const reference = `TKT-${bookingRef.id}`;
    await bookingRef.set({
      eventId,
      organizerId: event.organizerId || event.createdBy || null,
      organizationId: event.organizationId || null,
      userId: auth.uid,
      quantity: qty,
      unitPriceGhs: priceGhs,
      totalPrice: priceGhs * qty,
      gross: split.gross,
      tikitiFee: split.tikitiFee,
      net: split.net,
      currency: 'GHS',
      registrationType: 'paid',
      status: 'pending_payment',
      paymentStatus: 'pending',
      paystackReference: reference,
      ticketToken: generateTicketToken(),
      source: 'app',
      userEmail: payerEmail,
      userName: attendee.userName || '',
      firstName: attendee.firstName || '',
      lastName: attendee.lastName || '',
      phoneNumber: attendee.phoneNumber || '',
      gender: attendee.gender || '',
      cohortId: attendee.cohortId || null,
      cohortName: attendee.cohortName || null,
      ...(marketingConsent ? { marketingConsent } : {}),
      eventName: event.name,
      eventDate: event.date,
      eventTime: event.startTime || event.time || '',
      eventLocation: typeof event.location === 'object' ? (event.location.name || event.location.address || '') : (event.location || ''),
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const baseUrl = process.env.NODE_ENV === 'development' ? req.nextUrl.origin : (process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin);
    const tx = await initializeTransaction({
      email: payerEmail,
      amount: split.gross,
      currency: 'GHS',
      reference,
      callback_url: `${baseUrl}/pay/done`,
      channels: ['mobile_money', 'card'],
      metadata: { type: 'ticket', bookingId: bookingRef.id, eventId, userId: auth.uid, quantity: qty },
    });

    return NextResponse.json({
      bookingId: bookingRef.id,
      reference,
      authorizationUrl: tx.authorization_url,
      amountPesewas: split.gross,
    });
  } catch (error: any) {
    console.error('[tickets/initialize]', error);
    return NextResponse.json({ error: error.message || 'Failed to start payment' }, { status: 500 });
  }
}
