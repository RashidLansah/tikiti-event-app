'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { eventUpdateService, EventUpdate } from '@/lib/services/eventUpdateService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowLeft, Send, Bell, BellOff } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';

export default function EventUpdatesPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const eventId = params.id as string;
  const { user } = useAuth();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [existingUpdates, setExistingUpdates] = useState<EventUpdate[]>([]);
  
  const [formData, setFormData] = useState({
    type: 'general' as EventUpdate['type'],
    title: '',
    message: '',
    sendNotification: false,
    notificationChannels: {
      email: false,
      sms: false,
    },
  });

  useEffect(() => {
    loadEvent();
    loadUpdates();
  }, [eventId]);

  const loadEvent = async () => {
    setLoading(true);
    try {
      const eventData = await eventService.getById(eventId);
      setEvent(eventData);
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

  const loadUpdates = async () => {
    try {
      const updates = await eventUpdateService.getUpdatesByEvent(eventId);
      setExistingUpdates(updates);
    } catch (error) {
      console.error('Error loading updates:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.message.trim()) {
      toast({
        title: 'Error',
        description: 'Please fill in all required fields',
        variant: 'destructive',
      });
      return;
    }

    if (formData.sendNotification && !formData.notificationChannels.email && !formData.notificationChannels.sms) {
      toast({
        title: 'Error',
        description: 'Please select at least one notification channel',
        variant: 'destructive',
      });
      return;
    }

    setSaving(true);
    try {
      // Create the update
      await eventUpdateService.createUpdate(eventId, {
        eventId,
        type: formData.type,
        title: formData.title,
        message: formData.message,
        createdBy: user?.uid,
      });

      // Send notifications if requested
      if (formData.sendNotification && event) {
        try {
          // Call API endpoint to send notifications to attendees
          const response = await fetch('/api/notify-event-change', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              eventId,
              changeType: 'general',
              eventName: event.name,
              customMessage: formData.message,
              customTitle: formData.title,
              sendEmail: formData.notificationChannels.email,
              sendSMS: formData.notificationChannels.sms,
            }),
          });
          
          if (!response.ok) {
            throw new Error('Failed to send notifications');
          }

        } catch (notifError) {
          console.error('Error sending notifications:', notifError);
          // Don't fail the update creation if notifications fail
        }
      }

      toast({
        title: 'Success',
        description: 'Update created successfully',
      });

      // Reset form
      setFormData({
        type: 'general',
        title: '',
        message: '',
        sendNotification: false,
        notificationChannels: {
          email: false,
          sms: false,
        },
      });

      // Reload updates
      loadUpdates();
    } catch (error: any) {
      console.error('Error creating update:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to create update',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-4">
        <Link href={`/dashboard/events/${eventId}`}>
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Post Event Update</h1>
          <p className="text-gray-600 mt-1">{event?.name}</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Create Update Form */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Create New Update</CardTitle>
              <CardDescription>
                Post an announcement or update that will be visible to all event attendees
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Update Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => setFormData({ ...formData, type: value as EventUpdate['type'] })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General Announcement</SelectItem>
                      <SelectItem value="cancelled">Event Cancelled</SelectItem>
                      <SelectItem value="postponed">Event Postponed</SelectItem>
                      <SelectItem value="date_changed">Date Changed</SelectItem>
                      <SelectItem value="location_changed">Location Changed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Important Event Update"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Message *</Label>
                  <Textarea
                    id="message"
                    placeholder="Enter your update message..."
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    rows={6}
                    required
                  />
                </div>

                <div className="space-y-3 pt-4 border-t">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="sendNotification"
                      checked={formData.sendNotification}
                      onCheckedChange={(checked) =>
                        setFormData({ ...formData, sendNotification: checked as boolean })
                      }
                    />
                    <Label htmlFor="sendNotification" className="cursor-pointer">
                      Send notification to attendees
                    </Label>
                  </div>

                  {formData.sendNotification && (
                    <div className="ml-6 space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="email"
                          checked={formData.notificationChannels.email}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              notificationChannels: {
                                ...formData.notificationChannels,
                                email: checked as boolean,
                              },
                            })
                          }
                        />
                        <Label htmlFor="email" className="cursor-pointer">
                          Send Email
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="sms"
                          checked={formData.notificationChannels.sms}
                          onCheckedChange={(checked) =>
                            setFormData({
                              ...formData,
                              notificationChannels: {
                                ...formData.notificationChannels,
                                sms: checked as boolean,
                              },
                            })
                          }
                        />
                        <Label htmlFor="sms" className="cursor-pointer">
                          Send SMS
                        </Label>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-2 pt-4">
                  <Button type="submit" disabled={saving}>
                    {saving ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Posting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Post Update
                      </>
                    )}
                  </Button>
                  <Link href={`/dashboard/events/${eventId}`}>
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* Existing Updates */}
        <div className="md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>Recent Updates</CardTitle>
              <CardDescription>
                {existingUpdates.length} update{existingUpdates.length !== 1 ? 's' : ''} posted
              </CardDescription>
            </CardHeader>
            <CardContent>
              {existingUpdates.length === 0 ? (
                <p className="text-sm text-gray-500">No updates yet</p>
              ) : (
                <div className="space-y-3">
                  {existingUpdates.slice(0, 5).map((update) => (
                    <div key={update.id} className="text-sm">
                      <p className="font-medium">{update.title}</p>
                      <p className="text-gray-500 text-xs mt-1">
                        {update.createdAt?.toDate?.()
                          ? new Date(update.createdAt.toDate()).toLocaleDateString()
                          : 'Recently'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
