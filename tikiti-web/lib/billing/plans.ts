// Subscription plan definitions and helpers

export type PlanId = 'starter' | 'pro';

export interface PlanLimits {
  maxActiveEvents: number; // -1 = unlimited
  maxAttendeesPerEvent: number; // -1 = unlimited
  maxTeamMembers: number; // -1 = unlimited
  maxSpeakersPerEvent: number; // -1 = unlimited
}

export interface PlanFeatures {
  aiDescription: boolean;
  customBranding: boolean;
  analyticsExport: boolean;
  prioritySupport: boolean;
  bulkEmail: boolean;
}

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // in GHS
  currency: string;
  interval: 'monthly';
  description: string;
  limits: PlanLimits;
  features: PlanFeatures;
  paystackPlanCode: string | null; // null for free plan
  highlighted?: boolean; // for UI badge
}

export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: 'starter',
    name: 'Free',
    price: 0,
    currency: 'GHS',
    interval: 'monthly',
    description: 'Everything you need for your first event',
    limits: {
      maxActiveEvents: 1,
      maxAttendeesPerEvent: -1,
      maxTeamMembers: -1,
      maxSpeakersPerEvent: -1,
    },
    features: {
      aiDescription: true,
      customBranding: true,
      analyticsExport: true,
      prioritySupport: false,
      bulkEmail: true,
    },
    paystackPlanCode: null,
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 29,
    currency: 'GHS',
    interval: 'monthly',
    description: 'Unlimited events for growing organisations',
    limits: {
      maxActiveEvents: -1,
      maxAttendeesPerEvent: -1,
      maxTeamMembers: -1,
      maxSpeakersPerEvent: -1,
    },
    features: {
      aiDescription: true,
      customBranding: true,
      analyticsExport: true,
      prioritySupport: true,
      bulkEmail: true,
    },
    paystackPlanCode: process.env.PAYSTACK_PRO_PLAN_CODE || '',
    highlighted: true,
  },
};

// Map legacy plan names to new plan IDs
const LEGACY_PLAN_MAP: Record<string, PlanId> = {
  free: 'starter',
  starter: 'starter',
  pro: 'pro',
  enterprise: 'pro',
  business: 'pro',
};

/**
 * Normalize a plan name (handles legacy names)
 */
export function normalizePlanId(plan: string | undefined | null): PlanId {
  if (!plan) return 'starter';
  return LEGACY_PLAN_MAP[plan.toLowerCase()] || 'starter';
}

/**
 * Get plan configuration by ID
 */
export function getPlan(planId: string): Plan {
  const normalized = normalizePlanId(planId);
  return PLANS[normalized];
}

/**
 * Get plan limits for a given plan
 */
export function getPlanLimits(planId: string): PlanLimits {
  return getPlan(planId).limits;
}

/**
 * Get plan features for a given plan
 */
export function getPlanFeatures(planId: string): PlanFeatures {
  return getPlan(planId).features;
}

/**
 * Get all plans as an ordered array (for UI display)
 */
export function getAllPlans(): Plan[] {
  return [PLANS.starter, PLANS.pro];
}

/**
 * Check if a plan is an upgrade from another
 */
export function isUpgrade(fromPlan: string, toPlan: string): boolean {
  const order: Record<PlanId, number> = { starter: 0, pro: 1 };
  const from = normalizePlanId(fromPlan);
  const to = normalizePlanId(toPlan);
  return order[to] > order[from];
}

/**
 * Format price for display
 */
export function formatPrice(plan: Plan): string {
  if (plan.price === 0) return 'Free';
  return `GHS ${plan.price}/mo`;
}

/**
 * Format a limit value for display (-1 = Unlimited)
 */
export function formatLimit(value: number): string {
  return value === -1 ? 'Unlimited' : String(value);
}
