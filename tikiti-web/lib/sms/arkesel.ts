// Arkesel SMS via the v2 JSON API. The legacy /sms/api endpoint rejects the "Tikiti" sender ID (code 106) even though v2 accepts it.
const ARKESEL_V2_SEND = 'https://sms.arkesel.com/api/v2/sms/send';

export function normaliseGhanaPhone(raw: string): string | null {
  const digits = String(raw || '').replace(/[\s\-()]/g, '').replace(/^\+/, '');
  if (/^233\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return `233${digits.slice(1)}`;
  return null;
}

export async function sendSms(to: string, message: string): Promise<'sent' | 'skipped' | 'failed'> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const sender = process.env.ARKESEL_SENDER_ID || 'Tikiti';
  const phone = normaliseGhanaPhone(to);
  if (!apiKey || !phone || !message) return 'skipped';
  try {
    const res = await fetch(ARKESEL_V2_SEND, {
      method: 'POST',
      headers: { 'api-key': apiKey, 'Content-Type': 'application/json' },
      body: JSON.stringify({ sender, message, recipients: [phone] }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || data?.status !== 'success') {
      console.error('[arkesel] send error', res.status, data);
      return 'failed';
    }
    return 'sent';
  } catch (err) {
    console.error('[arkesel] request failed', err);
    return 'failed';
  }
}
