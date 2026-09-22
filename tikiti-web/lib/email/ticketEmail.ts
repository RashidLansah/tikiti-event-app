import { friendlyDate } from '@/lib/sms/format';
import QRCode from 'qrcode';

const RESEND_URL = 'https://api.resend.com/emails';
const FROM = process.env.RESEND_FROM || 'Tikiti <onboarding@resend.dev>';

export function ticketQrPayload(booking: any, bookingId: string) {
  const refId = bookingId.slice(-8).toUpperCase();
  return JSON.stringify({
    ticketId: booking.qrCode || `TKT${refId}`,
    eventId: booking.eventId,
    eventName: booking.eventName,
    userId: booking.userId,
    userName: booking.userName || '',
    purchaseId: bookingId,
    quantity: booking.quantity || 1,
    status: 'confirmed',
  });
}

/** Emails the attendee their ticket with an inline QR. No-op when RESEND_API_KEY is unset. */
/** /t/{id}?k=… → /t/{id}/ticket.png?k=…&download=1 (served as an attachment). */
function ticketDownloadUrl(ticketUrl: string): string {
  const [path, query] = ticketUrl.split('?');
  if (!/\/t\/[^/]+$/.test(path)) return ticketUrl;
  return `${path}/ticket.png?${query ? `${query}&` : ''}download=1`;
}

export async function sendTicketEmail(bookingId: string, booking: any, ticketUrl?: string, opts: { subjectPrefix?: string; qrPayload?: string; onId?: (id: string) => void } = {}): Promise<'sent' | 'skipped' | 'failed'> {
  const apiKey = process.env.RESEND_API_KEY;
  const to = booking.userEmail;
  if (!apiKey || !to) return 'skipped';

  const refId = bookingId.slice(-8).toUpperCase();
  const qty = booking.quantity || 1;
  const isPaid = booking.registrationType === 'paid';
  const amount = isPaid ? `GH₵${((booking.gross || 0) / 100).toFixed(2)}` : 'Free';
  const qrPng = await QRCode.toBuffer(opts.qrPayload || ticketQrPayload(booking, bookingId), { width: 360, margin: 1, color: { dark: '#202220', light: '#ffffff' } });

  const html = `
  <div style="background:#faf9f2;padding:32px 16px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#202220">
    <div style="max-width:480px;margin:0 auto">
      <div style="font-size:26px;font-weight:800;letter-spacing:-1px;margin-bottom:18px">tikiti<span style="color:#f44929">✳</span></div>
      <h1 style="font-size:30px;line-height:1.05;margin:0 0 8px;font-weight:900">ONE GOOD PLAN.<br><span style="color:#f44929">ONE HAPPY TICKET.</span></h1>
      <p style="color:#65675d;margin:0 0 24px">${isPaid ? 'Payment confirmed' : 'Registration confirmed'} — here is your ticket for <strong>${escapeHtml(booking.eventName || 'your event')}</strong>.</p>
      ${ticketUrl ? `<div style="text-align:center;margin:0 0 20px"><a href="${escapeHtml(ticketDownloadUrl(ticketUrl))}" style="display:inline-block;background:#f44929;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px">Download my ticket</a><div style="margin-top:10px;font-size:13px"><a href="${escapeHtml(ticketUrl)}" style="color:#65675d">or view it online</a></div></div>` : ''}
      <div style="border:1px solid #deded4;border-radius:19px;overflow:hidden;background:#fffef9">
        <div style="background:#6256e8;color:#fff;padding:22px">
          <div style="font-size:11px;letter-spacing:1px;opacity:.75;margin-bottom:10px">TIKITI TICKET</div>
          <div style="font-size:24px;font-weight:700;line-height:1.1">${escapeHtml(booking.eventName || 'Event')}</div>
          <div style="font-size:13px;margin-top:8px">${escapeHtml(booking.eventLocation || 'Venue to be announced')}</div>
        </div>
        <table style="width:100%;border-collapse:collapse;border-bottom:1px dashed #b6b6ad"><tr>
          <td style="padding:18px 20px;font-size:11px;color:#65675d">DATE<br><span style="font-size:14px;font-weight:700;color:#202220">${escapeHtml(friendlyDate(booking.eventDate) || booking.eventDate || 'TBA')}${booking.eventTime ? ' · ' + escapeHtml(booking.eventTime) : ''}</span></td>
          <td style="padding:18px 20px;font-size:11px;color:#65675d">ATTENDEE<br><span style="font-size:14px;font-weight:700;color:#202220">${escapeHtml(booking.userName || to)}</span></td>
          <td style="padding:18px 20px;font-size:11px;color:#65675d;text-align:right">ADMISSION<br><span style="font-size:14px;font-weight:700;color:#202220">${qty} ${qty === 1 ? 'person' : 'people'}</span></td>
        </tr></table>
        <div style="padding:22px;text-align:center">
          <img src="cid:ticket-qr" width="180" height="180" alt="Your ticket QR code" style="border:1px solid #deded4;border-radius:12px;padding:8px;background:#fff">
          <div style="font-size:12px;color:#65675d;margin-top:12px">${refId}<br>Scan at the door · ${amount}</div>
        </div>
      </div>
      <div style="margin-top:18px;padding:14px 16px;border:1px solid #f44929;border-radius:14px;background:#fff4f1;font-size:13px;line-height:1.5;color:#202220"><strong>Keep this ticket to yourself.</strong> It works once: the first scan at the gate uses it up, and anyone scanned after that with the same code will be turned away. Don’t forward this email or post the QR code.</div>
      <p style="font-size:12px;color:#65675d;margin-top:16px">Your ticket also lives in the Tickets tab of the Tikiti app.</p>
    </div>
  </div>`;

  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: FROM,
      to: [to],
      subject: `${opts.subjectPrefix || ''}Your ticket · ${booking.eventName || 'Tikiti event'} (${refId})`,
      html,
      attachments: [{ filename: 'ticket-qr.png', content: qrPng.toString('base64'), content_id: 'ticket-qr' }],
      tags: [{ name: 'type', value: 'ticket' }],
    }),
  });
  if (!res.ok) {
    console.error('[ticketEmail] Resend error', res.status, await res.text().catch(() => ''));
    return 'failed';
  }
  if (opts.onId) { const j = await res.json().catch(() => null); if (j?.id) opts.onId(String(j.id)); }
  return 'sent';
}

function escapeHtml(s: string) {
  return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}
