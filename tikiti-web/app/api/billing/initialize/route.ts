// POST /api/billing/initialize
// Initialize a Paystack transaction for subscription upgrade
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { initializeTransaction, getOrCreateCustomer } from '@/lib/billing/billingService';
import { getPlan, normalizePlanId } from '@/lib/billing/plans';

export async function POST(req: NextRequest) {
  try {
    const { planId, orgId } = await req.json();

    if (!planId || !orgId) {
      return NextResponse.json(
        { error: 'planId and orgId are required' },
        { status: 400 }
      );
    }

    // Validate the plan exists and is a paid plan
    const plan = getPlan(planId);
    if (!plan || plan.price === 0) {
      return NextResponse.json(
        { error: 'Invalid plan selected' },
        { status: 400 }
      );
    }

    if (!plan.paystackPlanCode) {
      return NextResponse.json(
        { error: 'Plan not configured for billing. Please contact support.' },
        { status: 500 }
      );
    }

    // Get organization details from Firestore
    const db = getAdminFirestore();
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgData = orgDoc.data()!;
    const orgEmail = orgData.email || '';
    const orgName = orgData.name || '';

    if (!orgEmail) {
      return NextResponse.json(
        { error: 'Organization email is required for billing. Please update your organization settings.' },
        { status: 400 }
      );
    }

    // Get or create Paystack customer
    const customer = await getOrCreateCustomer(orgEmail, orgName);

    // Build callback URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const callbackUrl = `${baseUrl}/dashboard/settings?tab=subscription&billing=verify`;

    // Initialize transaction with the plan
    // Paystack will charge the plan amount when plan code is provided
    const transaction = await initializeTransaction({
      email: orgEmail,
      amount: plan.price * 100, // Convert USD to cents
      currency: 'USD',
      callback_url: callbackUrl,
      plan: plan.paystackPlanCode,
      metadata: {
        orgId,
        planId: plan.id,
        orgName,
        custom_fields: [
          {
            display_name: 'Organization',
            variable_name: 'organization',
            value: orgName,
          },
          {
            display_name: 'Plan',
            variable_name: 'plan',
            value: plan.name,
          },
        ],
      },
      channels: ['card', 'mobile_money'],
    });

    // Store the reference in the org for later verification
    await db.collection('organizations').doc(orgId).update({
      'subscription.pendingReference': transaction.reference,
      updatedAt: new Date(),
    });

    return NextResponse.json({
      success: true,
      authorizationUrl: transaction.authorization_url,
      accessCode: transaction.access_code,
      reference: transaction.reference,
    });
  } catch (error: any) {
    console.error('Billing initialize error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to initialize payment. Please try again.' },
      { status: 500 }
    );
  }
}
