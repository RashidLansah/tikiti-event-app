// GET /api/payouts/summary?orgId= — organisation earnings, availability and payout history
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, verifyRequestUser } from '@/lib/firebase/admin';
import { assertOrgRole, computeEarnings, MIN_PAYOUT_GHS, TIKITI_FEE_PERCENT } from '@/lib/payments/tickets';
import { fetchTransfer } from '@/lib/billing/billingService';

export async function GET(req: NextRequest) {
  try {
    const auth = await verifyRequestUser(req.headers.get('authorization'));
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const orgId = req.nextUrl.searchParams.get('orgId');
    if (!orgId) return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    const db = getAdminFirestore();
    const role = await assertOrgRole(db, auth.uid, orgId);

    // No Paystack webhook is pointed at Tikiti, so settle in-flight payouts here
    const inFlight = await db.collection('payouts').where('organizationId', '==', orgId).where('status', 'in', ['pending', 'processing']).get();
    await Promise.all(inFlight.docs.map(async (d) => {
      const code = d.data().transferCode;
      if (!code) return;
      try {
        const t = await fetchTransfer(code);
        const status = t.status === 'success' ? 'success' : t.status === 'failed' ? 'failed' : t.status === 'reversed' ? 'reversed' : null;
        if (status) await d.ref.update({ status, failureReason: t.reason || null, updatedAt: new Date() });
      } catch {}
    }));
    const [summary, orgSnap] = await Promise.all([computeEarnings(db, orgId), db.collection('organizations').doc(orgId).get()]);
    const payout = orgSnap.data()?.payout || null;
    return NextResponse.json({
      ...summary,
      role,
      canManagePayouts: ['owner', 'admin'].includes(role),
      feePercent: TIKITI_FEE_PERCENT,
      minPayoutPesewas: MIN_PAYOUT_GHS * 100,
      payoutAccount: payout ? { provider: payout.provider, phone: payout.phone, name: payout.name } : null,
    });
  } catch (error: any) {
    console.error('[payouts/summary]', error);
    return NextResponse.json({ error: error.message || 'Failed to load earnings' }, { status: error.status || 500 });
  }
}
