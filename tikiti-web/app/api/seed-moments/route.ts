import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';

const DEMO_PHOTOS = [
  { thumbnailUrl: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=600&fit=crop&q=80', caption: 'Amazing keynote! 🔥', likes: 24, views: 112, rankScore: 120, featured: true },
  { thumbnailUrl: 'https://images.unsplash.com/photo-1511578314322-379afb476865?w=600&h=600&fit=crop&q=80', caption: 'Great crowd energy today', likes: 18, views: 87, rankScore: 95 },
  { thumbnailUrl: 'https://images.unsplash.com/photo-1475721027785-f74eccf877e2?w=600&h=600&fit=crop&q=80', caption: 'Workshop was 🔥', likes: 31, views: 145, rankScore: 150 },
  { thumbnailUrl: 'https://images.unsplash.com/photo-1505373877841-8d25f7d46678?w=600&h=600&fit=crop&q=80', caption: 'Panel discussion highlights', likes: 9, views: 54, rankScore: 60 },
  { thumbnailUrl: 'https://images.unsplash.com/photo-1498075702571-ecb018f3752d?w=600&h=600&fit=crop&q=80', caption: 'Networking lunch vibes 🍽️', likes: 42, views: 198, rankScore: 200, featured: true },
  { thumbnailUrl: 'https://images.unsplash.com/photo-1560523160-754a9e25c68f?w=600&h=600&fit=crop&q=80', caption: 'QR check-in demo was smooth!', likes: 7, views: 39, rankScore: 45 },
  { thumbnailUrl: 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=600&h=600&fit=crop&q=80', caption: 'Day 2 masterclass 💪', likes: 15, views: 71, rankScore: 80 },
  { thumbnailUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?w=600&h=600&fit=crop&q=80', caption: 'Amazing speakers, amazing content', likes: 28, views: 133, rankScore: 140, reported: true },
  { thumbnailUrl: 'https://images.unsplash.com/photo-1492538368677-f6e0afe31dcc?w=600&h=600&fit=crop&q=80', caption: 'Closing ceremony 🎉', likes: 55, views: 240, rankScore: 210, featured: true },
];

export async function POST(req: NextRequest) {
  try {
    const { eventId, eventName, organizerId, organizationId } = await req.json();
    if (!eventId) return NextResponse.json({ error: 'eventId required' }, { status: 400 });

    const db = getAdminFirestore();
    const col = db.collection('eventMedia');

    for (const photo of DEMO_PHOTOS) {
      await col.add({
        eventId,
        userId: `demo-user-${Math.random().toString(36).slice(2, 8)}`,
        bookingId: null,
        type: 'attendee_post',
        mediaType: 'photo',
        videoUrl: photo.thumbnailUrl,
        thumbnailUrl: photo.thumbnailUrl,
        storagePath: null,
        caption: photo.caption,
        eventPhase: 'post',
        verificationLevel: 'checked_in',
        eventName: eventName || '[DEMO] Tikiti Demo Day',
        eventDate: '2026-04-16',
        eventStatus: 'past',
        eventCategory: 'Conference',
        eventCity: 'Accra',
        organizerId: organizerId || '',
        organizationId: organizationId || '',
        linkedUpcomingEventId: null,
        views: photo.views,
        likes: photo.likes,
        downloads: 0,
        rankScore: photo.rankScore,
        featured: photo.featured || false,
        reported: photo.reported || false,
        hidden: false,
        reportCount: photo.reported ? 1 : 0,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
    }

    return NextResponse.json({ success: true, count: DEMO_PHOTOS.length });
  } catch (err: any) {
    console.error('seed-moments error', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
