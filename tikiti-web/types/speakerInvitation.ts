// Speaker invitation types for inviting speakers/panelists to events

import { SpeakerRole } from './speaker';

export interface SpeakerInvitation {
  id?: string;
  token: string; // Unique URL token for invitation link
  email: string;
  speakerName?: string; // Optional: organizer can pre-fill
  eventId: string;
  eventName: string;
  sessionId?: string; // Optional: link to specific session
  sessionTitle?: string;
  organizationId: string;
  organizationName: string;
  role: SpeakerRole;
  invitedBy: string; // userId
  inviterName: string;
  status: SpeakerInvitationStatus;
  speakerId?: string; // Populated after profile submission
  message?: string; // Personal message from organizer
  createdAt?: any;
  expiresAt: any; // 14 days by default
  submittedAt?: any;
}

export type SpeakerInvitationStatus =
  | 'pending'
  | 'submitted'
  | 'expired'
  | 'cancelled';

export interface CreateSpeakerInvitationData {
  email: string;
  speakerName?: string;
  eventId: string;
  eventName: string;
  sessionId?: string;
  sessionTitle?: string;
  organizationId: string;
  organizationName: string;
  role: SpeakerRole;
  invitedBy: string;
  inviterName: string;
  message?: string;
}
