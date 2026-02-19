// GET/POST /api/billing/manage
// Get subscription details or cancel subscription
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import {
  getSubscription,
  cancelSubscription,
} from '@/lib/billing/billingService';
import { getPlan, normalizePlanId } from '@/lib/billing/plans';

/**
 * GET — Get current subscription details for an organization
 */
export async function GET(req: NextRequest) {
  try {
    const orgId = req.nextUrl.searchParams.get('orgId');

    if (!orgId) {
      return NextResponse.json(
        { error: 'orgId is required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const orgDoc = await db.collection('organizations').doc(orgId).get();

    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgData = orgDoc.data()!;
    const subscription = orgData.subscription || {};
    const planId = normalizePlanId(subscription.plan);
    const plan = getPlan(planId);

    // If there's a Paystack subscription, fetch latest status
    let paystackSubscription = null;
    if (subscription.paystackSubscriptionCode) {
      try {
        paystackSubscription = await getSubscription(
          subscription.paystackSubscriptionCode
        );
      } catch (err) {
        console.error('Failed to fetch Paystack subscription:', err);
      }
    }

    return NextResponse.json({
      success: true,
      subscription: {
        plan: planId,
        planName: plan.name,
        price: plan.price,
        currency: plan.currency,
        status: subscription.status || 'active',
        startDate: subscription.startDate,
        endDate: subscription.endDate,
        nextPaymentDate: subscription.nextPaymentDate,
        lastPaymentDate: subscription.lastPaymentDate,
        cancelAtPeriodEnd: subscription.cancelAtPeriodEnd || false,
        features: plan.features,
        limits: plan.limits,
      },
      paystack: paystackSubscription
        ? {
            status: paystackSubscription.status,
            nextPaymentDate: paystackSubscription.next_payment_date,
            card: paystackSubscription.authorization
              ? {
                  last4: paystackSubscription.authorization.last4,
                  cardType: paystackSubscription.authorization.card_type,
                  bank: paystackSubscription.authorization.bank,
                }
              : null,
          }
        : null,
    });
  } catch (error: any) {
    console.error('Billing manage GET error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch subscription details' },
      { status: 500 }
    );
  }
}

/**
 * POST — Manage subscription (cancel, etc.)
 */
export async function POST(req: NextRequest) {
  try {
    const { action, orgId } = await req.json();

    if (!orgId || !action) {
      return NextResponse.json(
        { error: 'orgId and action are required' },
        { status: 400 }
      );
    }

    const db = getAdminFirestore();
    const orgRef = db.collection('organizations').doc(orgId);
    const orgDoc = await orgRef.get();

    if (!orgDoc.exists) {
      return NextResponse.json(
        { error: 'Organization not found' },
        { status: 404 }
      );
    }

    const orgData = orgDoc.data()!;
    const subscription = orgData.subscription || {};

    switch (action) {
      case 'cancel': {
        const subscriptionCode = subscription.paystackSubscriptionCode;
        const emailToken = subscription.paystackEmailToken;

        if (!subscriptionCode || !emailToken) {
          // No active Paystack subscription — just downgrade locally
          await orgRef.update({
            'subscription.plan': 'starter',
            'subscription.status': 'active',
            'subscription.paystackSubscriptionCode': null,
            'subscription.paystackEmailToken': null,
            'subscription.paystackAuthorizationCode': null,
            'subscription.cancelAtPeriodEnd': false,
            updatedAt: new Date(),
          });

          return NextResponse.json({
            success: true,
            message: 'Subscription cancelled. You are now on the Starter plan.',
          });
        }

        // Cancel on Paystack
        await cancelSubscription(subscriptionCode, emailToken);

        // Mark as cancelling at period end (Paystack handles the actual cancellation)
        await orgRef.update({
          'subscription.cancelAtPeriodEnd': true,
          updatedAt: new Date(),
        });

        return NextResponse.json({
          success: true,
          message:
            'Your subscription has been cancelled. You will continue to have access to your current plan until the end of your billing period.',
        });
      }

      default:
        return NextResponse.json(
          { error: `Unknown action: ${action}` },
          { status: 400 }
        );
    }
  } catch (error: any) {
    console.error('Billing manage POST error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to manage subscription' },
      { status: 500 }
    );
  }
}
