// GET /api/events/[id]/calendar — downloads the event as an .ics file ("Add to calendar")
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { buildIcs, slugify } from '@/lib/events/ics';

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
    const db = getAdminFirestore();
    let snap = await db.collection('events').doc(id).get();
    if (!snap.exists) snap = await db.collection('scraped_events').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 });

    const data = snap.data() || {};
    const ics = buildIcs({ ...data, id });
    if (!ics) return NextResponse.json({ error: 'Event has no calendar date' }, { status: 422 });

    return new NextResponse(ics, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slugify(String(data.name || ''), id)}.ics"`,
        'Cache-Control': 'public, max-age=300',
      },
    });
  } catch (err) {
    console.error('calendar route failed', err);
    return NextResponse.json({ error: 'Could not build calendar file' }, { status: 500 });
  }
}
