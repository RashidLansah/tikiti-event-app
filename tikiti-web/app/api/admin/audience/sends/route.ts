// GET /api/admin/audience/sends — the last 20 promo sends (admin only). Counts only.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { isAdminResponse, requireAdmin } from '@/lib/inbox/admin';
import { AUDIENCE_SENDS_COLLECTION } from '@/lib/audience/send';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  try {
    const snap = await getAdminFirestore().collection(AUDIENCE_SENDS_COLLECTION).orderBy('createdAt', 'desc').limit(20).get();
    const sends = snap.docs.map((d) => {
      const s = d.data();
      return {
        id: d.id, eventId: s.eventId, eventName: s.eventName, channel: s.channel, mode: s.mode, requested: s.requested || 0, sent: s.sent || 0,
        failed: s.failed || 0, blockedReason: s.blockedReason || null, dryRun: s.dryRun === true, test: s.test === true, by: s.by || '',
        createdAt: s.createdAt?.toDate ? s.createdAt.toDate().toISOString() : null, sampleErrors: Array.isArray(s.sampleErrors) ? s.sampleErrors.slice(0, 5) : [],
      };
    });
    return NextResponse.json({ sends });
  } catch (err: any) {
    console.error('[admin/audience/sends]', err);
    return NextResponse.json({ error: err?.message || 'Failed to load sends' }, { status: 500 });
  }
}
