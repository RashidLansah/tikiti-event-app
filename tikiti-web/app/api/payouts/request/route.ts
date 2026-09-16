// POST /api/payouts/request — pay out all available earnings for an organisation; processed immediately
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, verifyRequestUser } from '@/lib/firebase/admin';
import { initiateTransfer } from '@/lib/billing/billingService';
import { assertOrgRole, computeEarnings, MIN_PAYOUT_GHS } from '@/lib/payments/tickets';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRequestUser(req.headers.get('authorization'));
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { orgId } = await req.json();
    if (!orgId) return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    const db = getAdminFirestore();
    await assertOrgRole(db, auth.uid, orgId, ['owner', 'admin']);

    const orgSnap = await db.collection('organizations').doc(orgId).get();
    const payout = orgSnap.data()?.payout;
    if (!payout?.recipientCode) return NextResponse.json({ error: 'Add your mobile money account first' }, { status: 400 });

    const summary = await computeEarnings(db, orgId);
    if (summary.inFlightPesewas > 0) return NextResponse.json({ error: 'A payout is already being processed' }, { status: 400 });
    const amount = summary.availablePesewas;
    if (amount < MIN_PAYOUT_GHS * 100) return NextResponse.json({ error: `Minimum payout is GH₵${MIN_PAYOUT_GHS}` }, { status: 400 });

    const payoutRef = db.collection('payouts').doc();
    const reference = `PAY-${payoutRef.id}`;
    await payoutRef.set({
      organizationId: orgId, requestedBy: auth.uid, amount, currency: 'GHS', status: 'pending', reference,
      recipientCode: payout.recipientCode, provider: payout.provider, phone: payout.phone,
      createdAt: new Date(), updatedAt: new Date(),
    });

    try {
      const transfer = await initiateTransfer({ amount, recipient: payout.recipientCode, reference, reason: 'Tikiti ticket sales payout' });
      if (transfer.status === 'otp') {
        const reason = 'Paystack is asking for an OTP on transfers. Turn off "Confirm transfers with OTP" in Paystack Settings → Preferences so payouts can run automatically.';
        await payoutRef.update({ status: 'failed', transferCode: transfer.transfer_code, failureReason: reason, updatedAt: new Date() });
        return NextResponse.json({ error: reason }, { status: 502 });
      }
      const status = transfer.status === 'success' ? 'success' : 'processing';
      await payoutRef.update({ status, transferCode: transfer.transfer_code, updatedAt: new Date() });
      return NextResponse.json({ id: payoutRef.id, amount, status });
    } catch (err: any) {
      await payoutRef.update({ status: 'failed', failureReason: err.message, updatedAt: new Date() });
      return NextResponse.json({ error: err.message || 'Transfer failed' }, { status: 502 });
    }
  } catch (error: any) {
    console.error('[payouts/request]', error);
    return NextResponse.json({ error: error.message || 'Payout failed' }, { status: error.status || 500 });
  }
}
