// Program/Agenda types

import { SessionSpeaker, SpeakerRole } from './speaker';

export interface ProgramSession {
  id: string;
  title: string;
  description?: string;
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  date?: string; // YYYY-MM-DD (if multi-day)
  // Legacy single speaker (for backward compatibility)
  speaker?: {
    name: string;
    bio?: string;
    photo?: string;
    email?: string;
    speakerId?: string; // Link to speakers collection
  };
  // New: Multiple speakers support
  speakers?: SessionSpeaker[];
  location?: {
    name: string;
    address?: string;
  };
  track?: string; // For multi-track events
  capacity?: number;
  type: 'session' | 'break' | 'keynote' | 'workshop' | 'networking' | 'panel';
}

export { SpeakerRole };

export interface Program {
  sessions: ProgramSession[];
  scheduleQrCode?: string; // base64 or URL
}
