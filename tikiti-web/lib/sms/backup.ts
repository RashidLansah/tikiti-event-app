// Backup SMS providers, used only after Arkesel has failed every retry. Pick one with SMS_BACKUP_PROVIDER.
//   mnotify: SMS_BACKUP_PROVIDER=mnotify  MNOTIFY_API_KEY=…            (sender: SMS_BACKUP_SENDER_ID, default Tikiti)
//   hubtel:  SMS_BACKUP_PROVIDER=hubtel   HUBTEL_CLIENT_ID=… HUBTEL_CLIENT_SECRET=…
// Unset → no backup; the failure is reported as-is.
export type BackupProvider = 'mnotify' | 'hubtel';

export function backupProvider(): BackupProvider | null {
  const p = (process.env.SMS_BACKUP_PROVIDER || '').toLowerCase();
  if (p === 'mnotify' && process.env.MNOTIFY_API_KEY) return 'mnotify';
  if (p === 'hubtel' && process.env.HUBTEL_CLIENT_ID && process.env.HUBTEL_CLIENT_SECRET) return 'hubtel';
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
