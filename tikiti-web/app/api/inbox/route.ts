// GET /api/inbox?status=pending — list community inbox items (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { inboxCollection, isAdminResponse, requireAdmin, serializeInbox, type InboxStatus } from '@/lib/inbox/admin';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  try {
    const status = req.nextUrl.searchParams.get('status') as InboxStatus | null;
    const limit = Math.min(200, Number(req.nextUrl.searchParams.get('limit')) || 100);
    let q: FirebaseFirestore.Query = inboxCollection();
    if (status) q = q.where('status', '==', status);
    q = q.orderBy('createdAt', 'desc').limit(limit);
    const snap = await q.get();
    return NextResponse.json({ items: snap.docs.map((d) => serializeInbox(d.id, d.data())) });
  } catch (e: any) {
    console.error('inbox list error', e);
    return NextResponse.json({ error: e.message || 'Failed to list inbox' }, { status: 500 });
  }
}
