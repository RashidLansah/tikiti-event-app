'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { AttendeeMessaging } from '@/components/events/AttendeeMessaging';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function EventMessagingPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const eventData = await eventService.getById(eventId);
      setEvent(eventData);
    } catch (error) {
      console.error('Error loading event:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-12">
        <h2 className="text-2xl font-bold mb-2">Event not found</h2>
        <p className="text-gray-600 mb-4">The event you're looking for doesn't exist.</p>
        <Link href="/dashboard/events">
          <Button>Back to Events</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Message Attendees</h1>
          <p className="text-gray-600 mt-1">{event.name}</p>
        </div>
      </div>

      {/* Messaging Component */}
      <AttendeeMessaging eventId={event.id!} eventName={event.name} />
    </div>
  );
}
