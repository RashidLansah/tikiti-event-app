// POST /api/tickets/reconcile — confirm any of the user's pending ticket payments that completed after the app closed
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, verifyRequestUser } from '@/lib/firebase/admin';
import { verifyTransaction } from '@/lib/billing/billingService';
import { markBookingPaid } from '@/lib/payments/tickets';

const ABANDON_AFTER_MS = 24 * 60 * 60 * 1000;

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRequestUser(req.headers.get('authorization'));
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const db = getAdminFirestore();
    const snap = await db.collection('bookings')
      .where('userId', '==', auth.uid)
      .where('paymentStatus', '==', 'pending')
      .get();

    const results: Record<string, string> = {};
    for (const doc of snap.docs) {
      const b = doc.data();
      const ref = b.paystackReference;
      if (!ref) continue;
      try {
        const tx = await verifyTransaction(ref);
        if (tx.status === 'success') {
          results[doc.id] = await markBookingPaid(db, doc.id, { reference: ref, amountPesewas: tx.amount, channel: tx.authorization?.channel });
        } else if (tx.status === 'failed' || (b.createdAt?.toDate && Date.now() - b.createdAt.toDate().getTime() > ABANDON_AFTER_MS)) {
          await doc.ref.update({ status: 'abandoned', paymentStatus: tx.status === 'failed' ? 'failed' : 'abandoned', updatedAt: new Date() });
          results[doc.id] = 'abandoned';
        } else {
          results[doc.id] = tx.status;
        }
      } catch (e: any) {
        results[doc.id] = `error: ${e.message}`;
      }
    }
    return NextResponse.json({ checked: snap.size, results });
  } catch (error: any) {
    console.error('[tickets/reconcile]', error);
    return NextResponse.json({ error: error.message || 'Reconcile failed' }, { status: 500 });
  }
}
