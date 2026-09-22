// The one SMS entry point. Arkesel first, retried up to MAX_ATTEMPTS with a short back-off; when every attempt fails,
// one delivery attempt through the backup provider (lib/sms/backup.ts). Result stays 'sent' | 'skipped' | 'failed'
// so existing callers are unchanged; `sendSmsDetailed` exposes what happened for logs and the Promote tool.
import { normaliseGhanaPhone, sendViaArkesel } from './arkesel';
import { backupProvider, sendViaBackup } from './backup';

export type SmsStatus = 'sent' | 'skipped' | 'failed';
export interface SmsResult { status: SmsStatus; provider: 'arkesel' | 'backup' | null; attempts: number; usedBackup: boolean }

export const MAX_ATTEMPTS = 3;
const BACKOFF_MS = [500, 1500];

type Attempt = (phone: string, message: string) => Promise<SmsStatus>;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Pure core, injectable for tests. */
export async function deliverWithRetry(
  phone: string, message: string,
  primary: Attempt, backup: Attempt | null,
  opts: { maxAttempts?: number; backoffMs?: number[]; wait?: (ms: number) => Promise<unknown> } = {},
): Promise<SmsResult> {
  const max = opts.maxAttempts ?? MAX_ATTEMPTS;
  const backoff = opts.backoffMs ?? BACKOFF_MS;
  const wait = opts.wait ?? sleep;
  let attempts = 0;
  for (let i = 0; i < max; i++) {
    attempts++;
    const r = await primary(phone, message);
    if (r === 'sent') return { status: 'sent', provider: 'arkesel', attempts, usedBackup: false };
    if (r === 'skipped') return { status: 'skipped', provider: null, attempts, usedBackup: false }; // not configured — retrying won't help
    if (i < max - 1) await wait(backoff[Math.min(i, backoff.length - 1)]);
  }
  if (!backup) return { status: 'failed', provider: 'arkesel', attempts, usedBackup: false };
  console.warn(`[sms] Arkesel failed ${attempts}x — trying backup provider`);
  const b = await backup(phone, message);
  return { status: b === 'sent' ? 'sent' : 'failed', provider: 'backup', attempts: attempts + 1, usedBackup: true };
}

export async function sendSmsDetailed(to: string, message: string): Promise<SmsResult> {
  const phone = normaliseGhanaPhone(to);
  if (!phone || !message) return { status: 'skipped', provider: null, attempts: 0, usedBackup: false };
  const res = await deliverWithRetry(phone, message, sendViaArkesel, backupProvider() ? sendViaBackup : null);
  if (res.status === 'failed') console.error(`[sms] delivery failed after ${res.attempts} attempts (backup ${res.usedBackup ? 'tried' : 'not configured'})`);
  return res;
}

export async function sendSms(to: string, message: string): Promise<SmsStatus> {
  return (await sendSmsDetailed(to, message)).status;
}
