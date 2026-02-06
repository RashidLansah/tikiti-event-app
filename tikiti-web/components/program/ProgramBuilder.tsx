'use client';

import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Plus, Trash2, Edit, Calendar, Clock, MapPin, Users, QrCode } from 'lucide-react';
import { ProgramSession, Program } from '@/types/program';
import { SessionEditor } from './SessionEditor';

interface ProgramBuilderProps {
  initialProgram?: Program;
  eventId?: string;
  eventName?: string;
  eventDate?: string;
  organizationId?: string;
  organizationName?: string;
  userId?: string;
  onSave: (program: Program) => void;
  onCancel?: () => void;
}

export function ProgramBuilder({
  initialProgram,
  eventId,
  eventName,
  eventDate,
  organizationId,
  organizationName,
  userId,
  onSave,
  onCancel,
}: ProgramBuilderProps) {
  const [program, setProgram] = useState<Program>(
    initialProgram || { sessions: [] }
  );
  const [editingSession, setEditingSession] = useState<ProgramSession | null>(null);

  const addSession = () => {
    const newSession: ProgramSession = {
      id: `session-${Date.now()}`,
      title: '',
      startTime: '09:00',
      endTime: '10:00',
      date: eventDate || undefined, // Use eventDate as default, but allow undefined for single-day events
      type: 'session',
    };
    setProgram({
      ...program,
      sessions: [...program.sessions, newSession],
    });
    setEditingSession(newSession);
  };

  const updateSession = useCallback((sessionId: string, updates: Partial<ProgramSession>) => {
    setProgram((prevProgram) => ({
      ...prevProgram,
      sessions: prevProgram.sessions.map((s) =>
        s.id === sessionId ? { ...s, ...updates } : s
      ),
    }));
    setEditingSession((prevSession) => {
      if (prevSession?.id === sessionId) {
        return { ...prevSession, ...updates };
      }
      return prevSession;
    });
  }, []);

  // Memoize the onUpdate callback for SessionEditor
  const handleSessionUpdate = useCallback((updates: Partial<ProgramSession>) => {
    if (editingSession) {
      updateSession(editingSession.id, updates);
    }
  }, [editingSession?.id, updateSession]);

  const deleteSession = (sessionId: string) => {
    setProgram({
      ...program,
      sessions: program.sessions.filter((s) => s.id !== sessionId),
    });
    if (editingSession?.id === sessionId) {
      setEditingSession(null);
    }
  };

  // Helper function to clean undefined values from program data (Firebase doesn't accept undefined)
  const cleanProgramData = (program: Program): Program => {
    return {
      sessions: program.sessions.map((session) => {
        const cleaned: ProgramSession = {
          id: session.id,
          title: session.title,
          startTime: session.startTime,
          endTime: session.endTime,
          type: session.type,
        };

        // Only include optional fields if they have values
        if (session.description?.trim()) {
          cleaned.description = session.description.trim();
        }
        if (session.date?.trim()) {
          cleaned.date = session.date.trim();
        }
        if (session.track?.trim()) {
          cleaned.track = session.track.trim();
        }
        if (session.capacity !== undefined && session.capacity !== null) {
          cleaned.capacity = session.capacity;
        }

        // New speakers array (preferred)
        if (session.speakers && session.speakers.length > 0) {
          cleaned.speakers = session.speakers;
        }

        // Clean legacy speaker object
        if (session.speaker && !session.speakers?.length) {
          const speakerObj: any = {};
          if (session.speaker.name?.trim()) speakerObj.name = session.speaker.name.trim();
          if (session.speaker.bio?.trim()) speakerObj.bio = session.speaker.bio.trim();
          if (session.speaker.email?.trim()) speakerObj.email = session.speaker.email.trim();
          if (session.speaker.photo?.trim()) speakerObj.photo = session.speaker.photo.trim();

          if (Object.keys(speakerObj).length > 0) {
            cleaned.speaker = speakerObj;
          }
        }

        // Clean location object
        if (session.location) {
          const locationObj: any = {};
          if (session.location.name?.trim()) locationObj.name = session.location.name.trim();
          if (session.location.address?.trim()) locationObj.address = session.location.address.trim();

          if (Object.keys(locationObj).length > 0) {
            cleaned.location = locationObj;
          }
        }

        return cleaned;
      }),
    };
  };

  const handleSave = () => {
    // Validate sessions
    const invalidSessions = program.sessions.filter(
      (s) => !s.title.trim() || !s.startTime || !s.endTime
    );
    if (invalidSessions.length > 0) {
      alert('Please complete all session details before saving.');
      return;
    }

    // Validate dates: ensure no session date is before event date
    if (eventDate) {
      const invalidDates = program.sessions.filter(
        (s) => s.date && s.date < eventDate
      );
      if (invalidDates.length > 0) {
        alert('Some sessions have dates before the event start date. Please correct them before saving.');
        return;
      }
    }

    // Clean program data before saving (remove undefined values)
    const cleanedProgram = cleanProgramData(program);
    onSave(cleanedProgram);
  };

  // Sort sessions by time
  const sortedSessions = [...program.sessions].sort((a, b) => {
    if (a.date && b.date && a.date !== b.date) {
      return a.date.localeCompare(b.date);
    }
    return a.startTime.localeCompare(b.startTime);
  });

  // Group sessions by date if multi-day
  const groupedSessions = sortedSessions.reduce((acc, session) => {
    const date = session.date || eventDate || 'default';
    if (!acc[date]) {
      acc[date] = [];
    }
    acc[date].push(session);
    return acc;
  }, {} as Record<string, ProgramSession[]>);

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Event Program</h2>
          <p className="text-sm text-gray-500 mt-1">
            Create and manage your event agenda and sessions
          </p>
        </div>
        <div className="flex items-center gap-2">
          {onCancel && (
            <Button variant="outline" onClick={onCancel}>
              Cancel
            </Button>
          )}
          <Button onClick={handleSave}>Save Program</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Sessions List */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Program Sessions</CardTitle>
                  <CardDescription>
                    {program.sessions.length} session
                    {program.sessions.length !== 1 ? 's' : ''}
                  </CardDescription>
                </div>
                <Button onClick={addSession} size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Session
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {program.sessions.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <Calendar className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                  <p>No sessions added yet</p>
                  <p className="text-sm mt-2">Click "Add Session" to get started</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {Object.entries(groupedSessions).map(([date, sessions]) => (
                    <div key={date}>
                      {Object.keys(groupedSessions).length > 1 && (
                        <h3 className="text-sm font-semibold text-gray-700 mb-2">
                          {new Date(date).toLocaleDateString('en-US', {
                            weekday: 'long',
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </h3>
                      )}
                      <div className="space-y-2">
                        {sessions.map((session) => (
                          <div
                            key={session.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                              editingSession?.id === session.id
                                ? 'border-primary bg-primary/5'
                                : 'hover:bg-gray-50'
                            }`}
                            onClick={() => setEditingSession(session)}
                          >
                            <div className="flex items-start justify-between">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <Badge variant="secondary" className="text-xs">
                                    {session.type}
                                  </Badge>
                                  <span className="font-medium">
                                    {session.title || 'Untitled Session'}
                                  </span>
                                </div>
                                <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500 mt-2">
                                  <div className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    {session.date 
                                      ? new Date(session.date).toLocaleDateString('en-US', {
                                          month: 'short',
                                          day: 'numeric',
                                        })
                                      : eventDate 
                                        ? new Date(eventDate).toLocaleDateString('en-US', {
                                            month: 'short',
                                            day: 'numeric',
                                          })
                                        : 'Date TBD'}
                                  </div>
                                  <div className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {session.startTime} - {session.endTime}
                                  </div>
                                  {session.location && (
                                    <div className="flex items-center gap-1">
                                      <MapPin className="h-3 w-3" />
                                      {session.location.name}
                                    </div>
                                  )}
                                  {(session.speakers && session.speakers.length > 0) ? (
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {session.speakers.length} speaker{session.speakers.length !== 1 ? 's' : ''}
                                    </div>
                                  ) : session.speaker && (
                                    <div className="flex items-center gap-1">
                                      <Users className="h-3 w-3" />
                                      {session.speaker.name}
                                    </div>
                                  )}
                                </div>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  deleteSession(session.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Session Editor */}
        <div>
          {editingSession ? (
            <SessionEditor
              key={editingSession.id}
              session={editingSession}
              eventId={eventId}
              eventName={eventName}
              eventDate={eventDate}
              organizationId={organizationId}
              organizationName={organizationName}
              userId={userId}
              onUpdate={handleSessionUpdate}
              onClose={() => setEditingSession(null)}
            />
          ) : (
            <Card>
              <CardContent className="py-12 text-center text-gray-500">
                <Calendar className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                <p>Select a session to edit or add a new session</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
