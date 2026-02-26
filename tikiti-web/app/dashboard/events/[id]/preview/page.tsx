'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { eventService } from '@/lib/services/eventService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, MapPin, Clock, Users, DollarSign, Tag, Share2, ExternalLink } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { eventCategories } from '@/lib/data/categories';
import { useToast } from '@/hooks/use-toast';

export default function EventPreviewPage() {
  const params = useParams();
  const eventId = params.id as string;
  const { toast } = useToast();
  const [event, setEvent] = useState<any>(null);
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
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading event preview...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-lg font-semibold">Event not found</p>
          <Link href="/dashboard/events">
            <Button variant="outline" className="mt-4">
              Back to Events
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  const category = eventCategories.find((c) => c.id === event.category);
  const eventDate = new Date(`${event.date}T${event.time}`);
  const isPast = eventDate < new Date();

  const handleShare = async () => {
    const url = `${window.location.origin}/event/${eventId}`;
    if (navigator.share) {
      try {
        await navigator.share({
          title: event.name,
          text: event.description,
          url: url,
        });
      } catch (err) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      await navigator.clipboard.writeText(url);
      toast({ title: 'Link copied to clipboard', variant: 'success' });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold">Event Preview</h1>
              <p className="text-sm text-gray-600 mt-1">
                This is how your event will appear to attendees
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={handleShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share
              </Button>
              <Link href={`/dashboard/events/${eventId}`}>
                <Button variant="outline">
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Back to Edit
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Event Content */}
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Event Image */}
        {event.imageUrl && (
          <div className="mb-6 rounded-lg overflow-hidden shadow-lg">
            <img
              src={event.imageUrl}
              alt={event.name}
              className="w-full h-96 object-cover"
            />
          </div>
        )}

        {/* Event Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-3">
            {category && (
              <Badge variant="secondary" className="text-sm">
                {category.name}
              </Badge>
            )}
            <Badge
              variant={event.type === 'paid' ? 'default' : 'outline'}
              className="text-sm"
            >
              {event.type === 'paid' ? `₵${event.price}` : 'Free'}
            </Badge>
            {event.status === 'published' && !isPast && (
              <Badge variant="default" className="bg-green-500">
                Active
              </Badge>
            )}
          </div>
          <h1 className="text-4xl font-bold mb-3">{event.name}</h1>
          <p className="text-xl text-gray-600">{event.description}</p>
        </div>

        {/* Event Details */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Date & Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {eventDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
              <p className="text-gray-600 mt-1">
                <Clock className="inline h-4 w-4 mr-1" />
                {event.time}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Location
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">{event.location}</p>
              {event.address && (
                <p className="text-gray-600 mt-1 text-sm">{event.address}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Tickets
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-lg font-semibold">
                {event.soldTickets || 0} / {event.totalTickets} sold
              </p>
              <p className="text-gray-600 mt-1">
                {event.availableTickets || event.totalTickets} tickets available
              </p>
              <div className="mt-3 w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full"
                  style={{
                    width: `${((event.soldTickets || 0) / event.totalTickets) * 100}%`,
                  }}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Pricing
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {event.type === 'paid' ? `₵${event.price}` : 'Free'}
              </p>
              {event.type === 'paid' && (
                <p className="text-sm text-gray-600 mt-1">
                  Per ticket
                </p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Organizer Info */}
        {(event.organizerName || event.organizerEmail || event.organizerPhone) && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Organizer</CardTitle>
            </CardHeader>
            <CardContent>
              {event.organizerName && (
                <p className="font-semibold mb-2">{event.organizerName}</p>
              )}
              <div className="space-y-1 text-sm text-gray-600">
                {event.organizerEmail && (
                  <p>
                    <strong>Email:</strong> {event.organizerEmail}
                  </p>
                )}
                {event.organizerPhone && (
                  <p>
                    <strong>Phone:</strong> {event.organizerPhone}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Program Preview */}
        {event.program && event.program.sessions && event.program.sessions.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Event Program</CardTitle>
              <CardDescription>
                {event.program.sessions.length} session
                {event.program.sessions.length !== 1 ? 's' : ''} scheduled
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {event.program.sessions
                  .sort((a: any, b: any) => {
                    if (a.date && b.date && a.date !== b.date) {
                      return a.date.localeCompare(b.date);
                    }
                    return a.startTime.localeCompare(b.startTime);
                  })
                  .slice(0, 5)
                  .map((session: any, index: number) => (
                    <div key={session.id} className="flex items-start gap-4 pb-4 border-b last:border-0">
                      <div className="text-sm font-medium text-gray-500 min-w-[60px]">
                        {session.startTime}
                      </div>
                      <div className="flex-1">
                        <p className="font-semibold">{session.title}</p>
                        {session.speaker && (
                          <p className="text-sm text-gray-600 mt-1">
                            Speaker: {session.speaker.name}
                          </p>
                        )}
                        {session.location && (
                          <p className="text-sm text-gray-600">
                            Location: {session.location.name}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                {event.program.sessions.length > 5 && (
                  <p className="text-sm text-gray-500 text-center">
                    +{event.program.sessions.length - 5} more sessions
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* CTA Button */}
        <div className="text-center py-8">
          {event.status === 'published' && !isPast && (
            <Button size="lg" className="text-lg px-8">
              Register Now
            </Button>
          )}
          {event.status === 'draft' && (
            <Badge variant="outline" className="text-lg px-4 py-2">
              This event is still in draft mode
            </Badge>
          )}
          {isPast && (
            <Badge variant="secondary" className="text-lg px-4 py-2">
              This event has ended
            </Badge>
          )}
        </div>
      </div>
    </div>
  );
}
