// Sends ONE sample ticket email (real template, mock data) to a single hard-coded address. Touches no database.
// The QR has status "sample" and a fake purchaseId, so it can never validate at a gate.
// Run: npx tsx scripts/send-sample-ticket.ts
import { resolve } from 'path';
import { config } from 'dotenv';

config({ path: resolve(__dirname, '../.env.local') });

const TO = 'rashidlancergh2@gmail.com';

async function main() {
  const { sendTicketEmail, ticketQrPayload } = await import('../lib/email/ticketEmail'); // after env load: FROM is read at import
  const bookingId = 'SAMPLE-NOT-A-BOOKING-SAMPLE01';
  const booking = {
    qrCode: 'TKT-SAMPLE01', eventId: 'sample-event', eventName: 'Tamale Tech Meetup (SAMPLE)', userId: 'sample-user',
    userName: 'Rashid Lansah', userEmail: TO, quantity: 1, registrationType: 'free',
    eventDate: 'Sat, 3 Oct 2026', eventTime: '4:00 PM', eventLocation: 'HOPin Academy, Tamale',
  };
  const qrPayload = JSON.stringify({ ...JSON.parse(ticketQrPayload(booking, bookingId)), status: 'sample' });
  let id = '';
  const status = await sendTicketEmail(bookingId, booking, 'https://www.gettikiti.com/events', { subjectPrefix: '[SAMPLE] ', qrPayload, onId: (v) => { id = v; } });
  console.log(`status=${status} id=${id}`);
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
