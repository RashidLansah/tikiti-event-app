'use client';

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { userProfileService, INTEREST_TAGS, INDUSTRY_OPTIONS, AudienceProfile } from '@/lib/services/userProfileService';
import { eventCategories } from '@/lib/data/categories';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import {
  Users,
  Send,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
  Loader2,
  Target,
  Sparkles,
  MailOpen,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AudienceFilters {
  category: string;
  interests: string[];
}

interface MatchedUser {
  id: string;
  email?: string;
  displayName?: string;
  profession?: string;
  industry?: string;
  interests?: string[];
  allowOrganizerContact: boolean;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AudiencePage() {
  const { currentOrganization, userProfile } = useAuth();
  const { toast } = useToast();

  // Filters
  const [filters, setFilters] = useState<AudienceFilters>({ category: '', interests: [] });
  const [showInterests, setShowInterests] = useState(false);

  // Audience preview
  const [matchedUsers, setMatchedUsers] = useState<MatchedUser[]>([]);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [previewLoaded, setPreviewLoaded] = useState(false);

  // Campaign compose
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventId, setEventId] = useState('');
  const [sending, setSending] = useState(false);
  const [sentCount, setSentCount] = useState<number | null>(null);

  // Fetch matched audience when filters change
  const fetchPreview = useCallback(async () => {
    setPreviewLoading(true);
    setPreviewLoaded(false);
    try {
      const results = await userProfileService.queryAudience({
        category: filters.category || undefined,
      });

      // Client-side interest filter
      const filtered =
        filters.interests.length > 0
          ? results.filter((u) => {
              const userInterests = u.interests || [];
              return filters.interests.some((tag) => userInterests.includes(tag));
            })
          : results;

      setMatchedUsers(filtered as MatchedUser[]);
    } catch (error) {
      console.error('Error fetching audience preview:', error);
    } finally {
      setPreviewLoading(false);
      setPreviewLoaded(true);
    }
  }, [filters.category, filters.interests]);

  // Auto-preview on filter change (debounced)
  useEffect(() => {
    const timer = setTimeout(fetchPreview, 600);
    return () => clearTimeout(timer);
  }, [fetchPreview]);

  const toggleInterest = (tag: string) => {
    setFilters((prev) => ({
      ...prev,
      interests: prev.interests.includes(tag)
        ? prev.interests.filter((t) => t !== tag)
        : [...prev.interests, tag],
    }));
  };

  const handleSendCampaign = async () => {
    if (!subject.trim() || !message.trim()) {
      toast({ title: 'Missing fields', description: 'Please add a subject and message.', variant: 'destructive' });
      return;
    }
    if (matchedUsers.length === 0) {
      toast({ title: 'No audience', description: 'No users match your current filters.', variant: 'destructive' });
      return;
    }

    setSending(true);
    setSentCount(null);

    try {
      const res = await fetch('/api/notifications/audience-campaign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          filters: {
            category: filters.category || undefined,
            interests: filters.interests.length > 0 ? filters.interests : undefined,
          },
          subject,
          message,
          organizationName: currentOrganization?.name || 'Event Organizer',
          organizationEmail: currentOrganization?.email || undefined,
          eventName: eventName || undefined,
          eventId: eventId || undefined,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Failed to send campaign');
      }

      setSentCount(result.emailsSent);
      toast({
        title: 'Campaign sent!',
        description: `${result.emailsSent} email${result.emailsSent !== 1 ? 's' : ''} delivered.`,
      });

      // Reset compose fields
      setSubject('');
      setMessage('');
      setEventName('');
      setEventId('');
    } catch (error: any) {
      toast({ title: 'Error', description: error.message || 'Failed to send campaign.', variant: 'destructive' });
    } finally {
      setSending(false);
    }
  };

  // Aggregate top interests from matched users
  const topInterests = (() => {
    const counts: Record<string, number> = {};
    matchedUsers.forEach((u) => {
      (u.interests || []).forEach((tag) => {
        counts[tag] = (counts[tag] || 0) + 1;
      });
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
  })();

  const topIndustries = (() => {
    const counts: Record<string, number> = {};
    matchedUsers.forEach((u) => {
      if (u.industry) counts[u.industry] = (counts[u.industry] || 0) + 1;
    });
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  })();

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Target className="h-7 w-7" />
          Audience Builder
        </h1>
        <p className="text-gray-500 mt-1">
          Find and reach the right people for your next event.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-5">
        {/* Left: Filters + Compose */}
        <div className="lg:col-span-3 space-y-6">

          {/* Filters card */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <SlidersHorizontal className="h-5 w-5" />
                Filters
              </CardTitle>
              <CardDescription>
                Narrow your audience by event category and interests.
                Only users who opted in to event recommendations are shown.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Category filter */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-2">
                  Event Category
                </label>
                <div className="flex flex-wrap gap-2">
                  <button
                    className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                      filters.category === ''
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                    }`}
                    onClick={() => setFilters((f) => ({ ...f, category: '' }))}
                  >
                    All categories
                  </button>
                  {eventCategories.map((cat) => (
                    <button
                      key={cat.id}
                      className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                        filters.category === cat.id
                          ? 'bg-gray-900 text-white border-gray-900'
                          : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                      }`}
                      onClick={() =>
                        setFilters((f) => ({
                          ...f,
                          category: f.category === cat.id ? '' : cat.id,
                        }))
                      }
                    >
                      {cat.name}
                    </button>
                  ))}
                </div>
              </div>

              {/* Interest tags (collapsible) */}
              <div>
                <button
                  className="flex items-center gap-1 text-sm font-medium text-gray-700 mb-2"
                  onClick={() => setShowInterests((s) => !s)}
                >
                  Interest Tags
                  {filters.interests.length > 0 && (
                    <span className="ml-1 text-xs bg-gray-900 text-white px-1.5 py-0.5 rounded-full">
                      {filters.interests.length}
                    </span>
                  )}
                  {showInterests ? (
                    <ChevronUp className="h-4 w-4 ml-1 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 ml-1 text-gray-400" />
                  )}
                </button>

                {showInterests && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {INTEREST_TAGS.map((tag) => (
                      <button
                        key={tag}
                        className={`text-sm px-3 py-1.5 rounded-full border transition-colors ${
                          filters.interests.includes(tag)
                            ? 'bg-gray-900 text-white border-gray-900'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-gray-400'
                        }`}
                        onClick={() => toggleInterest(tag)}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Campaign composer */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MailOpen className="h-5 w-5" />
                Compose Campaign
              </CardTitle>
              <CardDescription>
                Write your message. Recipients will see it as an email from your organization.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Optional event link */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Event name <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="e.g. Tech Summit 2025"
                    value={eventName}
                    onChange={(e) => setEventName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-700 block mb-1">
                    Event ID <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="text"
                    className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                    placeholder="From event URL"
                    value={eventId}
                    onChange={(e) => setEventId(e.target.value)}
                  />
                </div>
              </div>

              {/* Subject */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Subject <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                  placeholder="e.g. You're invited to Tech Summit 2025"
                  value={subject}
                  maxLength={100}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Message */}
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1">
                  Message <span className="text-red-500">*</span>
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 resize-none"
                  rows={6}
                  placeholder="Write your message here. Each new line becomes a new paragraph."
                  value={message}
                  maxLength={2000}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <p className="text-xs text-gray-400 text-right mt-1">{message.length}/2000</p>
              </div>

              {/* Send button */}
              <div className="flex items-center justify-between pt-2">
                <p className="text-sm text-gray-500">
                  Sending to{' '}
                  <span className="font-semibold text-gray-900">
                    {previewLoading ? '...' : matchedUsers.length}
                  </span>{' '}
                  recipients
                </p>
                <Button
                  onClick={handleSendCampaign}
                  disabled={sending || matchedUsers.length === 0 || !subject || !message}
                  className="flex items-center gap-2"
                >
                  {sending ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Campaign
                    </>
                  )}
                </Button>
              </div>

              {/* Success state */}
              {sentCount !== null && (
                <div className="flex items-center gap-2 bg-green-50 text-green-700 rounded-lg px-4 py-3 text-sm">
                  <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                  <span>
                    Campaign sent to <strong>{sentCount}</strong> recipient{sentCount !== 1 ? 's' : ''}.
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right: Audience preview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Match count */}
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                {previewLoading ? (
                  <div className="flex flex-col items-center gap-2 py-4">
                    <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
                    <p className="text-sm text-gray-500">Calculating...</p>
                  </div>
                ) : (
                  <>
                    <p className="text-5xl font-bold text-gray-900">{matchedUsers.length}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {matchedUsers.length === 1 ? 'person' : 'people'} match your filters
                    </p>
                    <p className="text-xs text-gray-400 mt-2">
                      All have consented to event recommendations
                    </p>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Audience insights */}
          {previewLoaded && matchedUsers.length > 0 && (
            <>
              {/* Top interests */}
              {topInterests.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Top Interests
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-2">
                      {topInterests.map(([tag, count]) => (
                        <div key={tag} className="flex items-center justify-between">
                          <span className="text-sm text-gray-700">{tag}</span>
                          <div className="flex items-center gap-2">
                            <div className="w-24 bg-gray-100 rounded-full h-1.5">
                              <div
                                className="bg-gray-800 h-1.5 rounded-full"
                                style={{
                                  width: `${(count / matchedUsers.length) * 100}%`,
                                }}
                              />
                            </div>
                            <span className="text-xs text-gray-400 w-8 text-right">{count}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Top industries */}
              {topIndustries.length > 0 && (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm flex items-center gap-1.5">
                      <Users className="h-4 w-4" />
                      Industries
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex flex-wrap gap-1.5">
                      {topIndustries.map(([industry, count]) => (
                        <Badge key={industry} variant="secondary" className="text-xs">
                          {industry} · {count}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </>
          )}

          {/* Empty state */}
          {previewLoaded && matchedUsers.length === 0 && (
            <Card>
              <CardContent className="pt-6 text-center">
                <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No users match these filters yet.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Audience grows as attendees complete their profiles.
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
