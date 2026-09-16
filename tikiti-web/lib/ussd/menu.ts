// Pure USSD menu state machine. No I/O — takes (state, input, events) and returns the next screen.
// Keep every screen under ~160 chars: USSD screens are tiny.
import { INITIAL_SESSION, type UssdSessionState } from './session';

export interface UssdEvent {
  id: string;
  name: string;
  date: string;      // YYYY-MM-DD
  priceGhs: number;  // 0 = free
}

export interface PurchaseAction {
  type: 'purchase';
  eventId: string;
  quantity: number;
}

export interface MenuResult {
  message: string;
  continueSession: boolean;
  nextState: UssdSessionState;
  /** Present when the route must create a booking (and start payment for paid events). */
  action?: PurchaseAction;
}

export const PAGE_SIZE = 5;
export const MAX_QTY = 5;

const truncate = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1).trimEnd() + '…' : s);
export const fmtPrice = (ghs: number) => (ghs > 0 ? `GHS ${ghs.toFixed(2)}` : 'Free');

function fmtDate(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  if (!Number.isFinite(d.getTime())) return iso || '';
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function listScreen(events: UssdEvent[], page: number, header = 'Tikiti Events'): MenuResult {
  const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
  const p = Math.min(Math.max(0, page), totalPages - 1);
  const slice = events.slice(p * PAGE_SIZE, (p + 1) * PAGE_SIZE);
  if (events.length === 0) {
    return { message: 'Tikiti: no events on sale right now. Check back soon!', continueSession: false, nextState: INITIAL_SESSION };
  }
  const lines = slice.map((e, i) => `${i + 1}. ${truncate(e.name, 22)}`);
  if (p < totalPages - 1) lines.push('0. More');
  else if (p > 0) lines.push('0. Back');
  return {
    message: [header, ...lines].join('\n'),
    continueSession: true,
    nextState: { step: 'list', page: p, eventId: null, quantity: null },
  };
}

function detailScreen(ev: UssdEvent, page: number): MenuResult {
  return {
    message: `${truncate(ev.name, 40)}\n${fmtDate(ev.date)} - ${fmtPrice(ev.priceGhs)}\n1. Buy\n0. Back`,
    continueSession: true,
    nextState: { step: 'detail', page, eventId: ev.id, quantity: null },
  };
}

function quantityScreen(ev: UssdEvent, page: number): MenuResult {
  return {
    message: `How many tickets? (1-${MAX_QTY})\n${ev.priceGhs > 0 ? `${fmtPrice(ev.priceGhs)} each` : "Free event"}\n0. Back`,
    continueSession: true,
    nextState: { step: 'quantity', page, eventId: ev.id, quantity: null },
  };
}

function confirmScreen(ev: UssdEvent, qty: number, page: number): MenuResult {
  const total = ev.priceGhs * qty;
  return {
    message: `${qty} x ${truncate(ev.name, 24)}\nTotal: ${fmtPrice(total)}\n1. Confirm\n0. Back`,
    continueSession: true,
    nextState: { step: 'confirm', page, eventId: ev.id, quantity: qty },
  };
}

export function paidSuccessMessage() {
  return 'Payment prompt sent to your phone. Approve it to get your ticket by SMS.';
}
export function freeSuccessMessage() {
  return 'Done! Your ticket link is on its way by SMS.';
}

/** First screen of a new session. */
export function welcome(events: UssdEvent[]): MenuResult {
  return listScreen(events, 0, 'Welcome to Tikiti\nPick an event:');
}

/** Advance the state machine with the user's latest input. */
export function handleInput(state: UssdSessionState, rawInput: string, events: UssdEvent[]): MenuResult {
  const input = String(rawInput ?? '').trim();
  const findEvent = (id: string | null) => events.find((e) => e.id === id);
  const invalid = (screen: MenuResult): MenuResult => ({ ...screen, message: `Invalid choice.\n${screen.message}` });

  switch (state.step) {
    case 'list': {
      const totalPages = Math.max(1, Math.ceil(events.length / PAGE_SIZE));
      if (input === '0') {
        const next = state.page < totalPages - 1 ? state.page + 1 : 0;
        return listScreen(events, next);
      }
      const n = Number(input);
      const ev = Number.isInteger(n) && n >= 1 && n <= PAGE_SIZE ? events[state.page * PAGE_SIZE + n - 1] : undefined;
      if (!ev) return invalid(listScreen(events, state.page));
      return detailScreen(ev, state.page);
    }
    case 'detail': {
      const ev = findEvent(state.eventId);
      if (!ev) return listScreen(events, state.page, 'That event is no longer available.');
      if (input === '0') return listScreen(events, state.page);
      if (input === '1') return quantityScreen(ev, state.page);
      return invalid(detailScreen(ev, state.page));
    }
    case 'quantity': {
      const ev = findEvent(state.eventId);
      if (!ev) return listScreen(events, state.page, 'That event is no longer available.');
      if (input === '0') return detailScreen(ev, state.page);
      const n = Number(input);
      if (!Number.isInteger(n) || n < 1 || n > MAX_QTY) return invalid(quantityScreen(ev, state.page));
      return confirmScreen(ev, n, state.page);
    }
    case 'confirm': {
      const ev = findEvent(state.eventId);
      const qty = state.quantity || 1;
      if (!ev) return listScreen(events, state.page, 'That event is no longer available.');
      if (input === '0') return quantityScreen(ev, state.page);
      if (input === '1') {
        return {
          message: ev.priceGhs > 0 ? paidSuccessMessage() : freeSuccessMessage(),
          continueSession: false,
          nextState: INITIAL_SESSION,
          action: { type: 'purchase', eventId: ev.id, quantity: qty },
        };
      }
      return invalid(confirmScreen(ev, qty, state.page));
    }
    default:
      return welcome(events);
  }
}
