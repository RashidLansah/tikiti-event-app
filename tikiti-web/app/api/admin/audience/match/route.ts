// GET /api/admin/audience/match?eventId=&mode=&cooldownDays= — counts of who matches an event (admin only). Never returns contacts.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { isAdminResponse, requireAdmin } from '@/lib/inbox/admin';
import { matchAudienceForEvent, parseCooldown, parseMode, publicMatch } from '@/lib/audience/match';
import { channelStatus, previewFor, DEFAULT_LIMIT, MAX_LIMIT } from '@/lib/audience/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  const p = req.nextUrl.searchParams;
  const eventId = (p.get('eventId') || '').trim();
  if (!eventId || eventId.includes('/')) return NextResponse.json({ error: 'eventId is required' }, { status: 400 });
  try {
    const r = await matchAudienceForEvent(getAdminFirestore(), eventId, { mode: parseMode(p.get('mode')), cooldownDays: parseCooldown(p.get('cooldownDays')) });
    return NextResponse.json({ ...publicMatch(r), channelStatus: channelStatus(), preview: previewFor(r.event), defaultLimit: DEFAULT_LIMIT, maxLimit: MAX_LIMIT });
  } catch (err: any) {
    console.error('[admin/audience/match]', err);
    return NextResponse.json({ error: err?.message || 'Failed to match audience' }, { status: err?.status || 500 });
  }
}
