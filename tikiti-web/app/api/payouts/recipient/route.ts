// POST /api/payouts/recipient — save the organisation's mobile money payout account
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore, verifyRequestUser } from '@/lib/firebase/admin';
import { createTransferRecipient } from '@/lib/billing/billingService';
import { assertOrgRole } from '@/lib/payments/tickets';

export async function POST(req: NextRequest) {
  try {
    const auth = await verifyRequestUser(req.headers.get('authorization'));
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { orgId, provider, phone, name } = await req.json();
    if (!orgId) return NextResponse.json({ error: 'orgId is required' }, { status: 400 });
    const db = getAdminFirestore();
    await assertOrgRole(db, auth.uid, orgId, ['owner', 'admin']);

    const digits = String(phone || '').replace(/\D/g, '');
    if (!['mtn', 'telecel', 'airteltigo'].includes(provider)) return NextResponse.json({ error: 'Choose MTN, Telecel or AirtelTigo' }, { status: 400 });
    if (!/^0\d{9}$/.test(digits)) return NextResponse.json({ error: 'Enter a valid 10-digit Ghana number' }, { status: 400 });
    if (!name || String(name).trim().length < 3) return NextResponse.json({ error: 'Enter the account holder name' }, { status: 400 });

    const recipient = await createTransferRecipient({ name: String(name).trim(), provider, phone: digits });
    const payout = { provider, phone: digits, name: String(name).trim(), recipientCode: recipient.recipient_code, updatedBy: auth.uid, updatedAt: new Date() };
    await db.collection('organizations').doc(orgId).set({ payout }, { merge: true });
    return NextResponse.json({ payout: { provider, phone: digits, name: payout.name } });
  } catch (error: any) {
    console.error('[payouts/recipient]', error);
    return NextResponse.json({ error: error.message || 'Could not save payout account' }, { status: error.status || 500 });
  }
}
