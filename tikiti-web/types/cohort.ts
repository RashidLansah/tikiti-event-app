import { Program } from './program';

export interface Cohort {
  id: string;
  name: string;
  description?: string;
  startDate: string;        // YYYY-MM-DD
  endDate?: string;         // YYYY-MM-DD (for multi-day cohorts)
  time?: string;            // Override event time (HH:mm)
  capacity: number;
  soldTickets: number;
  availableTickets: number;
  program?: Program;        // Cohort-specific schedule
  status: 'active' | 'completed' | 'cancelled';
}
