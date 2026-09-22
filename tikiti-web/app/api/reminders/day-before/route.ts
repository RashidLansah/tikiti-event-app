// GET/POST /api/reminders/day-before — texts tomorrow's confirmed ticket holders once. Cron: .github/workflows/day-before-reminders.yml
// Protected by header `x-cron-key` or `Authorization: Bearer` == env CRON_SECRET.
// Query: ?dryRun=1 (count only) · ?date=YYYY-MM-DD (default: tomorrow in Accra) · ?bookingId=… (one booking, for tests)
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { sendDayBeforeReminders } from '@/lib/reminders/dayBefore';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secret || (req.headers.get('x-cron-key') !== secret && bearer !== secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  const q = req.nextUrl.searchParams;
  const date = q.get('date') || undefined;
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) return NextResponse.json({ error: 'date must be YYYY-MM-DD' }, { status: 400 });
  try {
    const result = await sendDayBeforeReminders(getAdminFirestore(), { date, dryRun: q.get('dryRun') === '1', bookingId: q.get('bookingId') || undefined });
    return NextResponse.json(result);
  } catch (error: any) {
    console.error('[reminders/day-before]', error);
    return NextResponse.json({ error: error.message || 'Reminder run failed' }, { status: 500 });
  }
}

export const GET = POST;
