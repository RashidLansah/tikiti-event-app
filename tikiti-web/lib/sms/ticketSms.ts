import { sendSms } from '@/lib/sms/send';
import { friendlyDate } from '@/lib/sms/format';

export function buildTicketSmsMessage(bookingId: string, booking: any, ticketUrl?: string): string {
  const refId = bookingId.slice(-8).toUpperCase();
  const name = booking.eventName || 'your event';
  const pretty = friendlyDate(booking.eventDate, booking.eventTime);
  const date = pretty ? ` on ${pretty}` : '';
  const paid = booking.registrationType === 'paid' ? ` Paid GHS ${((booking.gross || 0) / 100).toFixed(2)}.` : '';
  if (ticketUrl) {
    // Keep under ~160 chars: trim the event name if the link makes it long.
    const build = (n: string) => `Tikiti: ${paid ? 'payment received' : 'ticket'} for ${n}${date} confirmed.${paid} Ref ${refId}. One-time use, don't share: ${ticketUrl}`;
    let msg = build(name);
    if (msg.length > 160 && name.length > 20) msg = build(name.slice(0, 19).trimEnd() + '…');
    return msg;
  }
  let msg = `Tikiti: your ticket for ${name}${date} is confirmed. Ref ${refId}. Show the QR in the Tikiti app (Tickets tab) at the door.`;
  if (booking.registrationType === 'paid') msg += ` Paid GH₵${((booking.gross || 0) / 100).toFixed(2)}`;
  return msg;
}

export async function sendTicketSms(bookingId: string, booking: any, ticketUrl?: string): Promise<'sent' | 'skipped' | 'failed'> {
  if (!booking?.phoneNumber) return 'skipped';
  return sendSms(booking.phoneNumber, buildTicketSmsMessage(bookingId, booking, ticketUrl));
}
