'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { eventCategories } from '@/lib/data/categories';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Save, Video, Building2, Globe, Link as LinkIcon } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { AIDescriptionHelper } from '@/components/AIDescriptionHelper';
import EventUpdateConfirmationModal from '@/components/modals/EventUpdateConfirmationModal';

interface Change {
  field: string;
  oldValue: string;
  newValue: string;
}

export default function EditEventPage() {
  const params = useParams();
  const router = useRouter();
  const { toast, toasts } = useToast();
  const eventId = params.id as string;
  const { currentOrganization, user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [pendingChanges, setPendingChanges] = useState<Change[]>([]);
  const [originalEvent, setOriginalEvent] = useState<Event | null>(null);
  const originalDataRef = useRef<{
    date: string;
    time: string;
    location: string;
    address: string;
  } | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: '',
    time: '',
    venueType: 'in_person' as 'in_person' | 'virtual' | 'hybrid',
    location: '',
    address: '',
    meetingLink: '',
    meetingPlatform: '',
    category: '',
    type: 'free' as 'free' | 'paid',
    price: 0,
    totalTickets: 100,
  });

  useEffect(() => {
    loadEvent();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const event = await eventService.getById(eventId);
      if (event) {
        setOriginalEvent(event);
        const data = {
          name: event.name || '',
          description: event.description || '',
          date: event.date || '',
          time: event.time || '',
          venueType: event.venueType || 'in_person',
          location: event.location || '',
          address: event.address || '',
          meetingLink: event.meetingLink || '',
          meetingPlatform: event.meetingPlatform || '',
          category: event.category || '',
          type: event.type || 'free',
          price: event.price || 0,
          totalTickets: event.totalTickets || 100,
        };
        setFormData(data as any);
        // Store original values for important fields
        originalDataRef.current = {
          date: data.date,
          time: data.time,
          location: data.location,
          address: data.address,
        };
      }
    } catch (error) {
      console.error('Error loading event:', error);
      toast({
        title: 'Error',
        description: 'Failed to load event',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string): string => {
    if (!dateStr) return 'Not set';
    try {
      return new Date(dateStr).toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  const formatTime = (timeStr: string): string => {
    if (!timeStr) return 'Not set';
    try {
      const [hours, minutes] = timeStr.split(':');
      const date = new Date();
      date.setHours(parseInt(hours), parseInt(minutes));
      return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      });
    } catch {
      return timeStr;
    }
  };

  const detectImportantChanges = (): Change[] => {
    const changes: Change[] = [];
    const original = originalDataRef.current;

    if (!original) return changes;

    if (formData.date !== original.date) {
      changes.push({
        field: 'date',
        oldValue: formatDate(original.date),
        newValue: formatDate(formData.date),
      });
    }

    if (formData.time !== original.time) {
      changes.push({
        field: 'time',
        oldValue: formatTime(original.time),
        newValue: formatTime(formData.time),
      });
    }

    if (formData.location !== original.location) {
      changes.push({
        field: 'location',
        oldValue: original.location || 'Not set',
        newValue: formData.location,
      });
    }

    if (formData.address !== original.address) {
      changes.push({
        field: 'address',
        oldValue: original.address || 'Not set',
        newValue: formData.address || 'Not set',
      });
    }

    return changes;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check for important changes
    const importantChanges = detectImportantChanges();

    if (importantChanges.length > 0) {
      // Show confirmation modal
      setPendingChanges(importantChanges);
      setShowConfirmModal(true);
    } else {
      // No important changes, save directly
      await saveEvent(false);
    }
  };

  const saveEvent = async (sendNotifications: boolean) => {
    setSaving(true);

    try {
      await eventService.update(eventId, {
        name: formData.name,
        description: formData.description,
        date: formData.date,
        time: formData.time,
        venueType: formData.venueType,
        location: formData.location,
        address: formData.address || undefined,
        meetingLink: formData.meetingLink || undefined,
        meetingPlatform: formData.meetingPlatform || undefined,
        category: formData.category,
        type: formData.type,
        price: formData.type === 'paid' ? formData.price : undefined,
        totalTickets: formData.totalTickets,
      });

      // Send notifications if requested
      let notificationMessage = '';
      if (sendNotifications && pendingChanges.length > 0 && originalEvent) {
        try {
          const response = await fetch('/api/notifications/event-update', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId,
              eventName: formData.name,
              organizationName: currentOrganization?.name || 'Event Organizer',
              changes: pendingChanges,
              eventDate: formatDate(formData.date),
              eventTime: formatTime(formData.time),
              eventLocation: formData.location,
            }),
          });

          const result = await response.json();
          if (result.emailsSent > 0) {
            notificationMessage = ` • ${result.emailsSent} attendee${result.emailsSent !== 1 ? 's' : ''} notified`;
          } else if (result.totalAttendees === 0) {
            notificationMessage = ' • No attendees to notify';
          }
        } catch (notifyError) {
          console.error('Error sending notifications:', notifyError);
          toast({
            title: 'Warning',
            description: 'Event updated but failed to send notifications',
            variant: 'destructive',
          });
        }
      }

      toast({
        title: 'Event Updated',
        description: `Your changes have been saved${notificationMessage}`,
      });

      setShowConfirmModal(false);
      router.push(`/dashboard/events/${eventId}`);
    } catch (error: any) {
      console.error('Error updating event:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to update event',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmSave = async (sendNotifications: boolean) => {
    await saveEvent(sendNotifications);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading event...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Edit Event</h1>
          <p className="text-gray-600 mt-1">Update event details</p>
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Left Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Basic Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Event Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={5}
                    required
                  />
                  <AIDescriptionHelper
                    eventName={formData.name}
                    currentDescription={formData.description}
                    eventDetails={{
                      category: formData.category,
                      location: formData.location,
                      date: formData.date,
                      time: formData.time,
                      type: formData.type,
                      price: formData.price,
                    }}
                    onDescriptionGenerated={(description) => setFormData({ ...formData, description })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Select
                    value={formData.category}
                    onValueChange={(value) => setFormData({ ...formData, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {eventCategories.map((category) => (
                        <SelectItem key={category.id} value={category.id}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Date & Time</CardTitle>
                <CardDescription>
                  Changing these will notify attendees by email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={formData.date}
                      onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="time">Time *</Label>
                    <Input
                      id="time"
                      type="time"
                      value={formData.time}
                      onChange={(e) => setFormData({ ...formData, time: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Venue Type</CardTitle>
                <CardDescription>
                  How will attendees join your event?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, venueType: 'in_person' })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.venueType === 'in_person'
                        ? 'border-[#333] bg-[#333] text-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Building2 className={`h-6 w-6 mx-auto mb-2 ${formData.venueType === 'in_person' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="text-sm font-medium">In Person</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, venueType: 'virtual' })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.venueType === 'virtual'
                        ? 'border-[#333] bg-[#333] text-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Video className={`h-6 w-6 mx-auto mb-2 ${formData.venueType === 'virtual' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="text-sm font-medium">Virtual</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, venueType: 'hybrid' })}
                    className={`p-4 rounded-xl border-2 text-center transition-all ${
                      formData.venueType === 'hybrid'
                        ? 'border-[#333] bg-[#333] text-white'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <Globe className={`h-6 w-6 mx-auto mb-2 ${formData.venueType === 'hybrid' ? 'text-white' : 'text-gray-600'}`} />
                    <span className="text-sm font-medium">Hybrid</span>
                  </button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Location Details</CardTitle>
                <CardDescription>
                  Changing the venue will notify attendees by email
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Physical Location - shown for in_person and hybrid */}
                {(formData.venueType === 'in_person' || formData.venueType === 'hybrid') && (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="location">Location Name *</Label>
                      <Input
                        id="location"
                        value={formData.location}
                        onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="address">Full Address</Label>
                      <Textarea
                        id="address"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </>
                )}

                {/* Virtual Event Details - shown for virtual and hybrid */}
                {(formData.venueType === 'virtual' || formData.venueType === 'hybrid') && (
                  <>
                    {formData.venueType === 'hybrid' && (
                      <div className="border-t border-gray-200 pt-4 mt-4">
                        <p className="text-sm text-gray-500 mb-3">Virtual Meeting Details</p>
                      </div>
                    )}
                    <div className="space-y-2">
                      <Label htmlFor="meetingPlatform">Meeting Platform</Label>
                      <Select
                        value={formData.meetingPlatform}
                        onValueChange={(value) => setFormData({ ...formData, meetingPlatform: value })}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select platform" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="zoom">Zoom</SelectItem>
                          <SelectItem value="google_meet">Google Meet</SelectItem>
                          <SelectItem value="teams">Microsoft Teams</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="meetingLink">
                        Meeting Link
                        <span className="text-sm font-normal text-gray-500 ml-2">(can add later)</span>
                      </Label>
                      <div className="relative">
                        <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                          id="meetingLink"
                          value={formData.meetingLink}
                          onChange={(e) => setFormData({ ...formData, meetingLink: e.target.value })}
                          placeholder="https://zoom.us/j/..."
                          className="pl-10"
                        />
                      </div>
                      <p className="text-xs text-gray-500">
                        Registered attendees will see this link in their ticket.
                      </p>
                    </div>
                  </>
                )}

                {/* Display location for virtual events */}
                {formData.venueType === 'virtual' && (
                  <div className="space-y-2 pt-4 border-t border-gray-200">
                    <Label htmlFor="location">
                      Display Location
                      <span className="text-sm font-normal text-gray-500 ml-2">(optional)</span>
                    </Label>
                    <Input
                      id="location"
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="e.g., Online via Zoom"
                    />
                    <p className="text-xs text-gray-500">
                      Shown on the event card. Leave empty to display "Virtual Event".
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Tickets & Pricing</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Event Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: 'free' | 'paid') =>
                      setFormData({ ...formData, type: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="free">Free</SelectItem>
                      <SelectItem value="paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.type === 'paid' && (
                  <div className="space-y-2">
                    <Label htmlFor="price">Price per Ticket</Label>
                    <Input
                      id="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.price}
                      onChange={(e) =>
                        setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                      }
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="totalTickets">Total Tickets *</Label>
                  <Input
                    id="totalTickets"
                    type="number"
                    min="1"
                    value={formData.totalTickets}
                    onChange={(e) =>
                      setFormData({ ...formData, totalTickets: parseInt(e.target.value) || 100 })
                    }
                    required
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>

      {/* Confirmation Modal */}
      {showConfirmModal && (
        <EventUpdateConfirmationModal
          changes={pendingChanges}
          onConfirm={handleConfirmSave}
          onCancel={() => setShowConfirmModal(false)}
          loading={saving}
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm ${
              t.variant === 'destructive'
                ? 'bg-red-50 text-red-900 border border-red-200'
                : 'bg-green-50 text-green-900 border border-green-200'
            }`}
          >
            {t.title && <p className="font-semibold">{t.title}</p>}
            {t.description && <p className="text-sm">{t.description}</p>}
          </div>
        ))}
      </div>
    </div>
  );
}
