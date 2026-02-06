'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Mail, Send, Users, Calendar, Filter, MessageSquare, Smartphone } from 'lucide-react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface Attendee {
  id: string;
  userEmail: string;
  userName: string;
  phoneNumber?: string;
  createdAt?: any;
  registrationType?: string;
}

interface AttendeeMessagingProps {
  eventId: string;
  eventName: string;
}

export function AttendeeMessaging({ eventId, eventName }: AttendeeMessagingProps) {
  const { toast } = useToast();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedAttendees, setSelectedAttendees] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'rsvp' | 'purchase'>('all');
  const [channels, setChannels] = useState<{ email: boolean; sms: boolean }>({ email: true, sms: false });

  useEffect(() => {
    loadAttendees();
  }, [eventId]);

  const loadAttendees = async () => {
    try {
      setLoading(true);
      const bookingsRef = collection(db, 'bookings');
      const q = query(
        bookingsRef,
        where('eventId', '==', eventId),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(q);
      
      const allAttendees: Attendee[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.userEmail || data.phoneNumber) {
          allAttendees.push({
            id: doc.id,
            userEmail: data.userEmail || '',
            userName: data.userName || data.firstName + ' ' + (data.lastName || '') || 'Guest',
            phoneNumber: data.phoneNumber || data.userPhone || '',
            createdAt: data.createdAt,
            registrationType: data.registrationType || 'rsvp',
          });
        }
      });

      setAttendees(allAttendees);
    } catch (error) {
      console.error('Error loading attendees:', error);
      toast({
        title: 'Error',
        description: 'Failed to load attendees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Unknown';
    try {
      const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    } catch {
      return 'Unknown';
    }
  };

  const filteredAttendees = attendees.filter((attendee) => {
    // Filter by registration type
    if (filterType !== 'all' && attendee.registrationType !== filterType) {
      return false;
    }

    // Filter by date
    if (filterDate) {
      const attendeeDate = attendee.createdAt?.toDate 
        ? attendee.createdAt.toDate().toISOString().split('T')[0]
        : null;
      if (attendeeDate !== filterDate) {
        return false;
      }
    }

    return true;
  });

  const toggleAttendee = (id: string) => {
    const newSelected = new Set(selectedAttendees);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedAttendees(newSelected);
  };

  const selectAll = () => {
    // Filter attendees that can receive messages via selected channels
    const selectableAttendees = filteredAttendees.filter(attendee => {
      if (!channels.email && !channels.sms) return true; // If no channels selected, allow all
      if (channels.email && channels.sms) {
        return attendee.userEmail || attendee.phoneNumber;
      }
      if (channels.email) return attendee.userEmail;
      if (channels.sms) return attendee.phoneNumber;
      return false;
    });

    const selectableIds = new Set(selectableAttendees.map(a => a.id));
    const allSelected = selectableIds.size > 0 && 
      Array.from(selectableIds).every(id => selectedAttendees.has(id));

    if (allSelected) {
      setSelectedAttendees(new Set());
    } else {
      setSelectedAttendees(selectableIds);
    }
  };

  const handleSendMessages = async () => {
    // Validate based on selected channels
    if (channels.email && !subject.trim()) {
      toast({
        title: 'Error',
        description: 'Email subject is required when sending emails',
        variant: 'destructive',
      });
      return;
    }

    if (!message.trim()) {
      toast({
        title: 'Error',
        description: 'Message is required',
        variant: 'destructive',
      });
      return;
    }

    if (selectedAttendees.size === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one attendee',
        variant: 'destructive',
      });
      return;
    }

    const selected = filteredAttendees.filter(a => selectedAttendees.has(a.id));
    
    // Validate that selected attendees have required contact info
    if (channels.email && selected.some(a => !a.userEmail)) {
      toast({
        title: 'Error',
        description: 'Some selected attendees do not have email addresses',
        variant: 'destructive',
      });
      return;
    }

    if (channels.sms && selected.some(a => !a.phoneNumber)) {
      toast({
        title: 'Error',
        description: 'Some selected attendees do not have phone numbers',
        variant: 'destructive',
      });
      return;
    }

    setSending(true);
    try {
      const results: { email?: boolean; sms?: boolean } = {};

      // Send emails if enabled
      if (channels.email) {
        const emailRecipients = selected
          .filter(a => a.userEmail)
          .map(a => ({ email: a.userEmail, name: a.userName }));

        if (emailRecipients.length > 0) {
          const emailResponse = await fetch('/api/send-bulk-email', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              recipients: emailRecipients,
              subject,
              message,
              eventName,
            }),
          });

          const emailResult = await emailResponse.json();
          results.email = emailResult.success;
        }
      }

      // Send SMS if enabled
      if (channels.sms) {
        const smsRecipients = selected
          .filter(a => a.phoneNumber)
          .map(a => ({ phone: a.phoneNumber, name: a.userName }));

        if (smsRecipients.length > 0) {
          try {
            const smsResponse = await fetch('/api/send-bulk-sms', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                recipients: smsRecipients,
                message,
                eventName,
              }),
            });

            // Check if response is OK before parsing JSON
            if (!smsResponse.ok) {
              const errorText = await smsResponse.text();
              console.error('SMS API error:', errorText);
              throw new Error(`SMS API returned ${smsResponse.status}: ${errorText.substring(0, 100)}`);
            }

            const smsResult = await smsResponse.json();
            results.sms = smsResult.success;
            
            // Show toast based on result
            if (smsResult.success) {
              if (smsResult.failed > 0) {
                // Partial success
                toast({
                  title: 'Partial Success',
                  description: `SMS sent to ${smsResult.sent} recipient(s), but ${smsResult.failed} failed. ${smsResult.errors?.slice(0, 2).join(', ')}`,
                  variant: 'default',
                });
              } else {
                // Full success
                toast({
                  title: 'Success',
                  description: `SMS sent to ${smsResult.sent} recipient(s)`,
                });
              }
            } else {
              // Complete failure
              toast({
                title: 'SMS Failed',
                description: smsResult.error || 'Failed to send SMS. Please check the console for details.',
                variant: 'destructive',
              });
            }
          } catch (smsError: any) {
            console.error('Error sending SMS:', smsError);
            toast({
              title: 'SMS Error',
              description: smsError.message || 'Failed to send SMS. Please check the console for details.',
              variant: 'destructive',
            });
            results.sms = false;
          }
        }
      }

      // Show success message for emails
      if (results.email) {
        const emailCount = selected.filter(a => a.userEmail).length;
        toast({
          title: 'Success',
          description: `${emailCount} email(s) sent`,
        });
      }

      // Reset form if at least one channel succeeded
      if (results.email || results.sms) {
        setSubject('');
        setMessage('');
        setSelectedAttendees(new Set());
      }
      
      // If both failed, show error
      if (!results.email && !results.sms) {
        toast({
          title: 'Error',
          description: 'Failed to send messages via any channel',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      console.error('Error sending messages:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to send messages',
        variant: 'destructive',
      });
    } finally {
      setSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Send Message to Attendees
        </CardTitle>
        <CardDescription>
          Send emails and/or text messages to attendees who have RSVP'd for this event
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Filters */}
        <div className="space-y-4 border-b pb-4">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <Label htmlFor="filterDate">Filter by RSVP Date</Label>
              <Input
                id="filterDate"
                type="date"
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Label htmlFor="filterType">Filter by Type</Label>
              <select
                id="filterType"
                value={filterType}
                onChange={(e) => setFilterType(e.target.value as any)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <option value="all">All</option>
                <option value="rsvp">RSVP</option>
                <option value="purchase">Paid</option>
              </select>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">
                Showing {filteredAttendees.length} of {attendees.length} attendees
              </p>
              {(channels.email || channels.sms) && (
                <div className="text-xs text-gray-500 mt-1 space-y-0.5">
                  {channels.email && (
                    <p>
                      📧 {filteredAttendees.filter(a => a.userEmail).length} with email
                    </p>
                  )}
                  {channels.sms && (
                    <p>
                      📱 {filteredAttendees.filter(a => a.phoneNumber).length} with phone
                    </p>
                  )}
                  {channels.email && channels.sms && (
                    <p className="text-gray-400">
                      {filteredAttendees.filter(a => a.userEmail || a.phoneNumber).length} can receive messages
                    </p>
                  )}
                </div>
              )}
            </div>
            <Button variant="outline" size="sm" onClick={selectAll}>
              {(() => {
                const selectableCount = filteredAttendees.filter(attendee => {
                  if (!channels.email && !channels.sms) return true;
                  if (channels.email && channels.sms) return attendee.userEmail || attendee.phoneNumber;
                  if (channels.email) return attendee.userEmail;
                  if (channels.sms) return attendee.phoneNumber;
                  return false;
                }).length;
                const allSelected = selectableCount > 0 && 
                  selectedAttendees.size === selectableCount;
                return allSelected ? 'Deselect All' : 'Select All';
              })()}
            </Button>
          </div>
        </div>

        {/* Attendee List */}
        <div className="max-h-64 overflow-y-auto space-y-2 border rounded-lg p-4">
          {loading ? (
            <div className="text-center py-8 text-gray-500">Loading attendees...</div>
          ) : filteredAttendees.length === 0 ? (
            <div className="text-center py-8 text-gray-500">No attendees found</div>
          ) : (
            filteredAttendees.map((attendee) => {
              const hasEmail = !!attendee.userEmail;
              const hasPhone = !!attendee.phoneNumber;
              const canReceiveEmail = hasEmail && channels.email;
              const canReceiveSMS = hasPhone && channels.sms;
              const canReceiveSelected = canReceiveEmail || canReceiveSMS || (!channels.email && !channels.sms);
              
              return (
                <div
                  key={attendee.id}
                  className={`flex items-center space-x-3 p-2 hover:bg-gray-50 rounded-lg ${
                    !canReceiveSelected && (channels.email || channels.sms) ? 'opacity-50' : ''
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedAttendees.has(attendee.id)}
                    onChange={() => toggleAttendee(attendee.id)}
                    disabled={!canReceiveSelected && (channels.email || channels.sms)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary disabled:opacity-50"
                  />
                  <div className="flex-1">
                    <p className="font-medium">{attendee.userName}</p>
                    <div className="flex flex-col gap-1">
                      {attendee.userEmail ? (
                        <p className={`text-sm flex items-center gap-1 ${
                          canReceiveEmail ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          <Mail className={`h-3 w-3 ${canReceiveEmail ? 'text-blue-500' : 'text-gray-300'}`} />
                          {attendee.userEmail}
                        </p>
                      ) : (
                        channels.email && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            No email
                          </p>
                        )
                      )}
                      {attendee.phoneNumber ? (
                        <p className={`text-sm flex items-center gap-1 ${
                          canReceiveSMS ? 'text-gray-600' : 'text-gray-400'
                        }`}>
                          <Smartphone className={`h-3 w-3 ${canReceiveSMS ? 'text-green-500' : 'text-gray-300'}`} />
                          {attendee.phoneNumber}
                        </p>
                      ) : (
                        channels.sms && (
                          <p className="text-xs text-red-400 flex items-center gap-1">
                            <Smartphone className="h-3 w-3" />
                            No phone
                          </p>
                        )
                      )}
                      {!hasEmail && !hasPhone && (
                        <p className="text-sm text-gray-400 italic">No contact info</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="secondary" className="mb-1">
                      {attendee.registrationType === 'rsvp' ? 'RSVP' : 'Paid'}
                    </Badge>
                    <p className="text-xs text-gray-500">
                      {formatDate(attendee.createdAt)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Channel Selection */}
        <div className="space-y-4 border-t pt-4">
          <div>
            <Label>Send Via</Label>
            <div className="flex gap-4 mt-2">
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.email}
                  onChange={(e) => setChannels({ ...channels, email: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-2">
                  <Mail className="h-4 w-4" />
                  Email
                </span>
              </label>
              <label className="flex items-center space-x-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={channels.sms}
                  onChange={(e) => setChannels({ ...channels, sms: e.target.checked })}
                  className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="flex items-center gap-2">
                  <Smartphone className="h-4 w-4" />
                  SMS
                </span>
              </label>
            </div>
            {!channels.email && !channels.sms && (
              <p className="text-sm text-red-500 mt-1">Please select at least one channel</p>
            )}
          </div>
        </div>

        {/* Message Form */}
        <div className="space-y-4 border-t pt-4">
          {channels.email && (
            <div>
              <Label htmlFor="subject">Email Subject *</Label>
              <Input
                id="subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Email subject"
              />
            </div>
          )}
          <div>
            <Label htmlFor="message">Message *</Label>
            <Textarea
              id="message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder={channels.sms && !channels.email 
                ? "Your SMS message (160 characters recommended)..."
                : "Your message to attendees..."}
              rows={6}
              maxLength={channels.sms ? 1600 : undefined}
            />
            {channels.sms && (
              <p className="text-xs text-gray-500 mt-1">
                {message.length} characters {message.length > 160 && '(SMS will be split into multiple messages)'}
              </p>
            )}
          </div>
          <Button
            onClick={handleSendMessages}
            disabled={
              sending || 
              selectedAttendees.size === 0 || 
              !message.trim() || 
              (channels.email && !subject.trim()) ||
              (!channels.email && !channels.sms)
            }
            className="w-full"
          >
            {sending ? (
              <>Sending...</>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {(() => {
                  const selected = filteredAttendees.filter(a => selectedAttendees.has(a.id));
                  const emailCount = channels.email ? selected.filter(a => a.userEmail).length : 0;
                  const smsCount = channels.sms ? selected.filter(a => a.phoneNumber).length : 0;
                  
                  if (channels.email && channels.sms) {
                    return `Send Email (${emailCount}) & SMS (${smsCount}) to ${selectedAttendees.size} Attendee${selectedAttendees.size !== 1 ? 's' : ''}`;
                  } else if (channels.email) {
                    return `Send Email to ${emailCount} Attendee${emailCount !== 1 ? 's' : ''}`;
                  } else {
                    return `Send SMS to ${smsCount} Attendee${smsCount !== 1 ? 's' : ''}`;
                  }
                })()}
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
