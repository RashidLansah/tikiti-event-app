// Feature gating utility
// Checks organization subscription to determine feature access
//
// Simplified 2-tier model:
// - Free: All features, limited to 1 active event
// - Pro: Everything unlimited + priority support

import { Organization } from '../services/organizationService';
import { getPlanLimits, getPlanFeatures, normalizePlanId, type PlanId } from './plans';

/**
 * Get the effective plan for an organization.
 * If subscription is expired or past_due, treat as 'starter' (free).
 */
function getEffectivePlan(org: Organization | null | undefined): PlanId {
  if (!org?.subscription) return 'starter';
  const status = org.subscription.status;
  if (status === 'expired' || status === 'past_due') return 'starter';
  return normalizePlanId(org.subscription.plan);
}

/**
 * Check if the org can create a new event.
 * This is the PRIMARY gate — free plan is limited to 1 active event.
 */
export function canCreateEvent(
  org: Organization | null | undefined,
  currentActiveEventCount: number
): { allowed: boolean; limit: number; current: number; requiredPlan?: PlanId } {
  const plan = getEffectivePlan(org);
  const limits = getPlanLimits(plan);

  if (limits.maxActiveEvents === -1) {
    return { allowed: true, limit: -1, current: currentActiveEventCount };
  }

  if (currentActiveEventCount >= limits.maxActiveEvents) {
    return {
      allowed: false,
      limit: limits.maxActiveEvents,
      current: currentActiveEventCount,
      requiredPlan: 'pro',
    };
  }

  return { allowed: true, limit: limits.maxActiveEvents, current: currentActiveEventCount };
}

/**
 * Check if the org can add more attendees to an event
 * (Currently unlimited on all plans)
 */
export function canAddAttendee(
  org: Organization | null | undefined,
  currentAttendeeCount: number
): { allowed: boolean; limit: number; current: number; requiredPlan?: PlanId } {
  const plan = getEffectivePlan(org);
  const limits = getPlanLimits(plan);

  if (limits.maxAttendeesPerEvent === -1) {
    return { allowed: true, limit: -1, current: currentAttendeeCount };
  }

  if (currentAttendeeCount >= limits.maxAttendeesPerEvent) {
    return {
      allowed: false,
      limit: limits.maxAttendeesPerEvent,
      current: currentAttendeeCount,
      requiredPlan: 'pro',
    };
  }

  return { allowed: true, limit: limits.maxAttendeesPerEvent, current: currentAttendeeCount };
}

/**
 * Check if the org can add more team members
 * (Currently unlimited on all plans)
 */
export function canAddTeamMember(
  org: Organization | null | undefined,
  currentMemberCount: number
): { allowed: boolean; limit: number; current: number; requiredPlan?: PlanId } {
  const plan = getEffectivePlan(org);
  const limits = getPlanLimits(plan);

  if (limits.maxTeamMembers === -1) {
    return { allowed: true, limit: -1, current: currentMemberCount };
  }

  if (currentMemberCount >= limits.maxTeamMembers) {
    return {
      allowed: false,
      limit: limits.maxTeamMembers,
      current: currentMemberCount,
      requiredPlan: 'pro',
    };
  }

  return { allowed: true, limit: limits.maxTeamMembers, current: currentMemberCount };
}

/**
 * Check if the org can invite more speakers to an event
 * (Currently unlimited on all plans)
 */
export function canInviteSpeaker(
  org: Organization | null | undefined,
  currentSpeakerCount: number
): { allowed: boolean; limit: number; current: number; requiredPlan?: PlanId } {
  const plan = getEffectivePlan(org);
  const limits = getPlanLimits(plan);

  if (limits.maxSpeakersPerEvent === -1) {
    return { allowed: true, limit: -1, current: currentSpeakerCount };
  }

  if (currentSpeakerCount >= limits.maxSpeakersPerEvent) {
    return {
      allowed: false,
      limit: limits.maxSpeakersPerEvent,
      current: currentSpeakerCount,
      requiredPlan: 'pro',
    };
  }

  return { allowed: true, limit: limits.maxSpeakersPerEvent, current: currentSpeakerCount };
}

/**
 * Check if the org can use AI description generation
 * (Available on all plans)
 */
export function canUseAI(org: Organization | null | undefined): {
  allowed: boolean;
  requiredPlan?: PlanId;
} {
  // AI is available on all plans
  return { allowed: true };
}

/**
 * Check if the org can use custom branding
 * (Available on all plans)
 */
export function canUseCustomBranding(org: Organization | null | undefined): {
  allowed: boolean;
  requiredPlan?: PlanId;
} {
  return { allowed: true };
}

/**
 * Check if the org can export analytics
 * (Available on all plans)
 */
export function canExportAnalytics(org: Organization | null | undefined): {
  allowed: boolean;
  requiredPlan?: PlanId;
} {
  return { allowed: true };
}

/**
 * Check if the org can send bulk emails
 * (Available on all plans)
 */
export function canSendBulkEmail(org: Organization | null | undefined): {
  allowed: boolean;
  requiredPlan?: PlanId;
} {
  return { allowed: true };
}

/**
 * Get a user-friendly upgrade message
 */
export function getUpgradeMessage(requiredPlan: PlanId): string {
  return 'Upgrade to Pro to unlock unlimited events';
}
