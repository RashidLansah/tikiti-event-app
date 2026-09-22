// Day-before SMS reminder for confirmed ticket holders. Runs once a day (09:00 Accra) from
// .github/workflows/day-before-reminders.yml → /api/reminders/day-before. Each booking is reminded at most once
// (`reminderSmsAt`). Only bookings with a phone number get a text; the ticket link is the same one-time link as the ticket SMS.
import type { Firestore } from 'firebase-admin/firestore';
import { sendSmsDetailed } from '@/lib/sms/send';
import { friendlyDate, accraDate } from '@/lib/sms/format';
import { ensureTicketToken, ticketBaseUrl, ticketUrl } from '@/lib/tickets/ticketToken';

const MAX_PER_RUN = 500;
const SMS_MAX = 160;

export function buildReminderSms(booking: any, link: string): string {
  const when = friendlyDate(booking.eventDate, booking.eventTime) || 'tomorrow';
  const venue = String(booking.eventLocation || '').replace(/\s+/g, ' ').trim();
  const build = (name: string, v: string) => `Tikiti reminder: ${name} is tomorrow, ${when}${v ? ` at ${v}` : ''}. Have your QR ready: ${link}`;
  let name = String(booking.eventName || 'your event').replace(/\s+/g, ' ');
  let msg = build(name, venue);
  if (msg.length > SMS_MAX && venue.includes(',')) msg = build(name, venue.split(',')[0]);
  if (msg.length > SMS_MAX && name.length > 20) { name = name.slice(0, 19).trimEnd() + '…'; msg = build(name, venue.split(',')[0]); }
  return msg;
}

export interface ReminderRunResult { date: string; candidates: number; sent: number; failed: number; skipped: number; dryRun: boolean }

export async function sendDayBeforeReminders(
  db: Firestore,
  opts: { date?: string; dryRun?: boolean; bookingId?: string } = {},
): Promise<ReminderRunResult> {
  const date = opts.date || accraDate(1);
  const dryRun = !!opts.dryRun;
  const res: ReminderRunResult = { date, candidates: 0, sent: 0, failed: 0, skipped: 0, dryRun };

  const docs = opts.bookingId
    ? [await db.collection('bookings').doc(opts.bookingId).get()].filter((d) => d.exists && d.data()!.eventDate === date)
    : (await db.collection('bookings').where('status', '==', 'confirmed').where('eventDate', '==', date).limit(MAX_PER_RUN).get()).docs;

  for (const d of docs) {
    const b = d.data()!;
    if (b.status !== 'confirmed' || b.reminderSmsAt || !b.phoneNumber) { res.skipped++; continue; }
    res.candidates++;
    if (dryRun) continue;
    try {
      const token = await ensureTicketToken(db, d.id);
      const msg = buildReminderSms(b, ticketUrl(ticketBaseUrl(), d.id, token));
      const r = await sendSmsDetailed(b.phoneNumber, msg);
      if (r.status === 'sent') { res.sent++; await d.ref.update({ reminderSmsAt: new Date(), reminderSmsProvider: r.provider }); }
      else res.failed++;
    } catch (e) { console.error('[reminders] booking failed', d.id, e); res.failed++; }
  }
  return res;
}
