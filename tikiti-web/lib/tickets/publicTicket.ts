import { getAdminFirestore } from '@/lib/firebase/admin';
import { ticketQrPayload } from '@/lib/email/ticketEmail';

export type PublicTicketState = 'active' | 'used' | 'inactive';

export interface PublicTicket {
  bookingId: string;
  refId: string;
  state: PublicTicketState;
  eventName: string;
  eventDate: string;
  eventTime: string;
  eventLocation: string;
  category: string;
  attendee: string;
  quantity: number;
  amount: string;
  usedAtLabel: string | null;
  qrPayload: string;
}

function toDate(v: any): Date | null {
  if (!v) return null;
  if (v instanceof Date) return v;
  if (typeof v.toDate === 'function') return v.toDate();
  const d = new Date(v);
  return Number.isFinite(d.getTime()) ? d : null;
}

/**
 * Loads a booking for the public ticket link. Returns null when the booking
 * is missing or the token does not match. Never returns the token itself.
 */
export async function loadPublicTicket(bookingId: string, token: string | undefined): Promise<PublicTicket | null> {
  if (!bookingId || !token || !/^[A-Za-z0-9_-]{16,64}$/.test(token)) return null;
  const snap = await getAdminFirestore().collection('bookings').doc(bookingId).get();
  const b = snap.data();
  if (!b || typeof b.ticketToken !== 'string' || b.ticketToken !== token) return null;

  const isUsed = b.status === 'used' || b.checkedIn === true;
  const state: PublicTicketState = isUsed ? 'used' : b.status === 'confirmed' ? 'active' : 'inactive';
  const usedAt = toDate(b.usedAt) || toDate(b.checkedInAt);
  const qty = b.quantity || 1;
  const isPaid = b.registrationType === 'paid';
  return {
    bookingId,
    refId: bookingId.slice(-8).toUpperCase(),
    state,
    eventName: b.eventName || 'Event',
    eventDate: b.eventDate || 'TBA',
    eventTime: b.eventTime || '',
    eventLocation: b.eventLocation || 'Venue to be announced',
    category: b.eventCategory || b.category || (isPaid ? 'Paid ticket' : 'Free ticket'),
    attendee: b.userName || b.userEmail || 'Guest',
    quantity: qty,
    amount: isPaid ? `GH₵${((b.gross || 0) / 100).toFixed(2)}` : 'Free',
    usedAtLabel: usedAt
      ? usedAt.toLocaleString('en-GB', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', timeZone: 'Africa/Accra' })
      : null,
    qrPayload: ticketQrPayload(b, bookingId),
  };
}
