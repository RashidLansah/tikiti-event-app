'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { attendeesService, Attendee } from '@/lib/services/attendeesService';
import { eventService } from '@/lib/services/eventService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Users, Download, Mail, Phone, Send, Loader2, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { ToastContainer } from '@/components/ui/toast';

export default function EventAttendeesPage() {
  const params = useParams();
  const { toast, toasts, dismiss } = useToast();
  const eventId = params.id as string;
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [event, setEvent] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [sendingTicket, setSendingTicket] = useState<string | null>(null);
  const [sentTickets, setSentTickets] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadData();
  }, [eventId]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [attendeesData, eventData] = await Promise.all([
        attendeesService.getByEvent(eventId),
        eventService.getById(eventId),
      ]);
      setAttendees(attendeesData);
      setEvent(eventData);
    } catch (error: any) {
      console.error('Error loading data:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load attendees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAttendees = () => {
    const headers = ['Name', 'Email', 'Phone', 'Type', 'Quantity', 'Price', 'Status', 'Registered'];
    const rows = attendees.map((attendee) => [
      attendee.userName || `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim(),
      attendee.userEmail || '',
      attendee.phoneNumber || '',
      attendee.registrationType === 'paid' ? 'Paid' : 'RSVP',
      attendee.quantity.toString(),
      attendee.totalPrice ? `₵${attendee.totalPrice}` : 'Free',
      attendee.status,
      attendee.createdAt
        ? typeof attendee.createdAt === 'object' && 'toDate' in attendee.createdAt
          ? attendee.createdAt.toDate().toLocaleDateString()
          : new Date(attendee.createdAt).toLocaleDateString()
        : 'N/A',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${event?.name || 'event'}-attendees-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: 'Attendees exported successfully',
    });
  };

  const confirmedCount = attendees.filter((a) => a.status === 'confirmed').length;

  const sendTicketEmail = async (attendee: Attendee) => {
    if (!event) return;

    setSendingTicket(attendee.id);
    try {
      const eventDate = event.dateTime
        ? new Date(event.dateTime.seconds ? event.dateTime.seconds * 1000 : event.dateTime).toLocaleDateString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })
        : 'TBD';

      const eventTime = event.dateTime
        ? new Date(event.dateTime.seconds ? event.dateTime.seconds * 1000 : event.dateTime).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : 'TBD';

      const response = await fetch('/api/tickets/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: attendee.userEmail,
          attendeeName: attendee.userName || `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() || 'Guest',
          eventName: event.name,
          eventDate,
          eventTime,
          eventLocation: event.venue || event.location || 'TBD',
          ticketType: attendee.registrationType === 'paid' ? 'Paid Ticket' : 'RSVP',
          quantity: attendee.quantity || 1,
          bookingId: attendee.id,
          eventId: eventId,
        }),
      });

      const result = await response.json();

      if (result.success) {
        setSentTickets((prev) => new Set([...prev, attendee.id]));
        toast({
          title: 'Ticket Sent!',
          description: `Ticket email sent to ${attendee.userEmail}`,
          variant: 'success',
        });
      } else {
        throw new Error(result.error || 'Failed to send ticket');
      }
    } catch (error: any) {
      console.error('Error sending ticket:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send ticket email',
        variant: 'destructive',
      });
    } finally {
      setSendingTicket(null);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {event?.name || 'Event'} Attendees
            </h1>
            <p className="text-gray-600 mt-1">
              {attendees.length} total registration{attendees.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>
        <Button onClick={exportAttendees} variant="outline">
          <Download className="mr-2 h-4 w-4" />
          Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Registrations</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{attendees.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Confirmed</CardTitle>
            <Badge variant="default" className="bg-green-500">Active</Badge>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{confirmedCount}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tickets Sold</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {attendees.reduce((sum, a) => sum + (a.quantity || 1), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendees List */}
      <Card>
        <CardHeader>
          <CardTitle>Attendees List</CardTitle>
          <CardDescription>
            {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'} registered
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <p className="mt-4 text-gray-600">Loading attendees...</p>
              </div>
            </div>
          ) : attendees.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-4 text-lg font-semibold">No attendees yet</h3>
              <p className="mt-2 text-sm text-gray-500">
                Share your event to start receiving registrations
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {attendees.map((attendee) => (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      {(attendee.userName || attendee.firstName || attendee.userEmail || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="font-medium">
                        {attendee.userName ||
                          `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() ||
                          attendee.userEmail ||
                          'Unknown'}
                      </p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Mail className="h-3 w-3" />
                          {attendee.userEmail}
                        </div>
                        {attendee.phoneNumber && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <Phone className="h-3 w-3" />
                            {attendee.phoneNumber}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="flex items-center gap-2">
                        <Badge variant={attendee.registrationType === 'paid' ? 'default' : 'outline'}>
                          {attendee.registrationType === 'paid' ? 'Paid' : 'RSVP'}
                        </Badge>
                        <span className="text-sm text-gray-600">
                          {attendee.quantity} ticket{attendee.quantity !== 1 ? 's' : ''}
                        </span>
                        {attendee.totalPrice !== undefined && attendee.totalPrice > 0 && (
                          <span className="text-sm font-medium">
                            ₵{attendee.totalPrice}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">
                        {attendee.createdAt
                          ? typeof attendee.createdAt === 'object' && 'toDate' in attendee.createdAt
                            ? attendee.createdAt.toDate().toLocaleDateString()
                            : new Date(attendee.createdAt).toLocaleDateString()
                          : 'N/A'}
                      </p>
                    </div>
                    <Badge
                      variant={
                        attendee.status === 'confirmed'
                          ? 'default'
                          : attendee.status === 'cancelled'
                          ? 'destructive'
                          : 'secondary'
                      }
                    >
                      {attendee.status}
                    </Badge>
                    {attendee.status === 'confirmed' && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => sendTicketEmail(attendee)}
                        disabled={sendingTicket === attendee.id}
                        className="ml-2"
                      >
                        {sendingTicket === attendee.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : sentTickets.has(attendee.id) ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-1 text-green-500" />
                            Sent
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4 mr-1" />
                            Resend Ticket
                          </>
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Toast Notifications */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} position="top-center" />
    </div>
  );
}
