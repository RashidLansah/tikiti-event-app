// Audience data model — one contact per person, keyed by phone (see lib/audience/contacts.ts). Server side only.
import type { Timestamp } from 'firebase-admin/firestore';

export const AUDIENCE_COLLECTION = 'audience';

export type AudienceChannel = 'whatsapp' | 'sms' | 'email';
export const AUDIENCE_CHANNELS: AudienceChannel[] = ['whatsapp', 'sms', 'email'];

export type AudienceSource =
  | 'google_form' | 'web_event_prompt' | 'web_signup' | 'registration'
  | 'whatsapp_bot' | 'ussd' | 'import' | 'backfill';

export type PriceComfort = 'free' | 'up_to_50' | 'up_to_100' | 'up_to_200' | 'over_200';
export const PRICE_COMFORTS: PriceComfort[] = ['free', 'up_to_50', 'up_to_100', 'up_to_200', 'over_200'];

export type ChannelConsent = { optedIn: boolean; at: Date | Timestamp; source: AudienceSource; wordingVersion: string };

export interface ConsentLogEntry {
  channel: AudienceChannel | 'all';
  action: 'opt_in' | 'opt_out';
  at: Date | Timestamp;
  source: AudienceSource;
  wordingVersion?: string;
}

export interface AudienceSignals {
  views: number;
  registerClicks: number;
  contactClicks: number;
  registrations: number;
  paidBookings: number;
  paidTotalPesewas: number;
  attended: number;
  botQueries: number;
  categories: Record<string, number>;
  cities: Record<string, number>;
  lastActiveAt?: Date | Timestamp;
}

export interface AudienceContact {
  id: string;
  /** E.164 digits, no plus */
  phone?: string;
  /** lowercased */
  email?: string;
  name?: string;
  city?: string;
  /** subset of INTEREST_TAGS */
  interests: string[];
  priceComfort?: PriceComfort;
  profession?: string;
  uid?: string;
  channels: Partial<Record<AudienceChannel, ChannelConsent>>;
  /** capped at 40, newest last */
  consentLog: ConsentLogEntry[];
  sources: AudienceSource[];
  signals: AudienceSignals;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
  lastContactedAt?: Date | Timestamp;
}

export type SignalType = 'view' | 'register_click' | 'contact_click' | 'registration' | 'paid_booking' | 'attended' | 'bot_query';

export function emptySignals(): AudienceSignals {
  return { views: 0, registerClicks: 0, contactClicks: 0, registrations: 0, paidBookings: 0, paidTotalPesewas: 0, attended: 0, botQueries: 0, categories: {}, cities: {} };
}
