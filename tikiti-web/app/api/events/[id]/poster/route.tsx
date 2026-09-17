// GET /api/events/[id]/poster        → the raw event image (base64 decoded, or 302 to its URL)
// GET /api/events/[id]/poster?og=1   → 1200×630 PNG social card (poster + title/date/venue)
// Public, cached; used as the og:image for event share previews.
import { NextRequest, NextResponse } from 'next/server';
import { ImageResponse } from 'next/og';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { extractLocationText, type EventData } from '@/lib/firebase/rest-api';
import { formatEventDate } from '@/lib/event-metadata';

export const dynamic = 'force-dynamic';

const CACHE = 'public, max-age=3600, s-maxage=86400';

type Poster = { src: string; buffer?: Buffer; mime: string };

function decodeBase64(raw: string): Poster {
  let mime = 'image/jpeg';
  let data = raw;
  if (raw.startsWith('data:')) {
    const [header, body] = raw.split(',', 2);
    mime = header.match(/data:([^;]+)/)?.[1] || mime;
    data = body || '';
  }
  return { src: `data:${mime};base64,${data}`, buffer: Buffer.from(data, 'base64'), mime };
}

function getPoster(event: EventData): Poster | null {
  if (typeof event.imageBase64 === 'string' && event.imageBase64.length > 0) return decodeBase64(event.imageBase64);
  const url = (event.coverImage || event.imageUrl) as string | undefined;
  if (url && /^https?:\/\//.test(url)) return { src: url, mime: '' };
  return null;
}

function renderOg(event: EventData, poster: Poster | null) {
  const name = (event.name || 'Event').toUpperCase();
  const date = formatEventDate(event.date) + (event.time ? ` · ${event.time}` : '');
  const venue = extractLocationText(event.location, event.address);
  const category = String(event.category || 'Event').toUpperCase();

  return new ImageResponse(
    (
      <div style={{ width: 1200, height: 630, display: 'flex', background: '#faf9f2', color: '#202220', fontFamily: 'sans-serif', padding: 48 }}>
        {poster && (
          <div style={{ width: 540, height: 534, display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: 48 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={poster.src} alt="" style={{ maxWidth: 540, maxHeight: 534, objectFit: 'contain', borderRadius: 24 }} />
          </div>
        )}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minWidth: 0 }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ fontSize: 22, letterSpacing: 4, fontWeight: 600, color: '#f44929' }}>{category}</div>
            <div style={{ display: 'block', fontSize: poster ? 60 : 84, fontWeight: 800, lineHeight: 1.02, letterSpacing: -1, marginTop: 20, overflow: 'hidden', lineClamp: 3, textOverflow: 'ellipsis' }}>
              {name}
            </div>
            <div style={{ fontSize: 30, fontWeight: 500, marginTop: 32 }}>{date}</div>
            <div style={{ fontSize: 26, color: '#65675d', marginTop: 10 }}>{venue}</div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', fontSize: 34, fontWeight: 700, letterSpacing: -2 }}>
            tikiti<span style={{ color: '#f44929', fontSize: 24, marginLeft: 3 }}>✳</span>
          </div>
        </div>
      </div>
    ),
    { width: 1200, height: 630, headers: { 'Cache-Control': CACHE } },
  );
}

export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!id) return NextResponse.json({ error: 'Missing event id' }, { status: 400 });

  try {
    const snap = await getAdminFirestore().collection('events').doc(id).get();
    if (!snap.exists) return NextResponse.json({ error: 'Event not found' }, { status: 404 });
    const event = snap.data() as EventData;
    const poster = getPoster(event);

    if (req.nextUrl.searchParams.get('og') === '1') return renderOg(event, poster);

    if (!poster) return NextResponse.json({ error: 'No image for this event' }, { status: 404 });
    if (!poster.buffer) return NextResponse.redirect(poster.src, { status: 302, headers: { 'Cache-Control': CACHE } });

    return new NextResponse(new Uint8Array(poster.buffer), {
      status: 200,
      headers: {
        'Content-Type': poster.mime,
        'Content-Length': String(poster.buffer.length),
        'Cache-Control': CACHE,
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[poster] Failed to serve event poster:', error);
    return NextResponse.json({ error: 'Failed to load poster' }, { status: 500 });
  }
}
