// "What's on in {city}" events digest. Email-client-safe: tables, inline styles, no external CSS/fonts/JS.
import { escapeHtml } from './send';

const SITE = 'https://www.gettikiti.com';

export interface DigestEvent {
  name: string;
  url: string;
  category?: string;
  /** Display-ready, e.g. "Sat, 3 Oct" */
  date: string;
  time?: string;
  venue?: string;
  /** Display-ready, e.g. "GH₵50"; empty / undefined → "Free" */
  price?: string;
  posterUrl?: string;
}

export function buildEventsDigestEmail(input: {
  city: string; events: DigestEvent[]; recipientName?: string; unsubscribeUrl: string; subjectPrefix?: string;
}): { subject: string; html: string; text: string } {
  const { city, events, unsubscribeUrl } = input;
  const first = (input.recipientName || '').trim().split(/\s+/)[0];
  const n = events.length;
  const subject = `${input.subjectPrefix || ''}What's on in ${city}: ${n} event${n === 1 ? '' : 's'} coming up`;
  const intro = `${first ? `Hi ${first}, here` : 'Here'} ${n === 1 ? 'is one plan' : `are ${n} plans`} worth making in ${city} over the next few weeks.`;
  const allUrl = `${SITE}/events`;
  const font = '-apple-system,Segoe UI,Helvetica,Arial,sans-serif';

  const cards = events.map((e) => {
    const price = e.price || 'Free';
    const when = `${e.date}${e.time ? ' · ' + e.time : ''}`;
    return `
      <tr><td style="padding:0 0 16px">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#fffef9" style="background:#fffef9;border:1px solid #deded4;border-radius:19px;border-collapse:separate;overflow:hidden">
          ${e.posterUrl ? `<tr><td style="padding:0;font-size:0;line-height:0"><a href="${escapeHtml(e.url)}"><img src="${escapeHtml(e.posterUrl)}" width="566" alt="${escapeHtml(e.name)}" style="display:block;width:100%;max-width:100%;height:auto;border:0;border-radius:18px 18px 0 0"></a></td></tr>` : ''}
          <tr><td style="padding:20px 22px 22px;font-family:${font}">
            <div style="font-size:11px;font-weight:700;letter-spacing:1px;color:#6256e8;text-transform:uppercase;margin:0 0 8px">${escapeHtml(e.category || 'Event')}</div>
            <div style="font-size:22px;line-height:1.15;font-weight:800;letter-spacing:-0.5px;color:#202220;margin:0 0 10px">${escapeHtml(e.name)}</div>
            <div style="font-size:14px;line-height:1.5;color:#202220;font-weight:600">${escapeHtml(when)}</div>
            <div style="font-size:14px;line-height:1.5;color:#65675d">${escapeHtml(e.venue || 'Venue to be announced')}</div>
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-top:16px"><tr>
              <td style="font-family:${font};font-size:16px;font-weight:800;color:#202220">${escapeHtml(price)}</td>
              <td align="right"><a href="${escapeHtml(e.url)}" style="display:inline-block;background:#f44929;color:#ffffff;text-decoration:none;font-family:${font};font-weight:700;font-size:14px;padding:12px 22px;border-radius:999px">View event</a></td>
            </tr></table>
          </td></tr>
        </table>
      </td></tr>`;
  }).join('');

  const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#faf9f2">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent">${escapeHtml(intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" bgcolor="#faf9f2" style="background:#faf9f2"><tr><td align="center" style="padding:32px 16px">
  <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px">
    <tr><td style="font-family:${font};font-size:26px;font-weight:800;letter-spacing:-1px;color:#202220;padding:0 0 18px">tikiti<span style="color:#f44929">✳︎</span></td></tr>
    <tr><td style="padding:0 0 8px"><h1 style="font-family:${font};font-size:34px;line-height:1.02;margin:0;font-weight:900;letter-spacing:-1px;color:#202220;text-transform:uppercase">What&#39;s on in<br><span style="color:#f44929">${escapeHtml(city)}.</span></h1></td></tr>
    <tr><td style="font-family:${font};font-size:15px;line-height:1.5;color:#65675d;padding:0 0 24px">${escapeHtml(intro)}</td></tr>
    ${cards}
    <tr><td align="center" style="padding:8px 0 28px;font-family:${font};font-size:15px;font-weight:700"><a href="${allUrl}" style="color:#6256e8;text-decoration:underline">See all events &rarr;</a></td></tr>
    <tr><td style="border-top:1px solid #deded4;padding:20px 0 0;font-family:${font};font-size:12px;line-height:1.6;color:#65675d">
      You&#39;re getting this because you registered for an event on Tikiti.<br>
      <a href="${escapeHtml(unsubscribeUrl)}" style="color:#65675d;text-decoration:underline">Unsubscribe</a> if you&#39;d rather not hear about events near you.<br><br>
      Tikiti by Pesewa Brands Solutions · Ghana
    </td></tr>
  </table>
</td></tr></table>
</body></html>`;

  const text = [
    `WHAT'S ON IN ${city.toUpperCase()}.`, '', intro, '',
    ...events.flatMap((e) => [
      `${(e.category || 'Event').toUpperCase()}: ${e.name}`,
      `${e.date}${e.time ? ' · ' + e.time : ''}`,
      e.venue || 'Venue to be announced',
      e.price || 'Free',
      `View event: ${e.url}`, '',
    ]),
    `See all events: ${allUrl}`, '',
    "You're getting this because you registered for an event on Tikiti.",
    `Unsubscribe: ${unsubscribeUrl}`,
    'Tikiti by Pesewa Brands Solutions · Ghana',
  ].join('\n');

  return { subject, html, text };
}
