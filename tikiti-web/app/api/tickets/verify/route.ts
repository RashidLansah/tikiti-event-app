// POST /api/tickets/verify — confirm a ticket payment (client-triggered; webhook is the backstop)
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, verifyRequestUser } from '@/lib/firebase/admin';
import { verifyTransaction } from '@/lib/billing/billingService';
import { markBookingPaid } from '@/lib/payments/tickets';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRequestUser(req.headers.get('authorization'));
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { reference } = await req.json();
    if (!reference) return NextResponse.json({ error: 'reference is required' }, { status: 400 });

    const db = getAdminFirestore();
    const bookingId = String(reference).replace(/^TKT-/, '');
    const bookingSnap = await db.collection('bookings').doc(bookingId).get();
    if (!bookingSnap.exists || bookingSnap.data()!.userId !== auth.uid) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }
    if (bookingSnap.data()!.paymentStatus === 'paid') {
      return NextResponse.json({ status: 'paid', booking: { id: bookingId, ...bookingSnap.data() } });
    }

    const tx = await verifyTransaction(reference);
    if (tx.status !== 'success') {
      return NextResponse.json({ status: tx.status });
    }
    await markBookingPaid(db, bookingId, {
      reference, amountPesewas: tx.amount, channel: tx.authorization?.channel,
    });
    const fresh = await db.collection('bookings').doc(bookingId).get();
    return NextResponse.json({ status: 'paid', booking: { id: bookingId, ...fresh.data() } });
  } catch (error: any) {
    console.error('[tickets/verify]', error);
    return NextResponse.json({ error: error.message || 'Verification failed' }, { status: 500 });
  }
}
