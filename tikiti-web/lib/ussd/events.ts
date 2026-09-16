// Loads the events shown in the USSD menu: every active, not-ended, non-external event on the platform.
import type { Firestore } from 'firebase-admin/firestore';
import { eventHasEnded, eventPriceGhs } from '@/lib/payments/tickets';
import type { UssdEvent } from './menu';

export function isUssdSellable(event: any): boolean {
  if (!event) return false;
  if (event.isActive === false) return false;
  if (!['active', 'published'].includes(event.status)) return false;
  if (event.registrationUrl) return false;
  if (eventHasEnded(event)) return false;
  if (typeof event.availableTickets === 'number' && event.availableTickets <= 0) return false;
  return true;
}

export async function loadUssdEvents(db: Firestore): Promise<UssdEvent[]> {
  const snap = await db.collection('events').where('status', 'in', ['active', 'published']).get();
  const out: UssdEvent[] = [];
  snap.forEach((d) => {
    const ev = d.data();
    if (!isUssdSellable(ev)) return;
    out.push({ id: d.id, name: String(ev.name || 'Event'), date: String(ev.date || ''), priceGhs: eventPriceGhs(ev) });
  });
  out.sort((a, b) => a.date.localeCompare(b.date) || a.name.localeCompare(b.name));
  return out;
}
