'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X, Plus, User, Trash2, UserPlus } from 'lucide-react';
import { ProgramSession } from '@/types/program';
import { Speaker, SpeakerRole, SessionSpeaker } from '@/types/speaker';
import { speakerService } from '@/lib/services/speakerService';
import { speakerInvitationService } from '@/lib/services/speakerInvitationService';
import SpeakerQuickAddModal from '@/components/speakers/SpeakerQuickAddModal';

interface SessionEditorProps {
  session: ProgramSession;
  eventId?: string;
  eventName?: string;
  eventDate?: string;
  eventEndDate?: string;
  organizationId?: string;
  organizationName?: string;
  userId?: string;
  onUpdate: (updates: Partial<ProgramSession>) => void;
  onClose: () => void;
}

const SPEAKER_ROLES: { value: SpeakerRole; label: string }[] = [
  { value: 'speaker', label: 'Speaker' },
  { value: 'panelist', label: 'Panelist' },
  { value: 'moderator', label: 'Moderator' },
  { value: 'host', label: 'Host' },
];

export function SessionEditor({
  session,
  eventId,
  eventName,
  eventDate,
  eventEndDate,
  organizationId,
  organizationName,
  userId,
  onUpdate,
  onClose,
}: SessionEditorProps) {
  const [title, setTitle] = useState(session.title);
  const [description, setDescription] = useState(session.description || '');
  const [startTime, setStartTime] = useState(session.startTime);
  const [endTime, setEndTime] = useState(session.endTime);
  const [date, setDate] = useState(session.date || eventDate || '');
  const [type, setType] = useState<ProgramSession['type']>(session.type);
  const [track, setTrack] = useState(session.track || '');
  const [capacity, setCapacity] = useState(session.capacity?.toString() || '');

  // Legacy speaker fields (for backward compatibility)
  const [speakerName, setSpeakerName] = useState(session.speaker?.name || '');
  const [speakerBio, setSpeakerBio] = useState(session.speaker?.bio || '');
  const [speakerEmail, setSpeakerEmail] = useState(session.speaker?.email || '');
  const [speakerPhoto, setSpeakerPhoto] = useState(session.speaker?.photo || '');

  // New: Multiple speakers support
  const [selectedSpeakers, setSelectedSpeakers] = useState<SessionSpeaker[]>(
    session.speakers || []
  );
  const [availableSpeakers, setAvailableSpeakers] = useState<Speaker[]>([]);
  const [loadingSpeakers, setLoadingSpeakers] = useState(false);
  const [showQuickAddModal, setShowQuickAddModal] = useState(false);

  // Location fields
  const [locationName, setLocationName] = useState(session.location?.name || '');
  const [locationAddress, setLocationAddress] = useState(session.location?.address || '');

  // Track if we're the source of updates to prevent infinite loops
  const isInternalUpdateRef = useRef(false);
  const previousSessionRef = useRef<ProgramSession>(session);

  // Load available speakers for this event
  useEffect(() => {
    const loadSpeakers = async () => {
      if (!eventId) return;

      setLoadingSpeakers(true);
      try {
        // Get all submitted invitations for this event
        const invitations = await speakerInvitationService.getByEvent(eventId);
        const submittedInvitations = invitations.filter(inv => inv.status === 'submitted');

        // Get speaker IDs
        const speakerIds = submittedInvitations
          .filter(inv => inv.speakerId)
          .map(inv => inv.speakerId!);

        if (speakerIds.length > 0) {
          const speakers = await speakerService.getByIds(speakerIds);
          // Add role from invitation to each speaker
          const speakersWithRole = speakers.map(speaker => {
            const invitation = submittedInvitations.find(inv => inv.speakerId === speaker.id);
            return { ...speaker, role: invitation?.role || 'speaker' };
          });
          setAvailableSpeakers(speakersWithRole);
        }
      } catch (error) {
        console.error('Error loading speakers:', error);
      } finally {
        setLoadingSpeakers(false);
      }
    };

    loadSpeakers();
  }, [eventId]);

  // Sync state when session prop changes externally (not from our own updates)
  useEffect(() => {
    // Only update if the session prop changed from an external source
    if (isInternalUpdateRef.current) {
      isInternalUpdateRef.current = false;
      previousSessionRef.current = session;
      return;
    }

    // Check if session actually changed
    const prev = previousSessionRef.current;
    if (
      prev.id === session.id &&
      prev.title === session.title &&
      prev.description === session.description &&
      prev.startTime === session.startTime &&
      prev.endTime === session.endTime &&
      prev.date === session.date &&
      prev.type === session.type &&
      prev.track === session.track &&
      prev.capacity === session.capacity &&
      prev.speaker?.name === session.speaker?.name &&
      prev.speaker?.bio === session.speaker?.bio &&
      prev.speaker?.email === session.speaker?.email &&
      prev.speaker?.photo === session.speaker?.photo &&
      prev.location?.name === session.location?.name &&
      prev.location?.address === session.location?.address &&
      JSON.stringify(prev.speakers) === JSON.stringify(session.speakers)
    ) {
      return;
    }

    // Update local state from prop
    setTitle(session.title);
    setDescription(session.description || '');
    setStartTime(session.startTime);
    setEndTime(session.endTime);
    setDate(session.date || eventDate || '');
    setType(session.type);
    setTrack(session.track || '');
    setCapacity(session.capacity?.toString() || '');
    setSpeakerName(session.speaker?.name || '');
    setSpeakerBio(session.speaker?.bio || '');
    setSpeakerEmail(session.speaker?.email || '');
    setSpeakerPhoto(session.speaker?.photo || '');
    setSelectedSpeakers(session.speakers || []);
    setLocationName(session.location?.name || '');
    setLocationAddress(session.location?.address || '');
    previousSessionRef.current = session;
  }, [session, eventDate]);

  // Update parent when local state changes
  useEffect(() => {
    isInternalUpdateRef.current = true;

    // Build updates object, cleaning undefined values
    const updates: Partial<ProgramSession> = {
      title,
      startTime,
      endTime,
      type,
    };

    // Only include optional fields if they have values
    if (description?.trim()) {
      updates.description = description.trim();
    }

    // Include date if it's set (for multi-day events)
    if (date?.trim()) {
      updates.date = date.trim();
    }

    if (track?.trim()) {
      updates.track = track.trim();
    }

    if (capacity && !isNaN(parseInt(capacity))) {
      updates.capacity = parseInt(capacity);
    }

    // New speakers array (preferred)
    if (selectedSpeakers.length > 0) {
      updates.speakers = selectedSpeakers;
      // Also write legacy speaker object with first speaker's details for mobile app compatibility
      const firstSpeaker = availableSpeakers.find(s => s.id === selectedSpeakers[0].speakerId);
      if (firstSpeaker) {
        updates.speaker = {
          name: firstSpeaker.name,
          bio: firstSpeaker.bio || '',
          email: firstSpeaker.email || '',
          photo: firstSpeaker.photoBase64 || firstSpeaker.photoUrl || '',
          speakerId: firstSpeaker.id,
          // Extra fields stored for mobile speaker modal (not in TS type but persisted to Firestore)
          ...(firstSpeaker.jobTitle && { jobTitle: firstSpeaker.jobTitle }),
          ...(firstSpeaker.company && { company: firstSpeaker.company }),
          ...(firstSpeaker.linkedInUrl && { linkedInUrl: firstSpeaker.linkedInUrl }),
          ...(firstSpeaker.twitterHandle && { twitterHandle: firstSpeaker.twitterHandle }),
          ...(firstSpeaker.websiteUrl && { websiteUrl: firstSpeaker.websiteUrl }),
        } as any;
      }
    }

    // Legacy speaker object only if no new speakers are selected
    if (selectedSpeakers.length === 0) {
      const speakerObj: any = {};
      if (speakerName?.trim()) speakerObj.name = speakerName.trim();
      if (speakerBio?.trim()) speakerObj.bio = speakerBio.trim();
      if (speakerEmail?.trim()) speakerObj.email = speakerEmail.trim();
      if (speakerPhoto?.trim()) speakerObj.photo = speakerPhoto.trim();

      if (Object.keys(speakerObj).length > 0) {
        updates.speaker = speakerObj;
      }
    }

    // Build location object only if at least one field has a value
    const locationObj: any = {};
    if (locationName?.trim()) locationObj.name = locationName.trim();
    if (locationAddress?.trim()) locationObj.address = locationAddress.trim();

    if (Object.keys(locationObj).length > 0) {
      updates.location = locationObj;
    }

    onUpdate(updates);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    title,
    description,
    startTime,
    endTime,
    date,
    type,
    track,
    capacity,
    speakerName,
    speakerBio,
    speakerEmail,
    speakerPhoto,
    selectedSpeakers,
    locationName,
    locationAddress,
  ]);

  const addSpeaker = (speakerId: string, role: SpeakerRole = 'speaker') => {
    if (selectedSpeakers.some(s => s.speakerId === speakerId)) return;
    setSelectedSpeakers([...selectedSpeakers, { speakerId, role }]);
  };

  const removeSpeaker = (speakerId: string) => {
    setSelectedSpeakers(selectedSpeakers.filter(s => s.speakerId !== speakerId));
  };

  const updateSpeakerRole = (speakerId: string, role: SpeakerRole) => {
    setSelectedSpeakers(
      selectedSpeakers.map(s =>
        s.speakerId === speakerId ? { ...s, role } : s
      )
    );
  };

  const getSpeakerById = (speakerId: string) => {
    return availableSpeakers.find(s => s.id === speakerId);
  };

  const handleSpeakerAdded = (speaker: Speaker & { role?: SpeakerRole }) => {
    // Add to available speakers
    setAvailableSpeakers([...availableSpeakers, speaker]);
    // Auto-select the newly added speaker
    addSpeaker(speaker.id!, speaker.role || 'speaker');
    setShowQuickAddModal(false);
  };

  // Get speakers not yet selected
  const unselectedSpeakers = availableSpeakers.filter(
    s => !selectedSpeakers.some(sel => sel.speakerId === s.id)
  );

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Edit Session</CardTitle>
              <CardDescription>Configure session details</CardDescription>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4 max-h-[calc(100vh-300px)] overflow-y-auto">
          {/* Basic Information */}
          <div className="space-y-2">
            <Label htmlFor="title">Session Title *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter session title"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter session description"
              className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="startTime">Start Time *</Label>
              <Input
                id="startTime"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="endTime">End Time *</Label>
              <Input
                id="endTime"
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="date">
              Date {eventDate ? '(optional - defaults to event date)' : ''}
            </Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => {
                const selectedDate = e.target.value;
                if (!selectedDate) {
                  setDate('');
                  return;
                }
                if (eventDate && selectedDate < eventDate) {
                  return;
                }
                setDate(selectedDate);
              }}
              min={eventDate || undefined}
              max={eventEndDate || undefined}
              placeholder={eventDate || 'Select date'}
            />
            {eventDate && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>
                  Event starts on {new Date(eventDate).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </p>
                {date && date !== eventDate && (
                  <p>
                    This session is scheduled for {new Date(date).toLocaleDateString('en-US', {
                      weekday: 'long',
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                  </p>
                )}
                {!date && (
                  <p className="italic">
                    Leave empty to use the event start date ({new Date(eventDate).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })})
                  </p>
                )}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="type">Session Type</Label>
              <Select value={type} onValueChange={(value: ProgramSession['type']) => setType(value)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="session">Session</SelectItem>
                  <SelectItem value="keynote">Keynote</SelectItem>
                  <SelectItem value="workshop">Workshop</SelectItem>
                  <SelectItem value="panel">Panel</SelectItem>
                  <SelectItem value="break">Break</SelectItem>
                  <SelectItem value="networking">Networking</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="track">Track (optional)</Label>
              <Input
                id="track"
                value={track}
                onChange={(e) => setTrack(e.target.value)}
                placeholder="e.g., Track A, Track B"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="capacity">Capacity (optional)</Label>
            <Input
              id="capacity"
              type="number"
              value={capacity}
              onChange={(e) => setCapacity(e.target.value)}
              placeholder="Maximum attendees"
            />
          </div>

          {/* Speaker Selection */}
          <div className="pt-4 border-t space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold">Speakers</h3>
              {eventId && organizationId && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowQuickAddModal(true)}
                  className="text-xs"
                >
                  <UserPlus className="w-3 h-3 mr-1" />
                  Add New Speaker
                </Button>
              )}
            </div>

            {/* Selected Speakers */}
            {selectedSpeakers.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Selected Speakers</Label>
                {selectedSpeakers.map((sessionSpeaker) => {
                  const speaker = getSpeakerById(sessionSpeaker.speakerId);
                  return (
                    <div
                      key={sessionSpeaker.speakerId}
                      className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                    >
                      {speaker?.photoBase64 ? (
                        <img
                          src={speaker.photoBase64}
                          alt={speaker.name}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-400" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {speaker?.name || 'Unknown Speaker'}
                        </p>
                        <p className="text-xs text-gray-500 truncate">
                          {speaker?.jobTitle}
                          {speaker?.company && ` at ${speaker.company}`}
                        </p>
                      </div>
                      <Select
                        value={sessionSpeaker.role}
                        onValueChange={(value: SpeakerRole) =>
                          updateSpeakerRole(sessionSpeaker.speakerId, value)
                        }
                      >
                        <SelectTrigger className="w-28 h-8 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {SPEAKER_ROLES.map((r) => (
                            <SelectItem key={r.value} value={r.value}>
                              {r.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => removeSpeaker(sessionSpeaker.speakerId)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Add Speaker Dropdown */}
            {eventId && (
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">
                  {selectedSpeakers.length > 0 ? 'Add Another Speaker' : 'Select Speaker'}
                </Label>
                <Select
                  value=""
                  onValueChange={(speakerId) => {
                    if (speakerId === '__add_new__') {
                      setShowQuickAddModal(true);
                    } else {
                      addSpeaker(speakerId);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      loadingSpeakers
                        ? 'Loading speakers...'
                        : unselectedSpeakers.length === 0 && availableSpeakers.length > 0
                          ? 'All speakers selected'
                          : 'Select a speaker'
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {unselectedSpeakers.map((speaker) => (
                      <SelectItem key={speaker.id} value={speaker.id!}>
                        <div className="flex items-center gap-2">
                          {speaker.photoBase64 ? (
                            <img
                              src={speaker.photoBase64}
                              alt={speaker.name}
                              className="w-6 h-6 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-6 h-6 rounded-full bg-gray-200 flex items-center justify-center">
                              <User className="w-3 h-3 text-gray-400" />
                            </div>
                          )}
                          <span>{speaker.name}</span>
                          {speaker.jobTitle && (
                            <span className="text-xs text-gray-400">
                              - {speaker.jobTitle}
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                    {organizationId && (
                      <>
                        {unselectedSpeakers.length > 0 && (
                          <div className="border-t my-1" />
                        )}
                        <SelectItem value="__add_new__">
                          <div className="flex items-center gap-2 text-primary">
                            <Plus className="w-4 h-4" />
                            <span>Add New Speaker</span>
                          </div>
                        </SelectItem>
                      </>
                    )}
                  </SelectContent>
                </Select>
                {!loadingSpeakers && availableSpeakers.length === 0 && (
                  <p className="text-xs text-muted-foreground">
                    No confirmed speakers yet. Click "Add New Speaker" to add one directly.
                  </p>
                )}
              </div>
            )}

            {/* Legacy Manual Speaker Input (shown when no eventId or as fallback) */}
            {(!eventId || (selectedSpeakers.length === 0 && availableSpeakers.length === 0)) && (
              <div className="space-y-4 pt-2">
                {eventId && (
                  <div className="text-center py-2">
                    <span className="text-xs text-muted-foreground">— or enter manually —</span>
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="speakerName">Speaker Name</Label>
                  <Input
                    id="speakerName"
                    value={speakerName}
                    onChange={(e) => setSpeakerName(e.target.value)}
                    placeholder="Speaker's name"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speakerEmail">Speaker Email</Label>
                  <Input
                    id="speakerEmail"
                    type="email"
                    value={speakerEmail}
                    onChange={(e) => setSpeakerEmail(e.target.value)}
                    placeholder="speaker@example.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speakerBio">Speaker Bio</Label>
                  <textarea
                    id="speakerBio"
                    value={speakerBio}
                    onChange={(e) => setSpeakerBio(e.target.value)}
                    placeholder="Brief bio about the speaker"
                    className="flex min-h-[60px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="speakerPhoto">Speaker Photo URL</Label>
                  <Input
                    id="speakerPhoto"
                    type="url"
                    value={speakerPhoto}
                    onChange={(e) => setSpeakerPhoto(e.target.value)}
                    placeholder="https://example.com/photo.jpg"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Location Information */}
          <div className="pt-4 border-t space-y-4">
            <h3 className="font-semibold">Location Information</h3>
            <div className="space-y-2">
              <Label htmlFor="locationName">Location Name</Label>
              <Input
                id="locationName"
                value={locationName}
                onChange={(e) => setLocationName(e.target.value)}
                placeholder="e.g., Main Hall, Room 101"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="locationAddress">Location Address</Label>
              <Input
                id="locationAddress"
                value={locationAddress}
                onChange={(e) => setLocationAddress(e.target.value)}
                placeholder="Full address (optional)"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Quick Add Speaker Modal */}
      {showQuickAddModal && eventId && organizationId && userId && (
        <SpeakerQuickAddModal
          eventId={eventId}
          eventName={eventName || 'Event'}
          organizationId={organizationId}
          organizationName={organizationName || 'Organization'}
          createdBy={userId}
          onClose={() => setShowQuickAddModal(false)}
          onSpeakerAdded={handleSpeakerAdded}
        />
      )}
    </>
  );
}
