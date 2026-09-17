// POST /api/inbox/[id]/reject — mark an inbox item rejected (admin only)
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { inboxCollection, isAdminResponse, requireAdmin, serializeInbox } from '@/lib/inbox/admin';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  try {
    const { id } = await params;
    const ref = inboxCollection().doc(id);
    const snap = await ref.get();
    if (!snap.exists) return NextResponse.json({ error: 'Inbox item not found' }, { status: 404 });
    if (snap.data()!.status === 'published') {
      return NextResponse.json({ error: 'Already published; unpublish the event instead' }, { status: 400 });
    }
    const body = await req.json().catch(() => ({}));
    await ref.update({
      status: 'rejected',
      rejectedBy: admin.uid,
      rejectReason: body?.reason || null,
      updatedAt: FieldValue.serverTimestamp(),
    });
    const updated = await ref.get();
    return NextResponse.json({ item: serializeInbox(id, updated.data()!) });
  } catch (e: any) {
    console.error('inbox reject error', e);
    return NextResponse.json({ error: e.message || 'Failed to reject' }, { status: 500 });
  }
}
