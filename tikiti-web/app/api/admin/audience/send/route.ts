// POST /api/admin/audience/send — send (or test / dry-run) one event promo on one channel (admin only). Returns counts only.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { isAdminResponse, requireAdmin } from '@/lib/inbox/admin';
import { parseCooldown, parseMode } from '@/lib/audience/match';
import { parseLimit, sendEventPromo } from '@/lib/audience/send';
import { AUDIENCE_CHANNELS, type AudienceChannel } from '@/lib/audience/types';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  const body = await req.json().catch(() => null);
  const eventId = String(body?.eventId || '').trim();
  const channel = body?.channel as AudienceChannel;
  if (!eventId || eventId.includes('/')) return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
  if (!AUDIENCE_CHANNELS.includes(channel)) return NextResponse.json({ error: 'channel must be whatsapp, sms or email' }, { status: 400 });
  try {
    const r = await sendEventPromo(getAdminFirestore(), {
      eventId, channel, mode: parseMode(body?.mode), cooldownDays: parseCooldown(body?.cooldownDays), limit: parseLimit(body?.limit),
      testTo: typeof body?.testTo === 'string' ? body.testTo.trim().slice(0, 254) : undefined,
      dryRun: body?.dryRun === true, adminEmail: admin.email,
      confirmCount: Number.isInteger(body?.confirmCount) ? body.confirmCount : undefined,
    });
    if (r.status === 'count_mismatch') return NextResponse.json({ error: `The audience changed: ${r.current} people would be sent to now. Confirm that number.`, current: r.current }, { status: 409 });
    if (r.status === 'invalid') return NextResponse.json({ error: r.blockedReason || 'Invalid request' }, { status: 400 });
    return NextResponse.json(r);
  } catch (err: any) {
    console.error('[admin/audience/send]', err);
    return NextResponse.json({ error: err?.message || 'Send failed' }, { status: err?.status || 500 });
  }
}
