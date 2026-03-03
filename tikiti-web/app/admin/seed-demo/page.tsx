'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { speakerService } from '@/lib/services/speakerService';
import { surveyService } from '@/lib/services/surveyService';
import { adminService, PlatformOrganization } from '@/lib/services/adminService';
import { Speaker } from '@/types/speaker';
import { ProgramSession } from '@/types/program';
import { Cohort } from '@/types/cohort';
import { SurveyQuestion } from '@/types/engagement';
import {
  Rocket,
  CheckCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  Building2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

interface StepStatus {
  label: string;
  status: 'pending' | 'running' | 'done' | 'error';
  detail?: string;
}

export default function SeedDemoPage() {
  const { user, currentOrganization } = useAuth();
  const [steps, setSteps] = useState<StepStatus[]>([]);
  const [running, setRunning] = useState(false);
  const [eventId, setEventId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // For admin accounts without an org — let them pick one
  const [allOrgs, setAllOrgs] = useState<PlatformOrganization[]>([]);
  const [selectedOrgId, setSelectedOrgId] = useState<string | null>(null);
  const [loadingOrgs, setLoadingOrgs] = useState(false);

  useEffect(() => {
    if (!currentOrganization && user) {
      setLoadingOrgs(true);
      adminService.getAllOrganizations(50).then(orgs => {
        setAllOrgs(orgs);
        if (orgs.length > 0) setSelectedOrgId(orgs[0].id);
      }).catch(() => {}).finally(() => setLoadingOrgs(false));
    }
  }, [currentOrganization, user]);

  const activeOrgId = currentOrganization?.id || selectedOrgId;

  const updateStep = (index: number, update: Partial<StepStatus>) => {
    setSteps(prev => prev.map((s, i) => (i === index ? { ...s, ...update } : s)));
  };

  const handleSeed = async () => {
    if (!user || !activeOrgId) return;

    setRunning(true);
    setError(null);
    setEventId(null);

    const initialSteps: StepStatus[] = [
      { label: 'Creating speakers', status: 'pending' },
      { label: 'Creating demo event with cohorts, agenda & registration form', status: 'pending' },
      { label: 'Creating post-event survey', status: 'pending' },
      { label: 'Publishing event', status: 'pending' },
    ];
    setSteps(initialSteps);

    const orgId = activeOrgId!;
    const userId = user.uid;

    try {
      // ── Step 1: Create Speakers ────────────────────────────
      updateStep(0, { status: 'running' });

      const speakersData: Omit<Speaker, 'id' | 'createdAt' | 'updatedAt'>[] = [
        {
          name: 'Kwame Asante',
          email: 'kwame.asante@demo.tikiti.com',
          jobTitle: 'CEO & Founder',
          company: 'EventPro Africa',
          bio: 'Serial entrepreneur with 10+ years in the African events industry. Kwame has organized over 200 events across 15 countries and is passionate about building technology solutions for event professionals.',
          linkedInUrl: 'https://linkedin.com/in/kwameasante',
          organizationId: orgId,
          status: 'active',
          createdBy: userId,
        },
        {
          name: 'Ama Mensah',
          email: 'ama.mensah@demo.tikiti.com',
          jobTitle: 'Head of Operations',
          company: 'Tikiti Events',
          bio: 'Operations expert specializing in large-scale event logistics. Ama has managed events ranging from intimate workshops to 50,000-person festivals, bringing precision and creativity to every project.',
          linkedInUrl: 'https://linkedin.com/in/amamensah',
          organizationId: orgId,
          status: 'active',
          createdBy: userId,
        },
        {
          name: 'Kofi Darko',
          email: 'kofi.darko@demo.tikiti.com',
          jobTitle: 'Lead Product Engineer',
          company: 'Tikiti Events',
          bio: 'Full-stack developer and product builder behind Tikiti\'s core features. Kofi loves demoing products and helping organizers get the most out of event technology.',
          linkedInUrl: 'https://linkedin.com/in/kofidarko',
          organizationId: orgId,
          status: 'active',
          createdBy: userId,
        },
        {
          name: 'Fatima Bello',
          email: 'fatima.bello@demo.tikiti.com',
          jobTitle: 'Data & Analytics Lead',
          company: 'InsightHub',
          bio: 'Data scientist turned event analytics specialist. Fatima helps event organizers make data-driven decisions to improve attendee experiences and maximize ROI.',
          linkedInUrl: 'https://linkedin.com/in/fatimabello',
          organizationId: orgId,
          status: 'active',
          createdBy: userId,
        },
      ];

      const speakers: Speaker[] = [];
      for (const sd of speakersData) {
        const s = await speakerService.create(sd);
        speakers.push(s);
      }
      updateStep(0, { status: 'done', detail: `${speakers.length} speakers created` });

      // ── Step 2: Create Event ────────────────────────────
      updateStep(1, { status: 'running' });

      const [kwame, ama, kofi, fatima] = speakers;

      // Program sessions
      const sessions: ProgramSession[] = [
        // Day 1
        {
          id: 'day1-keynote',
          title: 'Opening Keynote: The Future of Events in Africa',
          description: 'Kwame shares his vision for how technology is transforming the events industry across the continent, with real case studies and data.',
          startTime: '09:00',
          endTime: '09:30',
          date: '2026-04-15',
          type: 'keynote',
          speakers: [{ speakerId: kwame.id!, role: 'speaker' }],
        },
        {
          id: 'day1-session1',
          title: 'Registration & Check-in Best Practices',
          description: 'Learn how to set up seamless registration flows, customize forms, and use QR check-in to eliminate queues at your events.',
          startTime: '09:30',
          endTime: '10:00',
          date: '2026-04-15',
          type: 'session',
          speakers: [{ speakerId: ama.id!, role: 'speaker' }],
        },
        {
          id: 'day1-break1',
          title: 'Tea Break',
          startTime: '10:00',
          endTime: '10:30',
          date: '2026-04-15',
          type: 'break',
        },
        {
          id: 'day1-workshop1',
          title: 'Workshop: Building Your First Event',
          description: 'Hands-on workshop where you create an event from scratch — set up tickets, customize the registration form, add an agenda, and invite speakers.',
          startTime: '10:30',
          endTime: '11:30',
          date: '2026-04-15',
          type: 'workshop',
          speakers: [{ speakerId: kofi.id!, role: 'speaker' }],
        },
        {
          id: 'day1-panel',
          title: 'Panel: Ticketing Strategies That Work',
          description: 'Industry experts discuss pricing models, early-bird strategies, group discounts, and how to maximize ticket sales for different event types.',
          startTime: '11:30',
          endTime: '12:30',
          date: '2026-04-15',
          type: 'panel',
          speakers: [
            { speakerId: kwame.id!, role: 'moderator' },
            { speakerId: ama.id!, role: 'panelist' },
            { speakerId: fatima.id!, role: 'panelist' },
          ],
        },
        {
          id: 'day1-networking',
          title: 'Lunch & Networking',
          description: 'Connect with fellow event professionals over lunch. Exchange ideas, share experiences, and build lasting relationships.',
          startTime: '12:30',
          endTime: '13:30',
          date: '2026-04-15',
          type: 'networking',
        },
        {
          id: 'day1-session2',
          title: 'Analytics Deep Dive',
          description: 'Discover how to use event data to understand your audience, track engagement, and make smarter decisions for future events.',
          startTime: '14:00',
          endTime: '15:00',
          date: '2026-04-15',
          type: 'session',
          speakers: [{ speakerId: fatima.id!, role: 'speaker' }],
        },
        {
          id: 'day1-workshop2',
          title: 'Live QR Check-in Demo',
          description: 'See Tikiti\'s QR check-in system in action. Practice scanning attendees, handling edge cases, and monitoring real-time check-in stats.',
          startTime: '15:00',
          endTime: '16:00',
          date: '2026-04-15',
          type: 'workshop',
          speakers: [{ speakerId: kofi.id!, role: 'speaker' }],
        },
        // Day 2
        {
          id: 'day2-keynote',
          title: 'Scaling Events to 10,000+ Attendees',
          description: 'Lessons learned from organizing Africa\'s largest tech conferences. Kwame covers logistics, technology stack, team structure, and crisis management.',
          startTime: '10:00',
          endTime: '10:45',
          date: '2026-04-16',
          type: 'keynote',
          speakers: [{ speakerId: kwame.id!, role: 'speaker' }],
        },
        {
          id: 'day2-break',
          title: 'Coffee Break',
          startTime: '10:45',
          endTime: '11:00',
          date: '2026-04-16',
          type: 'break',
        },
        {
          id: 'day2-workshop',
          title: 'Multi-Day Event Planning Masterclass',
          description: 'Step-by-step guide to planning multi-day events: cohort scheduling, resource allocation, attendee communication, and day-of coordination.',
          startTime: '11:00',
          endTime: '12:00',
          date: '2026-04-16',
          type: 'workshop',
          speakers: [{ speakerId: ama.id!, role: 'speaker' }],
        },
        {
          id: 'day2-session',
          title: 'Speaker Management & Engagement Tools',
          description: 'How to use Tikiti to invite speakers, manage their profiles, coordinate sessions, and engage your audience with polls and surveys.',
          startTime: '12:00',
          endTime: '13:00',
          date: '2026-04-16',
          type: 'session',
          speakers: [{ speakerId: fatima.id!, role: 'speaker' }],
        },
        {
          id: 'day2-closing',
          title: 'Closing Ceremony & Q&A',
          description: 'Wrap-up session with key takeaways, next steps, and an open Q&A. Ask anything about Tikiti and event management!',
          startTime: '13:00',
          endTime: '13:30',
          date: '2026-04-16',
          type: 'session',
          speakers: [{ speakerId: kofi.id!, role: 'host' }],
        },
      ];

      // Cohorts
      const cohort1Id = `cohort-${Date.now()}-morning`;
      const cohort2Id = `cohort-${Date.now()}-afternoon`;
      const cohort3Id = `cohort-${Date.now()}-day2`;

      const cohorts: Record<string, Cohort> = {
        [cohort1Id]: {
          id: cohort1Id,
          name: 'Morning Intensive',
          description: 'Hands-on morning sessions focused on getting started with event management. Perfect for beginners.',
          startDate: '2026-04-15',
          time: '09:00',
          capacity: 100,
          soldTickets: 0,
          availableTickets: 100,
          status: 'active',
        },
        [cohort2Id]: {
          id: cohort2Id,
          name: 'Afternoon Workshop',
          description: 'Deep-dive afternoon workshops on advanced features, analytics, and QR check-in. For experienced organizers.',
          startDate: '2026-04-15',
          time: '14:00',
          capacity: 150,
          soldTickets: 0,
          availableTickets: 150,
          status: 'active',
        },
        [cohort3Id]: {
          id: cohort3Id,
          name: 'Day 2 Masterclass',
          description: 'Full masterclass covering scaling events, multi-day planning, speaker management, and engagement tools.',
          startDate: '2026-04-16',
          time: '10:00',
          capacity: 100,
          soldTickets: 0,
          availableTickets: 100,
          status: 'active',
        },
      };

      // Registration form
      const registrationForm = {
        fields: [
          { id: 'firstName', type: 'text' as const, label: 'First Name', placeholder: 'Enter your first name', required: true },
          { id: 'lastName', type: 'text' as const, label: 'Last Name', placeholder: 'Enter your last name', required: true },
          { id: 'email', type: 'email' as const, label: 'Email Address', placeholder: 'Enter your email address', required: true },
          { id: 'phone', type: 'phone' as const, label: 'Phone Number', placeholder: 'Enter your phone number', required: true },
          { id: 'gender', type: 'dropdown' as const, label: 'Gender', placeholder: 'Select gender', required: true, options: ['Male', 'Female', 'Other'] },
          { id: 'company', type: 'text' as const, label: 'Company / Organization', placeholder: 'Where do you work?', required: false },
          { id: 'jobTitle', type: 'text' as const, label: 'Job Title', placeholder: 'What is your role?', required: false },
          { id: 'referral', type: 'dropdown' as const, label: 'How did you hear about us?', placeholder: 'Select an option', required: false, options: ['Social Media', 'Friend/Colleague', 'Email', 'Website', 'Other'] },
          { id: 'dietary', type: 'radio' as const, label: 'Dietary Requirements', required: false, options: ['None', 'Vegetarian', 'Vegan', 'Halal', 'Gluten-Free'] },
          { id: 'accessibility', type: 'checkbox' as const, label: 'I need accessibility accommodations', required: false },
        ],
        consentText: 'By registering, you agree to receive event updates and communications from Tikiti. Your data will be handled in accordance with our privacy policy.',
        consentRequired: true,
      };

      // Event data
      const eventData: Partial<Event> = {
        name: 'Tikiti Demo Day: Explore All Features',
        description:
          'Welcome to the Tikiti Demo Event! This is a practice event designed to help you explore all the features of the Tikiti app.\n\nTry registering for a cohort, checking in with QR codes, viewing the agenda, exploring speaker profiles, and more. Feel free to experiment — this is your sandbox!\n\nThis 2-day hybrid event showcases:\n• Multi-day scheduling with different sessions each day\n• Cohort selection (Morning, Afternoon, or Day 2)\n• Full speaker profiles with bios and LinkedIn links\n• Custom registration form with various field types\n• QR code check-in system\n• Post-event feedback survey\n• Virtual attendance via Google Meet',
        category: 'Conference',
        venueType: 'hybrid',
        location: 'Tikiti HQ, 14 Kanda Highway, Accra',
        address: '14 Kanda Highway, North Ridge, Accra, Ghana',
        coordinates: { lat: 5.5713, lng: -0.2006 },
        meetingLink: 'https://meet.google.com/tikiti-demo-day',
        meetingPlatform: 'google_meet',
        date: '2026-04-15',
        time: '09:00',
        startDate: '2026-04-15',
        endDate: '2026-04-16',
        type: 'free',
        totalTickets: 500,
        availableTickets: 500,
        soldTickets: 0,
        status: 'draft',
        isActive: true,
        hasCohorts: true,
        cohorts,
        program: { sessions },
        registrationForm,
        organizerId: userId,
        organizationId: orgId,
        organizerName: user.displayName || 'Tikiti Admin',
        organizerEmail: user.email || '',
      };

      const createdEvent = await eventService.create(eventData, userId, orgId);
      updateStep(1, { status: 'done', detail: `Event ID: ${createdEvent.id}` });

      // ── Step 3: Create Survey ────────────────────────────
      updateStep(2, { status: 'running' });

      const surveyQuestions: SurveyQuestion[] = [
        {
          id: 'q-rating',
          question: 'How would you rate the overall event?',
          type: 'rating',
          required: true,
          min: 1,
          max: 5,
        },
        {
          id: 'q-favorite',
          question: 'Which session did you enjoy the most?',
          type: 'multiple_choice',
          required: true,
          options: [
            'Opening Keynote',
            'Registration Best Practices',
            'Building Your First Event Workshop',
            'Ticketing Panel',
            'Analytics Deep Dive',
            'QR Check-in Demo',
            'Scaling Events Keynote',
            'Multi-Day Planning Masterclass',
          ],
        },
        {
          id: 'q-nps',
          question: 'How likely are you to recommend Tikiti to a friend or colleague?',
          type: 'nps',
          required: true,
          min: 0,
          max: 10,
          labels: { min: 'Not likely at all', max: 'Extremely likely' },
        },
        {
          id: 'q-improve',
          question: 'What could we improve for next time?',
          type: 'text',
          required: false,
        },
        {
          id: 'q-attend-again',
          question: 'Would you attend another Tikiti event?',
          type: 'multiple_choice',
          required: true,
          options: ['Definitely', 'Probably', 'Not sure', 'Unlikely'],
        },
      ];

      await surveyService.createSurvey(createdEvent.id!, {
        title: 'How was your Tikiti Demo Day experience?',
        description: 'Help us improve future events by sharing your feedback. This only takes 2 minutes!',
        questions: surveyQuestions,
        status: 'active',
        eventId: createdEvent.id!,
        settings: {
          allowAnonymous: false,
          oneResponsePerUser: true,
          showProgress: true,
        },
      });
      updateStep(2, { status: 'done', detail: '5 survey questions created' });

      // ── Step 4: Publish event ────────────────────────────
      updateStep(3, { status: 'running' });
      await eventService.update(createdEvent.id!, { status: 'published' });
      updateStep(3, { status: 'done', detail: 'Event is now live!' });

      setEventId(createdEvent.id!);
    } catch (err: any) {
      console.error('Seed error:', err);
      setError(err.message || 'Something went wrong');
      // Mark current running step as error
      setSteps(prev =>
        prev.map(s => (s.status === 'running' ? { ...s, status: 'error' } : s))
      );
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Seed Demo Event</h1>
        <p className="text-muted-foreground mt-1">
          Create a comprehensive demo event with all Tikiti features — multi-day schedule, cohorts,
          speakers, custom registration, and post-event survey.
        </p>
      </div>

      {/* Org picker for admin accounts without an org */}
      {!currentOrganization && !loadingOrgs && allOrgs.length === 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-yellow-600" />
              <p className="text-sm text-yellow-800">
                No organizations found. Create an organization from the{' '}
                <Link href="/dashboard" className="underline font-medium">
                  organizer dashboard
                </Link>{' '}
                first, then come back here.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {!currentOrganization && allOrgs.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="w-5 h-5" />
              Select Organization
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              Choose which organization to create the demo event under:
            </p>
            <div className="space-y-2">
              {allOrgs.map(org => (
                <label
                  key={org.id}
                  className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedOrgId === org.id ? 'border-primary bg-primary/5' : 'border-gray-200 hover:bg-gray-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="org"
                    checked={selectedOrgId === org.id}
                    onChange={() => setSelectedOrgId(org.id)}
                    className="accent-primary"
                  />
                  <div>
                    <p className="font-medium text-sm">{org.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {org.ownerEmail} &middot; {org.eventsCount} events &middot; {org.membersCount} members
                    </p>
                  </div>
                </label>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeOrgId && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">What will be created</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <p>
              <strong>Organization:</strong> {currentOrganization?.name || allOrgs.find(o => o.id === selectedOrgId)?.name}
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium mb-1">4 Speakers</p>
                <p className="text-muted-foreground text-xs">
                  Kwame Asante, Ama Mensah, Kofi Darko, Fatima Bello — with full profiles and LinkedIn links
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium mb-1">1 Event (2-Day Hybrid)</p>
                <p className="text-muted-foreground text-xs">
                  April 15-16, 2026 — in-person at Accra + Google Meet virtual link
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium mb-1">3 Cohorts</p>
                <p className="text-muted-foreground text-xs">
                  Morning Intensive (100), Afternoon Workshop (150), Day 2 Masterclass (100)
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium mb-1">13 Agenda Sessions</p>
                <p className="text-muted-foreground text-xs">
                  Keynotes, workshops, panels, networking breaks — across both days
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium mb-1">10 Registration Fields</p>
                <p className="text-muted-foreground text-xs">
                  Text, email, phone, dropdown, radio, checkbox — with consent
                </p>
              </div>
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="font-medium mb-1">1 Post-Event Survey</p>
                <p className="text-muted-foreground text-xs">
                  5 questions: rating, NPS, multiple choice, free text
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress */}
      {steps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {steps.map((step, i) => (
              <div key={i} className="flex items-center gap-3">
                {step.status === 'pending' && (
                  <div className="w-5 h-5 rounded-full border-2 border-gray-300" />
                )}
                {step.status === 'running' && (
                  <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                )}
                {step.status === 'done' && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
                {step.status === 'error' && (
                  <AlertCircle className="w-5 h-5 text-red-500" />
                )}
                <div>
                  <p className="text-sm font-medium">{step.label}</p>
                  {step.detail && (
                    <p className="text-xs text-muted-foreground">{step.detail}</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="w-5 h-5 text-red-600" />
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Success */}
      {eventId && (
        <Card className="border-green-200 bg-green-50">
          <CardContent className="pt-6 space-y-3">
            <div className="flex items-center gap-3">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <p className="text-sm text-green-800 font-medium">
                Demo event created and published successfully!
              </p>
            </div>
            <div className="flex gap-3">
              <Link href={`/dashboard/events/${eventId}`}>
                <Button variant="outline" size="sm" className="gap-2">
                  <ExternalLink className="w-4 h-4" />
                  View in Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action */}
      <Button
        onClick={handleSeed}
        disabled={running || !activeOrgId}
        size="lg"
        className="gap-2"
      >
        {running ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" />
            Creating demo event...
          </>
        ) : eventId ? (
          <>
            <Rocket className="w-4 h-4" />
            Create Another Demo Event
          </>
        ) : (
          <>
            <Rocket className="w-4 h-4" />
            Create Demo Event
          </>
        )}
      </Button>
    </div>
  );
}
