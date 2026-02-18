import { NextRequest, NextResponse } from 'next/server';
import { fetchEventFromFirebase } from '@/lib/firebase/rest-api';

/**
 * GET /api/og-image/[eventId]
 * Serves the event flyer image for Open Graph meta tags.
 * Social media crawlers (WhatsApp, Twitter, Facebook) fetch this URL
 * to display the event image in link previews.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  if (!eventId) {
    return NextResponse.json({ error: 'Event ID is required' }, { status: 400 });
  }

  try {
    const event = await fetchEventFromFirebase(eventId);

    if (!event || !event.imageBase64) {
      // Redirect to Tikiti favicon as fallback
      return NextResponse.redirect(new URL('/favicon.png', request.url), 302);
    }

    // Decode base64 image to buffer
    let imageBuffer: Buffer;
    let contentType = 'image/jpeg';

    if (event.imageBase64.startsWith('data:')) {
      // Extract content type from data URL (e.g. "data:image/png;base64,...")
      const [header, base64Data] = event.imageBase64.split(',');
      const mimeMatch = header.match(/data:([^;]+)/);
      if (mimeMatch) {
        contentType = mimeMatch[1];
      }
      imageBuffer = Buffer.from(base64Data, 'base64');
    } else {
      // Raw base64 string, assume JPEG
      imageBuffer = Buffer.from(event.imageBase64, 'base64');
    }

    return new NextResponse(new Uint8Array(imageBuffer), {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': imageBuffer.length.toString(),
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[og-image] Error serving event image:', error);
    return NextResponse.redirect(new URL('/favicon.png', request.url), 302);
  }
}
