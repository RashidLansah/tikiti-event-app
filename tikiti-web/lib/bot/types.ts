// Shared types for the WhatsApp discovery / Q&A bot (see docs/whatsapp-bot.md).

export type BotIntent =
  | 'greeting' | 'menu_find' | 'menu_list' | 'menu_mine'
  | 'discover' | 'event_question' | 'submit_text' | 'other'
  | 'opt_in' | 'opt_out';

export type BotMessage =
  | { kind: 'text'; body: string; previewUrl?: boolean }
  | { kind: 'buttons'; body: string; buttons: Array<{ id: string; title: string }> };

export type EventCollection = 'events' | 'scraped_events';
export interface SessionEventRef { id: string; name: string; collection: EventCollection }

/** Bot fields on wa_sessions/{from}. The doc is shared with lib/inbox/submitterEdits.ts (`awaiting: 'pick_item'`). */
export interface BotSession {
  lastResults: SessionEventRef[];
  focusEvent: SessionEventRef | null;
  /** The last discover request, so follow-ups like "what about online ones?" keep their context */
  lastQuery: string;
  lastNudgeAt: number;
  botCount: number;
  /** Africa/Accra calendar day (YYYY-MM-DD) that botCount belongs to */
  botDay: string;
  updatedAt: number;
  /** Epoch ms after which lastResults / focusEvent / lastQuery are ignored */
  expiresAt: number;
  /** Weekly round-up offer awaiting a YES (valid 24h). Separate from `awaiting`, which the submitter-edit flow owns. */
  optInPending: { interest: string | null; city: string; at: number } | null;
  /** Epoch ms of the last opt-in offer (at most one per 7 days) */
  optInOfferedAt: number;
}

export interface BotPlan {
  intent: BotIntent;
  messages: BotMessage[];
  session?: Partial<BotSession>;
  log: Record<string, unknown>;
}

export interface BotInput {
  from: string;
  text?: string;
  buttonId?: string;
  hasRecentFlyer: boolean;
  /** Sender's WhatsApp profile name, when the webhook has it */
  profileName?: string | null;
  now?: Date;
}
