// POST /api/billing/verify
// Verify a Paystack transaction and activate subscription
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { verifyTransaction, createSubscription } from '@/lib/billing/billingService';
import { getPlan, normalizePlanId } from '@/lib/billing/plans';

export async function POST(req: NextRequest) {
  try {
    const { reference, orgId } = await req.json();

    if (!reference) {
      return NextResponse.json(
        { error: 'Transaction reference is required' },
        { status: 400 }
      );
    }

    // Verify the transaction with Paystack
    const transaction = await verifyTransaction(reference);

    if (transaction.status !== 'success') {
      return NextResponse.json(
        { error: `Payment was not successful. Status: ${transaction.status}` },
        { status: 400 }
      );
    }

    // Extract metadata
    const metadata = transaction.metadata || {};
    const resolvedOrgId = orgId || metadata.orgId;
    const planId = metadata.planId;

    if (!resolvedOrgId) {
      return NextResponse.json(
        { error: 'Could not determine organization' },
        { status: 400 }
      );
    }

    const plan = getPlan(planId);
    if (!plan) {
      return NextResponse.json(
        { error: 'Invalid plan in transaction' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const orgRef = db.collection('organizations').doc(resolvedOrgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    // The transaction was successful — the subscription is created by Paystack
    // when a plan code is passed during initialization.
    // We need to find the subscription code from the transaction or customer.

    const customerCode = transaction.customer.customer_code;
    const authorizationCode = transaction.authorization?.authorization_code;

    // Update organization subscription in Firestore
    const now = new Date();
    const nextMonth = new Date(now);
    nextMonth.setMonth(nextMonth.getMonth() + 1);

    const subscriptionUpdate: Record<string, any> = {
      'subscription.plan': plan.id,
      'subscription.status': 'active',
      'subscription.startDate': now,
      'subscription.endDate': nextMonth,
      'subscription.paystackCustomerCode': customerCode,
      'subscription.paystackAuthorizationCode': authorizationCode || null,
      'subscription.lastPaymentDate': now,
      'subscription.nextPaymentDate': nextMonth,
      'subscription.pendingReference': null, // Clear pending reference
      updatedAt: now,
    };

    // If Paystack created a subscription (plan code was passed),
    // the subscription_code comes via webhook. We'll update it there.
    // For now, store what we have.
    if (transaction.plan_object?.plan_code) {
      subscriptionUpdate['subscription.paystackPlanCode'] = transaction.plan_object.plan_code;
    }

    await orgRef.update(subscriptionUpdate);

    return NextResponse.json({
      success: true,
      plan: plan.id,
      planName: plan.name,
      status: 'active',
      message: `Successfully upgraded to ${plan.name} plan!`,
    });
  } catch (error: any) {
    console.error('Billing verify error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to verify payment. Please contact support.' },
      { status: 500 }
    );
  }
}
