'use client';

import { useParams } from 'next/navigation';
import { useEffect } from 'react';

export default function EventPage() {
  const params = useParams();
  const eventId = params.id as string;

  useEffect(() => {
    // Redirect to the static event.html page with eventId parameter
    if (eventId) {
      window.location.href = `/event.html?eventId=${eventId}`;
    }
  }, [eventId]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <p>Loading event...</p>
    </div>
  );
}
