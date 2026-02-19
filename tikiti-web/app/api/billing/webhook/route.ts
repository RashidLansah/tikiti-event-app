// POST /api/billing/webhook
// Paystack webhook handler for subscription events
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyWebhookSignature } from '@/lib/billing/billingService';
import { normalizePlanId } from '@/lib/billing/plans';

// Disable Next.js body parsing — we need the raw body for signature verification
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get('x-paystack-signature') || '';

    // Verify webhook signature
    if (!verifyWebhookSignature(rawBody, signature)) {
      console.error('Invalid Paystack webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventType = event.event;
    const data = event.data;

    console.log(`[Paystack Webhook] Event: ${eventType}`);

    const db = getAdminFirestore();

    switch (eventType) {
      case 'subscription.create': {
        await handleSubscriptionCreate(db, data);
        break;
      }

      case 'charge.success': {
        await handleChargeSuccess(db, data);
        break;
      }

      case 'subscription.not_renew': {
        await handleSubscriptionNotRenew(db, data);
        break;
      }

      case 'subscription.disable': {
        await handleSubscriptionDisable(db, data);
        break;
      }

      case 'invoice.payment_failed': {
        await handlePaymentFailed(db, data);
        break;
      }

      default:
        console.log(`[Paystack Webhook] Unhandled event type: ${eventType}`);
    }

    // Always return 200 to Paystack — they retry on non-200
    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('Webhook processing error:', error);
    // Still return 200 so Paystack doesn't keep retrying
    return NextResponse.json({ received: true, error: error.message });
  }
}

// ─── Event Handlers ─────────────────────────────────────────

async function findOrgByCustomerCode(
  db: FirebaseFirestore.Firestore,
  customerCode: string
): Promise<{ id: string; data: FirebaseFirestore.DocumentData } | null> {
  const orgsRef = db.collection('organizations');
  const snapshot = await orgsRef
    .where('subscription.paystackCustomerCode', '==', customerCode)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, data: doc.data() };
}

async function findOrgByEmail(
  db: FirebaseFirestore.Firestore,
  email: string
): Promise<{ id: string; data: FirebaseFirestore.DocumentData } | null> {
  const orgsRef = db.collection('organizations');
  const snapshot = await orgsRef
    .where('email', '==', email)
    .limit(1)
    .get();

  if (snapshot.empty) return null;
  const doc = snapshot.docs[0];
  return { id: doc.id, data: doc.data() };
}

async function findOrg(
  db: FirebaseFirestore.Firestore,
  data: any
): Promise<{ id: string; data: FirebaseFirestore.DocumentData } | null> {
  // Try metadata.orgId first
  const orgId = data.metadata?.orgId;
  if (orgId) {
    const doc = await db.collection('organizations').doc(orgId).get();
    if (doc.exists) return { id: doc.id, data: doc.data()! };
  }

  // Try customer code
  const customerCode = data.customer?.customer_code;
  if (customerCode) {
    const org = await findOrgByCustomerCode(db, customerCode);
    if (org) return org;
  }

  // Try email
  const email = data.customer?.email;
  if (email) {
    const org = await findOrgByEmail(db, email);
    if (org) return org;
  }

  return null;
}

async function handleSubscriptionCreate(
  db: FirebaseFirestore.Firestore,
  data: any
) {
  const org = await findOrg(db, data);
  if (!org) {
    console.error('[Webhook] subscription.create — could not find org for customer:', data.customer?.customer_code);
    return;
  }

  const subscriptionCode = data.subscription_code;
  const emailToken = data.email_token;
  const planCode = data.plan?.plan_code;
  const nextPaymentDate = data.next_payment_date;

  await db.collection('organizations').doc(org.id).update({
    'subscription.status': 'active',
    'subscription.paystackSubscriptionCode': subscriptionCode || null,
    'subscription.paystackEmailToken': emailToken || null,
    'subscription.nextPaymentDate': nextPaymentDate ? new Date(nextPaymentDate) : null,
    updatedAt: new Date(),
  });

  console.log(`[Webhook] subscription.create — org ${org.id} subscription activated`);
}

async function handleChargeSuccess(
  db: FirebaseFirestore.Firestore,
  data: any
) {
  // Only handle subscription charges (has plan object)
  if (!data.plan_object && !data.plan) return;

  const org = await findOrg(db, data);
  if (!org) {
    console.error('[Webhook] charge.success — could not find org for customer:', data.customer?.customer_code);
    return;
  }

  const now = new Date();
  const nextMonth = new Date(now);
  nextMonth.setMonth(nextMonth.getMonth() + 1);

  await db.collection('organizations').doc(org.id).update({
    'subscription.status': 'active',
    'subscription.lastPaymentDate': now,
    'subscription.nextPaymentDate': nextMonth,
    updatedAt: now,
  });

  console.log(`[Webhook] charge.success — org ${org.id} payment recorded`);
}

async function handleSubscriptionNotRenew(
  db: FirebaseFirestore.Firestore,
  data: any
) {
  const org = await findOrg(db, data);
  if (!org) {
    console.error('[Webhook] subscription.not_renew — could not find org');
    return;
  }

  // Subscription will end at the current period end
  // Don't downgrade immediately — let them use until period ends
  await db.collection('organizations').doc(org.id).update({
    'subscription.status': 'active', // Keep active until period ends
    'subscription.cancelAtPeriodEnd': true,
    updatedAt: new Date(),
  });

  console.log(`[Webhook] subscription.not_renew — org ${org.id} will cancel at period end`);
}

async function handleSubscriptionDisable(
  db: FirebaseFirestore.Firestore,
  data: any
) {
  const org = await findOrg(db, data);
  if (!org) {
    console.error('[Webhook] subscription.disable — could not find org');
    return;
  }

  // Subscription is now fully cancelled
  await db.collection('organizations').doc(org.id).update({
    'subscription.plan': 'starter',
    'subscription.status': 'active', // Starter is always active
    'subscription.paystackSubscriptionCode': null,
    'subscription.paystackEmailToken': null,
    'subscription.paystackAuthorizationCode': null,
    'subscription.cancelAtPeriodEnd': false,
    'subscription.endDate': new Date(),
    updatedAt: new Date(),
  });

  console.log(`[Webhook] subscription.disable — org ${org.id} downgraded to starter`);
}

async function handlePaymentFailed(
  db: FirebaseFirestore.Firestore,
  data: any
) {
  const org = await findOrg(db, data);
  if (!org) {
    console.error('[Webhook] invoice.payment_failed — could not find org');
    return;
  }

  await db.collection('organizations').doc(org.id).update({
    'subscription.status': 'past_due',
    updatedAt: new Date(),
  });

  console.log(`[Webhook] invoice.payment_failed — org ${org.id} marked as past_due`);
}
