// POST /api/events/[id]/track — anonymous engagement counters for event pages
// Body: { type: 'view' | 'register_click' | 'contact_click' }
// Increments stats.views / stats.registerClicks / stats.contactClicks on the event doc. No auth;
// lightly rate-limited in memory (1 hit per IP+event+type per 10 minutes).
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { getAdminFirestore } from '@/lib/firebase/admin';

const WINDOW_MS = 10 * 60 * 1000;
const recentHits = new Map<string, number>();

const FIELD_BY_TYPE: Record<string, string> = {
  view: 'stats.views',
  register_click: 'stats.registerClicks',
  contact_click: 'stats.contactClicks',
};

function getIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function isRateLimited(key: string, now: number): boolean {
  const last = recentHits.get(key);
  if (last && now - last < WINDOW_MS) return true;
  recentHits.set(key, now);
  // Opportunistic cleanup so the map doesn't grow unbounded
  if (recentHits.size > 5000) {
    for (const [k, t] of recentHits) {
      if (now - t >= WINDOW_MS) recentHits.delete(k);
    }
  }
  return false;
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await ctx.params;
    if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 });

    let type = '';
    try {
      const body = await req.json();
      type = typeof body?.type === 'string' ? body.type : '';
    } catch {
      // sendBeacon may post text/plain; try parsing the raw body as JSON
      type = '';
    }
    const field = FIELD_BY_TYPE[type];
    if (!field) return NextResponse.json({ error: 'Invalid type' }, { status: 400 });

    const key = `${getIp(req)}:${id}:${type}`;
    if (isRateLimited(key, Date.now())) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const db = getAdminFirestore();
    const update = { [field]: FieldValue.increment(1) };

    // Native/community events live in `events`; scraped listings in `scraped_events`.
    const eventRef = db.collection('events').doc(id);
    const eventSnap = await eventRef.get();
    if (eventSnap.exists) {
      await eventRef.update(update);
    } else {
      const scrapedRef = db.collection('scraped_events').doc(id);
      const scrapedSnap = await scrapedRef.get();
      if (!scrapedSnap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
      await scrapedRef.update(update);
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('track error:', err);
    return NextResponse.json({ error: 'Failed to track' }, { status: 500 });
  }
}
