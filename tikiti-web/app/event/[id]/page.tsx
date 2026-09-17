import { Metadata } from 'next';
import { buildEventMetadata } from '@/lib/event-metadata';
import EventRedirect from './EventRedirect';

// Revalidate every 5 minutes (ISR)
export const revalidate = 300;

type Props = {
  params: Promise<{ id: string }>;
};

/**
 * Generate dynamic OG meta tags for social sharing.
 * Shares the same absolute-URL metadata (and /api/events/[id]/poster?og=1 card)
 * as /events/[id], so previews are identical whichever link is shared.
 */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildEventMetadata(id, `/event/${encodeURIComponent(id)}`);
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
