'use client';

import { useEffect } from 'react';
import { trackEvent } from '@/lib/events/track';

/** Fires a single `view` beacon per page load for the given event. Renders nothing. */
export default function TrackView({ eventId }: { eventId: string }) {
  useEffect(() => {
    trackEvent(eventId, 'view');
  }, [eventId]);
  return null;
}
