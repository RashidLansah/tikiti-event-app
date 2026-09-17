// Server layout for /events/[id]. The page itself is a client component (which
// cannot export generateMetadata), so the Open Graph / Twitter tags that
// WhatsApp, Facebook, X, LinkedIn, iMessage and Slack crawl live here.
import type { Metadata } from 'next';
import { buildEventMetadata } from '@/lib/event-metadata';

export const revalidate = 300;

type Props = { params: Promise<{ id: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  return buildEventMetadata(id, `/events/${encodeURIComponent(id)}`);
}

export default function EventLayout({ children }: { children: React.ReactNode }) {
  return children;
}
