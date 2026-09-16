// POST /api/ussd/reconcile — verifies pending USSD mobile-money bookings against Paystack.
// Meant to run from a cron every minute. Protected by header `x-cron-key` == env CRON_SECRET.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyTransaction } from '@/lib/billing/billingService';
import { markBookingPaid } from '@/lib/payments/tickets';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const LOOKBACK_MS = 2 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secret || (req.headers.get('x-cron-key') !== secret && bearer !== secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = getAdminFirestore();
    const since = new Date(Date.now() - LOOKBACK_MS);
    const snap = await db.collection('bookings')
      .where('source', '==', 'ussd')
      .where('paymentStatus', '==', 'pending')
      .where('createdAt', '>=', since)
      .get();

    const results: Array<{ bookingId: string; status: string }> = [];
    for (const doc of snap.docs) {
      const b = doc.data();
      const reference: string | undefined = b.paystackReference;
      if (!reference) { results.push({ bookingId: doc.id, status: 'no_reference' }); continue; }
      try {
        const tx = await verifyTransaction(reference);
        if (tx.status === 'success') {
          const r = await markBookingPaid(db, doc.id, { reference, amountPesewas: tx.amount, channel: tx.authorization?.channel || 'mobile_money' });
          results.push({ bookingId: doc.id, status: r });
        } else if (tx.status === 'failed' || tx.status === 'abandoned' || tx.status === 'reversed') {
          await doc.ref.update({ status: 'payment_failed', paymentStatus: 'failed', paymentError: tx.status, updatedAt: new Date() });
          results.push({ bookingId: doc.id, status: tx.status });
        } else {
          results.push({ bookingId: doc.id, status: tx.status });
        }
      } catch (err: any) {
        results.push({ bookingId: doc.id, status: `error: ${err?.message || err}` });
      }
    }
    return NextResponse.json({ checked: snap.size, results });
  } catch (error: any) {
    console.error('[ussd/reconcile]', error);
    return NextResponse.json({ error: error.message || 'Reconcile failed' }, { status: 500 });
  }
}

// Vercel Cron calls with GET and `Authorization: Bearer $CRON_SECRET`
export const GET = POST;
