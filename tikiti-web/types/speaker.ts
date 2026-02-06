// Speaker types for event speakers, panelists, moderators, etc.

export interface Speaker {
  id?: string;
  name: string;
  email: string;
  jobTitle?: string;
  company?: string;
  bio?: string;
  photoBase64?: string; // Max 500KB
  photoUrl?: string; // For future Firebase Storage integration
  linkedInUrl?: string;
  twitterHandle?: string;
  websiteUrl?: string;
  organizationId: string;
  status: 'invited' | 'profile_submitted' | 'active';
  createdAt?: any;
  updatedAt?: any;
  createdBy: string; // userId who invited them
}

export interface SpeakerSession {
  speakerId: string;
  eventId: string;
  sessionId: string;
  role: SpeakerRole;
  addedAt: any;
}

export type SpeakerRole = 'speaker' | 'panelist' | 'moderator' | 'host';

// For use in ProgramSession
export interface SessionSpeaker {
  speakerId: string;
  role: SpeakerRole;
}
