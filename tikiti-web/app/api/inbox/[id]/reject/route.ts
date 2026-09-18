// POST /api/inbox/[id]/reject — mark an inbox item rejected (admin only)
// Body: { reason?: 'not_event'|'past'|'duplicate'|'missing_details'|'other', note?: string }
// The actual work (and the submitter notification) lives in lib/inbox/publish.ts so WhatsApp admin commands reuse it.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { inboxCollection, isAdminResponse, requireAdmin, serializeInbox } from '@/lib/inbox/admin';
import { isRejectReason } from '@/lib/inbox/notifySubmitter';
import { InboxPublishError, rejectInboxItem } from '@/lib/inbox/publish';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const reason = isRejectReason(body?.reason) ? body.reason : 'other';
    const note = typeof body?.note === 'string' ? body.note.trim().slice(0, 500) : null;

    await rejectInboxItem(getAdminFirestore(), id, reason, admin.uid, note);

    const updated = await inboxCollection().doc(id).get();
    return NextResponse.json({ item: serializeInbox(id, updated.data()!) });
  } catch (e: any) {
    if (e instanceof InboxPublishError) {
      return NextResponse.json({ error: e.message, ...(e.eventId ? { eventId: e.eventId } : {}) }, { status: e.status });
    }
    console.error('inbox reject error', e);
    return NextResponse.json({ error: e.message || 'Failed to reject' }, { status: 500 });
  }
}
