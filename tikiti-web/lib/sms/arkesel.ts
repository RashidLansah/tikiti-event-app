const ARKESEL_URL = 'https://sms.arkesel.com/sms/api';

export function normaliseGhanaPhone(raw: string): string | null {
  const digits = String(raw || '').replace(/[\s\-()]/g, '').replace(/^\+/, '');
  if (/^233\d{9}$/.test(digits)) return digits;
  if (/^0\d{9}$/.test(digits)) return `233${digits.slice(1)}`;
  return null;
}

export async function sendSms(to: string, message: string): Promise<'sent' | 'skipped' | 'failed'> {
  const apiKey = process.env.ARKESEL_API_KEY;
  const from = process.env.ARKESEL_SENDER_ID || 'Tikiti';
  const phone = normaliseGhanaPhone(to);
  if (!apiKey || !phone || !message) return 'skipped';
  try {
    const params = new URLSearchParams({ action: 'send-sms', api_key: apiKey, to: phone, from, sms: message });
    const res = await fetch(`${ARKESEL_URL}?${params.toString()}`);
    if (!res.ok) {
      console.error('[arkesel] HTTP error', res.status, await res.text().catch(() => ''));
      return 'failed';
    }
    const data = await res.json().catch(() => null);
    if (data?.code !== 'ok') {
      console.error('[arkesel] send error', data);
      return 'failed';
    }
    return 'sent';
  } catch (err) {
    console.error('[arkesel] request failed', err);
    return 'failed';
  }
}
