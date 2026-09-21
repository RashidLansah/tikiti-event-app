// Generic Resend send, sharing the endpoint / sender config with lib/email/ticketEmail.ts. No-op ('skipped') when RESEND_API_KEY is unset.
const RESEND_URL = 'https://api.resend.com/emails';

export function escapeHtml(s: unknown): string {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string));
}

export async function sendEmail(input: {
  to: string; subject: string; html: string; text?: string; tag?: string; headers?: Record<string, string>;
}): Promise<'sent' | 'skipped' | 'failed'> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey || !input.to) return 'skipped';
  const res = await fetch(RESEND_URL, {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from: process.env.RESEND_FROM || 'Tikiti <onboarding@resend.dev>',
      to: [input.to], subject: input.subject, html: input.html, text: input.text, headers: input.headers,
      tags: input.tag ? [{ name: 'type', value: input.tag }] : undefined,
    }),
  });
  if (!res.ok) {
    console.error('[email] Resend error', res.status, (await res.text().catch(() => '')).slice(0, 300));
    return 'failed';
  }
  return 'sent';
}
