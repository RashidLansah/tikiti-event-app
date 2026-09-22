// Proves the retry + fallback rules without sending anything. Run: npx tsx scripts/sms-retry-sim.ts
import { deliverWithRetry } from '../lib/sms/send';
const noWait = async () => {};
const seq = (...r: Array<'sent' | 'failed' | 'skipped'>) => { let i = 0; const calls: number[] = []; const fn = async () => { calls.push(++i); return r[Math.min(i - 1, r.length - 1)]; }; return Object.assign(fn, { calls }); };
(async () => {
  let ok = true;
  const check = (name: string, got: any, want: any) => { const pass = JSON.stringify(got) === JSON.stringify(want); ok &&= pass; console.log(pass ? 'PASS' : 'FAIL', name, pass ? '' : `got ${JSON.stringify(got)} want ${JSON.stringify(want)}`); };
  let p = seq('sent'); let b = seq('sent');
  check('first try succeeds → 1 attempt, no backup', await deliverWithRetry('233200000000', 'x', p, b, { wait: noWait }), { status: 'sent', provider: 'arkesel', attempts: 1, usedBackup: false });
  p = seq('failed', 'sent'); b = seq('sent');
  check('second try succeeds', await deliverWithRetry('233200000000', 'x', p, b, { wait: noWait }), { status: 'sent', provider: 'arkesel', attempts: 2, usedBackup: false });
  p = seq('failed'); b = seq('sent');
  check('3 failures → backup sends', await deliverWithRetry('233200000000', 'x', p, b, { wait: noWait }), { status: 'sent', provider: 'backup', attempts: 4, usedBackup: true });
  check('  primary was tried exactly 3 times', p.calls.length, 3); check('  backup tried once', b.calls.length, 1);
  p = seq('failed'); b = seq('failed');
  check('3 failures + backup fails → failed', await deliverWithRetry('233200000000', 'x', p, b, { wait: noWait }), { status: 'failed', provider: 'backup', attempts: 4, usedBackup: true });
  p = seq('failed');
  check('3 failures, no backup configured → failed', await deliverWithRetry('233200000000', 'x', p, null, { wait: noWait }), { status: 'failed', provider: 'arkesel', attempts: 3, usedBackup: false });
  p = seq('skipped'); b = seq('sent');
  check('not configured → skipped, no retry, no backup', await deliverWithRetry('233200000000', 'x', p, b, { wait: noWait }), { status: 'skipped', provider: null, attempts: 1, usedBackup: false });
  check('  backup not called on skipped', b.calls.length, 0);
  console.log(ok ? 'ALL PASS' : 'SOME FAILED'); process.exit(ok ? 0 : 1);
})();
