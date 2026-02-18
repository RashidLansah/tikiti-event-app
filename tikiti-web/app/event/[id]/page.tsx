import { Metadata } from 'next';
import { fetchEventFromFirebase, extractLocationText } from '@/lib/firebase/rest-api';
import EventRedirect from './EventRedirect';

// Revalidate every 5 minutes (ISR)
export const revalidate = 300;

const BASE_URL = 'https://gettikiti.com';

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Generate dynamic OG meta tags for social sharing.
 * This runs server-side so WhatsApp, Twitter, and Facebook crawlers
 * can see the event title, description, and image in link previews.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const event = await fetchEventFromFirebase(id);

  if (!event) {
    return {
      title: 'Event Not Found - Tikiti',
      description: 'This event could not be found on Tikiti.',
    };
  }

  const eventName = event.name || 'Amazing Event';
  const eventDescription = event.description || `Join us for ${eventName}`;
  const locationText = extractLocationText(event.location, event.address);
  const eventDate = event.date || '';

  // Build a rich description with date and location
  const richDescription = eventDate
    ? `${eventDescription} — ${eventDate} at ${locationText}`
    : eventDescription;

  // Use the OG image API route which serves the actual event flyer
  const ogImageUrl = event.imageBase64
    ? `${BASE_URL}/api/og-image/${id}`
    : `${BASE_URL}/favicon.png`;

  return {
    title: `${eventName} - Tikiti`,
    description: richDescription,
    openGraph: {
      title: eventName,
      description: richDescription,
      type: 'website',
      url: `${BASE_URL}/event/${id}`,
      siteName: 'Tikiti',
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
          alt: `${eventName} - Event Poster`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: eventName,
      description: richDescription,
      images: [ogImageUrl],
    },
  };
}

/**
 * Event page — server component that renders the client redirect.
 * The actual event content is displayed by event.html (static HTML + Firebase JS).
 * This page exists to provide server-rendered OG meta tags for social sharing.
 */
export default async function EventPage({ params }: Props) {
  const { id } = await params;
  return <EventRedirect eventId={id} />;
}
