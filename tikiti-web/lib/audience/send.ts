// Sends one event promo on ONE channel to the matched, consented audience. Server side only.
// WhatsApp promos go out ONLY as an approved marketing template (env WHATSAPP_TPL_EVENT_PROMO) — never free-form text.
import type { Firestore } from 'firebase-admin/firestore';
import { normaliseGhPhone } from '@/lib/events/contact';
import { postMessage } from '@/lib/inbox/notifyAdmins';
import { sendSms } from '@/lib/sms/arkesel';
import { escapeHtml, sendEmail } from '@/lib/email/send';
import { normaliseEmail, unsubscribeToken } from './contacts';
import { matchAudienceForEvent, type MatchEvent, type MatchMode } from './match';
import { AUDIENCE_CHANNELS, AUDIENCE_COLLECTION, type AudienceChannel } from './types';

export const AUDIENCE_SENDS_COLLECTION = 'audience_sends';
export const DEFAULT_LIMIT = 200;
export const MAX_LIMIT = 1000;
const SITE = 'https://www.gettikiti.com';
const SEND_DELAY_MS = 150;
const SMS_MAX = 300;
const SMS_TAIL = ' Reply STOP to opt out';

export interface SendPromoInput {
  eventId: string;
  channel: AudienceChannel;
  mode?: MatchMode;
  cooldownDays?: number;
  limit?: number;
  /** a phone or email: send ONE message there, touch no contact */
  testTo?: string;
  dryRun?: boolean;
  adminEmail: string;
  /** real sends only: must equal the number that will be sent */
  confirmCount?: number;
}

export interface SendPromoResult {
  status: 'sent' | 'blocked' | 'count_mismatch' | 'invalid';
  channel: AudienceChannel;
  dryRun: boolean;
  test: boolean;
  requested: number;
  sent: number;
  failed: number;
  blockedReason?: string;
  /** on count_mismatch: the number that would be sent right now */
  current?: number;
  sampleErrors: string[];
  sendId?: string;
}

export function parseLimit(raw: unknown): number {
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_LIMIT) : DEFAULT_LIMIT;
}

export const eventLink = (id: string) => `${SITE}/events/${id}`;

function prettyDate(ev: MatchEvent): string {
  const d = /^\d{4}-\d{2}-\d{2}$/.test(ev.date) ? new Date(`${ev.date}T12:00:00Z`) : null;
  const date = d && Number.isFinite(d.getTime())
    ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    : ev.date || 'Date TBA';
  return ev.time ? `${date}, ${ev.time}` : date;
}

const venueOf = (ev: MatchEvent) => (ev.isOnline ? 'Online' : ev.location || 'Venue TBA');
/** WhatsApp template params may not contain newlines, tabs or runs of 4+ spaces. */
const tplParam = (s: string, max = 120) => s.replace(/\s+/g, ' ').trim().slice(0, max) || '-';

export function buildSms(ev: MatchEvent): string {
  const link = eventLink(ev.id);
  const build = (name: string, venue: string) => `Tikiti: ${name} - ${prettyDate(ev)}, ${venue}. ${ev.priceLabel}. ${link}${SMS_TAIL}`;
  let name = ev.name.replace(/\s+/g, ' ');
  let venue = venueOf(ev).replace(/\s+/g, ' ');
  let msg = build(name, venue);
  if (msg.length > SMS_MAX) { venue = venue.split(',')[0].slice(0, 40); msg = build(name, venue); }
  if (msg.length > SMS_MAX) { name = name.slice(0, Math.max(10, name.length - (msg.length - SMS_MAX) - 3)).trimEnd() + '...'; msg = build(name, venue); }
  return msg;
}

export function buildEmail(ev: MatchEvent, unsubscribeUrl: string): { subject: string; html: string; text: string } {
  const link = eventLink(ev.id);
  const subject = `${ev.name} · ${prettyDate(ev)}`;
  const text = `${ev.name}\n${prettyDate(ev)}\n${venueOf(ev)}\n${ev.priceLabel}\n\nDetails and tickets: ${link}\n\nYou are getting this because you asked Tikiti to tell you about events like this. Unsubscribe: ${unsubscribeUrl}`;
  const html = `
  <div style="background:#faf9f2;padding:32px 16px;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#202220">
    <div style="max-width:480px;margin:0 auto">
      <div style="font-size:26px;font-weight:800;letter-spacing:-1px;margin-bottom:18px">tikiti<span style="color:#f44929">✳</span></div>
      <p style="color:#65675d;margin:0 0 12px">An event we think you'll like</p>
      <div style="border:1px solid #deded4;border-radius:19px;overflow:hidden;background:#fffef9">
        <div style="background:#6256e8;color:#fff;padding:22px">
          <div style="font-size:24px;font-weight:700;line-height:1.1">${escapeHtml(ev.name)}</div>
          <div style="font-size:13px;margin-top:8px">${escapeHtml(venueOf(ev))}</div>
        </div>
        <div style="padding:18px 22px;font-size:14px"><strong>${escapeHtml(prettyDate(ev))}</strong> · ${escapeHtml(ev.priceLabel)}</div>
      </div>
      <div style="text-align:center;margin:22px 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#f44929;color:#fff;text-decoration:none;font-weight:700;font-size:15px;padding:14px 28px;border-radius:999px">See the event</a></div>
      <p style="font-size:12px;color:#65675d">You are getting this because you asked Tikiti to tell you about events like this. <a href="${escapeHtml(unsubscribeUrl)}" style="color:#65675d">Unsubscribe</a></p>
    </div>
  </div>`;
  return { subject, html, text };
}

export function buildWhatsAppTemplate(to: string, template: string, ev: MatchEvent): Record<string, any> {
  return {
    to, type: 'template',
    template: {
      name: template,
      language: { code: process.env.WHATSAPP_TPL_EVENT_PROMO_LANG || 'en' },
      components: [{
        type: 'body',
        parameters: [ev.name, prettyDate(ev), venueOf(ev), eventLink(ev.id)].map((t) => ({ type: 'text', text: tplParam(t) })),
      }],
    },
  };
}

/** What the admin sees before sending. Contains no contact data. */
export function previewFor(ev: MatchEvent): Record<AudienceChannel, string> {
  const e = buildEmail(ev, `${SITE}/unsubscribe?t=…`);
  return {
    whatsapp: `Template "${process.env.WHATSAPP_TPL_EVENT_PROMO || '(not configured)'}" with:\n1. ${tplParam(ev.name)}\n2. ${tplParam(prettyDate(ev))}\n3. ${tplParam(venueOf(ev))}\n4. ${eventLink(ev.id)}`,
    sms: buildSms(ev),
    email: `Subject: ${e.subject}\n\n${e.text}`,
  };
}

/** null = ready; otherwise the reason this channel cannot send. */
export function channelStatus(): Record<AudienceChannel, string | null> {
  const env = process.env;
  return {
    whatsapp: !(env.WHATSAPP_TPL_EVENT_PROMO || '').trim() ? 'WhatsApp marketing template not approved/configured'
      : !env.WHATSAPP_ACCESS_TOKEN || !env.WHATSAPP_PHONE_NUMBER_ID ? 'WhatsApp Cloud API is not configured' : null,
    sms: env.ARKESEL_API_KEY ? null : 'SMS (Arkesel) is not configured',
    email: !env.RESEND_API_KEY ? 'Email (Resend) is not configured'
      : !(env.AUDIENCE_SECRET || env.CRON_SECRET) ? 'AUDIENCE_SECRET is not set, so unsubscribe links cannot be made' : null,
  };
}

/** Strips anything that looks like a phone number or email from an error before it is stored / shown. */
export function scrubError(e: unknown): string {
  return String((e as any)?.message || e || 'failed')
    .replace(/[^\s@"']+@[^\s@"']+\.[^\s@"']+/g, '[email]').replace(/\+?\d[\d\s-]{6,}\d/g, '[number]').slice(0, 160);
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function deliver(channel: AudienceChannel, ev: MatchEvent, to: { phone?: string; email?: string; contactId?: string }): Promise<void> {
  if (channel === 'whatsapp') {
    const r = await postMessage(process.env.WHATSAPP_PHONE_NUMBER_ID!, process.env.WHATSAPP_ACCESS_TOKEN!,
      buildWhatsAppTemplate(to.phone!, process.env.WHATSAPP_TPL_EVENT_PROMO!.trim(), ev));
    if (!r.ok) throw new Error(`WhatsApp ${r.status}: ${r.body?.error?.message || 'send failed'} (code ${r.body?.error?.code ?? '?'})`);
    return;
  }
  if (channel === 'sms') {
    const r = await sendSms(to.phone!, buildSms(ev));
    if (r !== 'sent') throw new Error(`SMS ${r}`);
    return;
  }
  const unsub = to.contactId ? `${SITE}/unsubscribe?t=${encodeURIComponent(unsubscribeToken(to.contactId))}` : `${SITE}/unsubscribe`;
  const m = buildEmail(ev, unsub);
  const r = await sendEmail({ to: to.email!, ...m, tag: 'event_promo', headers: to.contactId ? { 'List-Unsubscribe': `<${unsub}>` } : undefined });
  if (r !== 'sent') throw new Error(`Email ${r}`);
}

export async function sendEventPromo(db: Firestore, input: SendPromoInput): Promise<SendPromoResult> {
  const channel = input.channel;
  const envDry = process.env.WHATSAPP_DRY_RUN === '1' && process.env.NODE_ENV !== 'production';
  const dryRun = input.dryRun === true || envDry;
  const test = !!String(input.testTo || '').trim();
  const base: SendPromoResult = { status: 'sent', channel, dryRun, test, requested: 0, sent: 0, failed: 0, sampleErrors: [] };
  if (!AUDIENCE_CHANNELS.includes(channel)) return { ...base, status: 'invalid', blockedReason: 'Unknown channel' };

  const match = await matchAudienceForEvent(db, input.eventId, { mode: input.mode, cooldownDays: input.cooldownDays });
  const ev = match.event;
  const targets = match.recipients.filter((r) => r.channels[channel]).slice(0, parseLimit(input.limit));

  let testAddr: { phone?: string; email?: string } | null = null;
  if (test) {
    const phone = channel === 'email' ? null : normaliseGhPhone(input.testTo);
    const email = channel === 'email' ? normaliseEmail(input.testTo) : null;
    if (!phone && !email) return { ...base, status: 'invalid', blockedReason: channel === 'email' ? 'Enter a valid email for an email test' : 'Enter a valid Ghana phone number for this channel' };
    testAddr = phone ? { phone } : { email: email! };
  }
  base.requested = test ? 1 : targets.length;

  const log = async (r: SendPromoResult): Promise<SendPromoResult> => {
    try {
      const ref = await db.collection(AUDIENCE_SENDS_COLLECTION).add({
        eventId: ev.id, eventName: ev.name, channel, mode: match.mode, requested: r.requested, sent: r.sent, failed: r.failed,
        ...(r.blockedReason ? { blockedReason: r.blockedReason } : {}),
        dryRun: r.dryRun, test, by: input.adminEmail, createdAt: new Date(), sampleErrors: r.sampleErrors.slice(0, 5),
      });
      r.sendId = ref.id;
    } catch (e) { console.error('[audience/send] could not log send', e); }
    return r;
  };

  const blocked = channelStatus()[channel];
  if (blocked) return log({ ...base, status: 'blocked', blockedReason: blocked });

  if (!test && !dryRun && input.confirmCount !== targets.length) {
    return { ...base, status: 'count_mismatch', current: targets.length };
  }

  const fail = (e: unknown) => { base.failed++; if (base.sampleErrors.length < 5) base.sampleErrors.push(scrubError(e)); };

  if (test) {
    try { if (!dryRun) await deliver(channel, ev, testAddr!); base.sent = 1; } catch (e) { fail(e); }
    return log(base);
  }

  for (const t of targets) {
    try {
      const ref = db.collection(AUDIENCE_COLLECTION).doc(t.id);
      // Re-read right before sending so a STOP / unsubscribe that landed after matching still wins.
      const c = (await ref.get()).data();
      if (!c || c.channels?.[channel]?.optedIn !== true) throw new Error('opted out before send');
      const phone = c.phone ? String(c.phone) : undefined;
      const email = c.email ? String(c.email) : undefined;
      if (channel === 'email' ? !email : !phone) throw new Error('missing identifier');
      if (!dryRun) {
        await deliver(channel, ev, { phone, email, contactId: t.id });
        await ref.update({ lastContactedAt: new Date() });
        await sleep(SEND_DELAY_MS);
      }
      base.sent++;
    } catch (e) { fail(e); }
  }
  return log(base);
}
