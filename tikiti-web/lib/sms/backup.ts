// Backup SMS providers, used only after Arkesel has failed every retry. Pick one with SMS_BACKUP_PROVIDER.
//   mnotify: SMS_BACKUP_PROVIDER=mnotify  MNOTIFY_API_KEY=…            (sender: SMS_BACKUP_SENDER_ID, default Tikiti)
//   hubtel:  SMS_BACKUP_PROVIDER=hubtel   HUBTEL_CLIENT_ID=… HUBTEL_CLIENT_SECRET=…
//   africastalking: SMS_BACKUP_PROVIDER=africastalking AT_USERNAME=… AT_API_KEY=…  (AT_USERNAME=sandbox uses the sandbox host)
// Unset → no backup; the failure is reported as-is.
export type BackupProvider = 'mnotify' | 'hubtel' | 'africastalking';

export function backupProvider(): BackupProvider | null {
  const p = (process.env.SMS_BACKUP_PROVIDER || '').toLowerCase();
  if (p === 'mnotify' && process.env.MNOTIFY_API_KEY) return 'mnotify';
  if (p === 'hubtel' && process.env.HUBTEL_CLIENT_ID && process.env.HUBTEL_CLIENT_SECRET) return 'hubtel';
  if (p === 'africastalking' && process.env.AT_USERNAME && process.env.AT_API_KEY) return 'africastalking';
  return null;
}

/** Single attempt through the configured backup. `phone` must already be 233XXXXXXXXX. */
export async function sendViaBackup(phone: string, message: string): Promise<'sent' | 'skipped' | 'failed'> {
  const provider = backupProvider();
  if (!provider || !phone || !message) return 'skipped';
  const sender = process.env.SMS_BACKUP_SENDER_ID || process.env.ARKESEL_SENDER_ID || 'Tikiti';
  try {
    if (provider === 'mnotify') {
      const res = await fetch(`https://api.mnotify.com/api/sms/quick?key=${encodeURIComponent(process.env.MNOTIFY_API_KEY!)}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recipient: [phone], sender, message, is_schedule: 'false', schedule_date: '' }),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || data?.status !== 'success') { console.error('[sms:mnotify] send error', res.status, data); return 'failed'; }
      return 'sent';
    }
    if (provider === 'africastalking') {
      const username = process.env.AT_USERNAME!;
      const host = username === 'sandbox' ? 'https://api.sandbox.africastalking.com' : 'https://api.africastalking.com';
      const res = await fetch(`${host}/version1/messaging`, {
        method: 'POST', headers: { apiKey: process.env.AT_API_KEY!, Accept: 'application/json', 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ username, to: `+${phone}`, message, from: sender }).toString(),
      });
      const data = await res.json().catch(() => null);
      const rec = data?.SMSMessageData?.Recipients?.[0];
      // AT returns 201 even when the recipient is rejected; statusCode 101 = Sent, 100 = Processed.
      if (!res.ok || !rec || ![100, 101].includes(Number(rec.statusCode))) { console.error('[sms:africastalking] send error', res.status, data); return 'failed'; }
      return 'sent';
    }
    const auth = Buffer.from(`${process.env.HUBTEL_CLIENT_ID}:${process.env.HUBTEL_CLIENT_SECRET}`).toString('base64');
    const res = await fetch('https://smsc.hubtel.com/v1/messages/send', {
      method: 'POST', headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ From: sender, To: `+${phone}`, Content: message }),
    });
    if (!res.ok) { console.error('[sms:hubtel] send error', res.status, await res.text().catch(() => '')); return 'failed'; }
    return 'sent';
  } catch (err) {
    console.error(`[sms:${provider}] request failed`, err);
    return 'failed';
  }
}
