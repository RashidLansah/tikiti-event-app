// POST /api/tickets/notify — email the ticket for a confirmed booking (used after free registrations)
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, verifyRequestUser } from '@/lib/firebase/admin';
import { deliverTicket } from '@/lib/payments/tickets';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRequestUser(req.headers.get('authorization'));
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { bookingId } = await req.json();
    if (!bookingId) return NextResponse.json({ error: 'bookingId is required' }, { status: 400 });
    const db = getAdminFirestore();
    const snap = await db.collection('bookings').doc(bookingId).get();
    const b = snap.data();
    if (!b || b.userId !== auth.uid) return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    if (b.status !== 'confirmed') return NextResponse.json({ error: 'Booking is not confirmed' }, { status: 400 });
    await deliverTicket(db, bookingId);
    const fresh = await db.collection('bookings').doc(bookingId).get();
    return NextResponse.json({ ticketEmailStatus: fresh.data()?.ticketEmailStatus || 'skipped' });
  } catch (error: any) {
    console.error('[tickets/notify]', error);
    return NextResponse.json({ error: error.message || 'Failed to send ticket' }, { status: 500 });
  }
}
