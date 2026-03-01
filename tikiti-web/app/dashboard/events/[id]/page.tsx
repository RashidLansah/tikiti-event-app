'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { attendeesService } from '@/lib/services/attendeesService';
import { eventCategories } from '@/lib/data/categories';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Calendar, MapPin, Users, DollarSign, Tag, Edit, ArrowLeft, ExternalLink, FileText, List, MessageSquare, ClipboardList, Bell, Copy, Check, BarChart3, UserCheck, QrCode, XCircle, Video, Building2, Globe, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import EventCancellationModal from '@/components/modals/EventCancellationModal';
import { CohortManager } from '@/components/cohorts/CohortManager';

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const eventId = params.id as string;
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkCopied, setLinkCopied] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [checkInStats, setCheckInStats] = useState({
    total: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    checkInRate: 0,
  });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      loadCheckInStats();
    }
  }, [eventId]);

  const loadCheckInStats = async () => {
    try {
      const stats = await attendeesService.getCheckInStats(eventId);
      setCheckInStats(stats);
    } catch (error) {
      console.error('Error loading check-in stats:', error);
    }
  };

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

  const handlePublish = async () => {
    if (!event) return;
    try {
      await eventService.publish(event.id!);
      loadEvent();
    } catch (error) {
      console.error('Error publishing event:', error);
      toast({ title: 'Error', description: 'Failed to publish event', variant: 'destructive' });
    }
  };

  const handleCancelEvent = async (refundInfo: string, sendNotifications: boolean) => {
    if (!event) return;
    setCancelling(true);

    try {
      // Update event status to cancelled
      await eventService.update(event.id!, { status: 'cancelled' });

      // Send cancellation notifications if requested
      if (sendNotifications && checkInStats.total > 0) {
        try {
          const eventDate = event.date
            ? new Date(event.date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })
            : 'Date TBD';

          const response = await fetch('/api/notifications/event-cancellation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId: event.id,
              eventName: event.name,
              organizationName: currentOrganization?.name || 'Event Organizer',
              eventDate,
              eventLocation: event.location || 'Location TBD',
              refundInfo: refundInfo || undefined,
              contactEmail: currentOrganization?.email || undefined,
            }),
          });

          const result = await response.json();
          if (result.emailsSent > 0) {
            toast({
              title: 'Notifications Sent',
              description: `Cancellation notices sent to ${result.emailsSent} attendee${result.emailsSent !== 1 ? 's' : ''}`,
            });
          }
        } catch (notifyError) {
          console.error('Error sending cancellation notifications:', notifyError);
          toast({
            title: 'Warning',
            description: 'Event cancelled but failed to send some notifications',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Event Cancelled',
        description: 'The event has been cancelled successfully',
      });

      setShowCancelModal(false);
      loadEvent();
    } catch (error: any) {
      console.error('Error cancelling event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to cancel event',
        variant: 'destructive',
      });
    } finally {
      setCancelling(false);
    }
  };

  const copyEventLink = async () => {
    if (!event) return;
    
    // Determine the base URL for the web event page
    // In development, use localhost if web server is running
    // In production, use the deployed URL
    let baseUrl = '';
    
    if (typeof window !== 'undefined') {
      // Check if we're in development mode
      const isDevelopment = window.location.hostname === 'localhost' || 
                           window.location.hostname === '127.0.0.1' ||
                           process.env.NODE_ENV === 'development';
      
      if (isDevelopment) {
        // Use localhost for local testing (web folder should be running on port 3001)
        baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'http://localhost:3001';
      } else {
        // Production: use environment variable or default
        baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 'https://gettikiti.com';
      }
    } else {
      // Server-side: use environment variable or default
      baseUrl = process.env.NEXT_PUBLIC_WEB_URL || 
                (process.env.NODE_ENV === 'development' ? 'http://localhost:3001' : 'https://gettikiti.com');
    }
    
    const cleanBaseUrl = baseUrl.replace(/\/$/, '');
    const eventUrl = `${cleanBaseUrl}/event/${event.id}`;
    
    // Log for debugging
    console.log('📋 Copying event link:', eventUrl);
    console.log('🌐 Environment:', process.env.NODE_ENV);
    console.log('🔗 Base URL:', baseUrl);
    
    try {
      // Try to use the Clipboard API
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(eventUrl);
        setLinkCopied(true);
        toast({
          title: 'Link Copied!',
          description: `Copied: ${eventUrl}`,
        });
        setTimeout(() => setLinkCopied(false), 3000);
      } else {
        // Fallback for older browsers
        const textArea = document.createElement('textarea');
        textArea.value = eventUrl;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
        setLinkCopied(true);
        toast({
          title: 'Link Copied!',
          description: `Copied: ${eventUrl}`,
        });
        setTimeout(() => setLinkCopied(false), 3000);
      }
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        title: 'Error',
        description: 'Failed to copy link. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const getStatusBadge = (status: Event['status']) => {
    const variants: Record<Event['status'], { variant: 'default' | 'secondary' | 'destructive' | 'outline'; label: string }> = {
      draft: { variant: 'outline', label: 'Draft' },
      published: { variant: 'default', label: 'Published' },
      archived: { variant: 'secondary', label: 'Archived' },
      cancelled: { variant: 'destructive', label: 'Cancelled' },
    };

    const config = variants[status] || variants.draft;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
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

  const category = eventCategories.find((c) => c.id === event.category);

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link href="/dashboard/events">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-3xl font-bold">{event.name}</h1>
              {getStatusBadge(event.status)}
            </div>
            <p className="text-gray-600 mt-1">Event Details</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {event.status === 'draft' && (
            <Button onClick={handlePublish}>Publish Event</Button>
          )}
          <Link href={`/dashboard/events/${event.id}/edit`}>
            <Button variant="outline">
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
          </Link>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700 whitespace-pre-wrap">{event.description}</p>
            </CardContent>
          </Card>

          {/* Event Image */}
          {event.imageUrl && (
            <Card>
              <CardContent className="p-0">
                <img
                  src={event.imageUrl}
                  alt={event.name}
                  className="w-full h-64 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
          )}

          {/* Details */}
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-start space-x-3">
                <Calendar className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Date & Time</p>
                  <p className="text-sm text-gray-600">
                    {event.endDate && event.endDate !== event.date ? (
                      <>
                        {event.date && new Date(event.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}
                        {' - '}
                        {new Date(event.endDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                      </>
                    ) : (
                      event.date && new Date(event.date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })
                    )}
                    {event.time && ` at ${event.time}`}
                  </p>
                </div>
              </div>
              {/* Venue Type Badge */}
              <div className="flex items-start space-x-3">
                {event.venueType === 'virtual' ? (
                  <Video className="h-5 w-5 text-blue-500 mt-0.5" />
                ) : event.venueType === 'hybrid' ? (
                  <Globe className="h-5 w-5 text-purple-500 mt-0.5" />
                ) : (
                  <Building2 className="h-5 w-5 text-gray-400 mt-0.5" />
                )}
                <div>
                  <p className="font-medium flex items-center gap-2">
                    Venue Type
                    {event.venueType && event.venueType !== 'in_person' && (
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        event.venueType === 'virtual'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {event.venueType === 'virtual' ? 'Virtual' : 'Hybrid'}
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-gray-600">
                    {event.venueType === 'virtual' ? 'Online Event' :
                     event.venueType === 'hybrid' ? 'In Person + Online' :
                     'In Person Event'}
                  </p>
                </div>
              </div>

              {/* Physical Location - show for in_person and hybrid */}
              {(event.venueType !== 'virtual' || event.location) && (
                <div className="flex items-start space-x-3">
                  <MapPin className="h-5 w-5 text-gray-400 mt-0.5" />
                  <div>
                    <p className="font-medium">Location</p>
                    <p className="text-sm text-gray-600">
                      {event.location || (event.venueType === 'virtual' ? 'Virtual Event' : 'Location TBD')}
                    </p>
                    {event.address && (
                      <p className="text-sm text-gray-500">{event.address}</p>
                    )}
                  </div>
                </div>
              )}

              {/* Meeting Link - show for virtual and hybrid */}
              {(event.venueType === 'virtual' || event.venueType === 'hybrid') && (
                <div className="flex items-start space-x-3">
                  <LinkIcon className="h-5 w-5 text-blue-500 mt-0.5" />
                  <div>
                    <p className="font-medium flex items-center gap-2">
                      Meeting Link
                      {event.meetingPlatform && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">
                          {event.meetingPlatform === 'google_meet' ? 'Google Meet' :
                           event.meetingPlatform === 'teams' ? 'MS Teams' :
                           event.meetingPlatform === 'zoom' ? 'Zoom' :
                           event.meetingPlatform}
                        </span>
                      )}
                    </p>
                    {event.meetingLink ? (
                      <a
                        href={event.meetingLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:text-blue-800 hover:underline break-all"
                      >
                        {event.meetingLink}
                      </a>
                    ) : (
                      <p className="text-sm text-amber-600 flex items-center gap-1">
                        <span className="inline-block w-2 h-2 rounded-full bg-amber-500"></span>
                        Not added yet - add via Edit Event
                      </p>
                    )}
                  </div>
                </div>
              )}
              <div className="flex items-start space-x-3">
                <Tag className="h-5 w-5 text-gray-400 mt-0.5" />
                <div>
                  <p className="font-medium">Category</p>
                  <p className="text-sm text-gray-600">{category?.name || event.category}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle>Event Stats</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Tickets Sold</span>
                  <span className="font-semibold">
                    {event.soldTickets || 0} / {event.totalTickets}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{
                      width: `${((event.soldTickets || 0) / event.totalTickets) * 100}%`,
                    }}
                  />
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-2 border-t">
                <Users className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Available</p>
                  <p className="text-sm text-gray-600">{event.availableTickets || 0} tickets</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 pt-2 border-t">
                <DollarSign className="h-5 w-5 text-gray-400" />
                <div>
                  <p className="font-medium">Price</p>
                  <p className="text-sm text-gray-600">
                    {event.type === 'free' ? 'Free' : `$${event.price?.toFixed(2)}`}
                  </p>
                </div>
              </div>
              {/* Check-in Stats */}
              {checkInStats.total > 0 && (
                <div className="pt-2 border-t">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-600 flex items-center">
                      <UserCheck className="h-4 w-4 mr-1 text-green-500" />
                      Check-in Rate
                    </span>
                    <span className="font-semibold text-green-600">
                      {checkInStats.checkInRate}%
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                    <div
                      className="bg-green-500 h-2 rounded-full"
                      style={{
                        width: `${checkInStats.checkInRate}%`,
                      }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>{checkInStats.checkedIn} checked in</span>
                    <span>{checkInStats.notCheckedIn} pending</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Quick Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/attendees`}>
                  <Users className="mr-2 h-4 w-4" />
                  View Attendees
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-green-50 border-green-200 hover:bg-green-100" asChild>
                <Link href={`/dashboard/events/${event.id}/check-in`}>
                  <UserCheck className="mr-2 h-4 w-4 text-green-600" />
                  Event Check-In
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start bg-[#333] text-white hover:bg-[#444]" asChild>
                <Link href={`/scan/${event.id}`}>
                  <QrCode className="mr-2 h-4 w-4" />
                  QR Scanner
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/messaging`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Message Attendees
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/updates`}>
                  <Bell className="mr-2 h-4 w-4" />
                  Post Update
                </Link>
              </Button>
              <Button 
                variant="outline" 
                className="w-full justify-start"
                onClick={copyEventLink}
              >
                {linkCopied ? (
                  <>
                    <Check className="mr-2 h-4 w-4" />
                    Link Copied!
                  </>
                ) : (
                  <>
                    <Copy className="mr-2 h-4 w-4" />
                    Copy Event Link
                  </>
                )}
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/edit`}>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Event
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/form`}>
                  <FileText className="mr-2 h-4 w-4" />
                  Registration Form
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/program`}>
                  <List className="mr-2 h-4 w-4" />
                  Event Program
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/speakers`}>
                  <Users className="mr-2 h-4 w-4" />
                  Speakers & Panelists
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/engagement`}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Quizzes & Polls
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/surveys`}>
                  <ClipboardList className="mr-2 h-4 w-4" />
                  Surveys & Feedback
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/reports`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports & Analytics
                </Link>
              </Button>
              <Button variant="outline" className="w-full justify-start" asChild>
                <Link href={`/dashboard/events/${event.id}/preview`}>
                  <ExternalLink className="mr-2 h-4 w-4" />
                  Preview Event
                </Link>
              </Button>
              {event.status === 'published' && (
                <Button variant="outline" className="w-full justify-start" asChild>
                  <a
                    href={`${process.env.NEXT_PUBLIC_APP_URL || ''}/event/${event.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <ExternalLink className="mr-2 h-4 w-4" />
                    View Public Page
                  </a>
                </Button>
              )}

              {/* Cancel Event - Only show for non-cancelled events */}
              {event.status !== 'cancelled' && (
                <div className="pt-4 mt-4 border-t border-gray-200">
                  <Button
                    variant="outline"
                    className="w-full justify-start text-red-600 border-red-200 hover:bg-red-50 hover:border-red-300"
                    onClick={() => setShowCancelModal(true)}
                  >
                    <XCircle className="mr-2 h-4 w-4" />
                    Cancel Event
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cohorts Section */}
      {event && (event.hasCohorts || (event.cohorts && Object.keys(event.cohorts).length > 0)) && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <CohortManager
              cohorts={event.cohorts || {}}
              eventId={eventId}
              onSave={async (cohorts) => {
                const totalCapacity = Object.values(cohorts).reduce((sum, c) => sum + c.capacity, 0);
                const totalSold = Object.values(cohorts).reduce((sum, c) => sum + c.soldTickets, 0);
                await eventService.update(eventId, {
                  cohorts,
                  hasCohorts: Object.keys(cohorts).length > 0,
                  totalTickets: totalCapacity,
                  soldTickets: totalSold,
                  availableTickets: totalCapacity - totalSold,
                });
                const refreshed = await eventService.getById(eventId);
                if (refreshed) setEvent(refreshed);
              }}
            />
          </CardContent>
        </Card>
      )}

      {/* Cancel Event Modal */}
      {showCancelModal && event && (
        <EventCancellationModal
          eventName={event.name}
          attendeeCount={checkInStats.total}
          onConfirm={handleCancelEvent}
          onCancel={() => setShowCancelModal(false)}
          loading={cancelling}
        />
      )}
    </div>
  );
}
