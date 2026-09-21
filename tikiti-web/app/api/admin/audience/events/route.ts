// GET /api/admin/audience/events — upcoming published events for the promote picker (admin only).
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { isAdminResponse, requireAdmin } from '@/lib/inbox/admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Mirrors lib/bot/catalogue.ts: whole-collection read with a field mask, filtered in memory.
const EXCLUDED_STATUSES = new Set(['draft', 'archived', 'cancelled', 'inactive']);

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  try {
    const events = await upcomingEvents(getAdminFirestore());
    return NextResponse.json({ events });
  } catch (err: any) {
    console.error('[admin/audience/events]', err);
    return NextResponse.json({ error: err?.message || 'Failed to load events' }, { status: 500 });
  }
}

async function upcomingEvents(db: FirebaseFirestore.Firestore) {
  const today = new Date().toISOString().slice(0, 10);
  const snap = await db.collection('events').select('name', 'date', 'endDate', 'location', 'category', 'status', 'isActive').get();
  return snap.docs
    .map((d): Record<string, any> => ({ ...d.data(), id: d.id }))
    .filter((e) => e.isActive !== false && !EXCLUDED_STATUSES.has(String(e.status || '')) && String(e.endDate || e.date || '') >= today)
    .sort((a, b) => String(a.date || '').localeCompare(String(b.date || '')))
    .slice(0, 100)
    .map((e) => ({ id: e.id, name: String(e.name || 'Event'), date: String(e.date || ''), location: String(e.location || ''), category: String(e.category || '') }));
}
