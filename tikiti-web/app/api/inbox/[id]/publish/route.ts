// POST /api/inbox/[id]/publish — create a real Tikiti event from a reviewed inbox item (admin only)
// The actual work lives in lib/inbox/publish.ts so the WhatsApp admin commands can reuse it.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { inboxCollection, isAdminResponse, requireAdmin, serializeInbox } from '@/lib/inbox/admin';
import { InboxPublishError, publishInboxItem } from '@/lib/inbox/publish';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  try {
    const { id } = await params;
    const body = await req.json();
    const { organizationId, ...overrides } = (body && typeof body === 'object' ? body : {}) as Record<string, any>;

    const result = await publishInboxItem(getAdminFirestore(), id, {
      organizationId: typeof organizationId === 'string' ? organizationId : null,
      uid: admin.uid,
      overrides,
    });

    const updated = await inboxCollection().doc(id).get();
    return NextResponse.json({ eventId: result.eventId, ticketingDisabled: result.ticketingDisabled, item: serializeInbox(id, updated.data()!) });
  } catch (e: any) {
    if (e instanceof InboxPublishError) {
      if (e.code === 'validation') {
        const first = e.missingFields?.[0] || 'name';
        const msg = first.startsWith('date (') ? 'date must be YYYY-MM-DD' : `${first} is required`;
        return NextResponse.json({ error: msg, missingFields: e.missingFields }, { status: 400 });
      }
      return NextResponse.json({ error: e.message, ...(e.eventId ? { eventId: e.eventId } : {}) }, { status: e.status });
    }
    console.error('inbox publish error', e);
    return NextResponse.json({ error: e.message || 'Failed to publish' }, { status: 500 });
  }
}
