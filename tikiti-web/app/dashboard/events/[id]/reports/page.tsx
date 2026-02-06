'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { attendeesService, Attendee } from '@/lib/services/attendeesService';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  ArrowLeft,
  FileText,
  Users,
  Ticket,
  DollarSign,
  TrendingUp,
  Download,
  Sparkles,
  Loader2,
  BarChart3,
  PieChart,
  Calendar,
  RefreshCw,
  FileDown,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ReportExporter } from '@/components/reports/ReportExporter';

const COLORS = ['#10b981', '#ef4444', '#f59e0b', '#6366f1', '#8b5cf6'];

interface ReportData {
  event: Event;
  attendees: Attendee[];
  registrationsByDay: { date: string; count: number }[];
  statusBreakdown: { name: string; value: number }[];
  engagementData: {
    quizzes: { total: number; responses: number; avgScore?: number };
    polls: { total: number; responses: number };
  };
  surveyData: {
    total: number;
    responses: number;
    avgNPS?: number;
  };
}

export default function EventReportsPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { currentOrganization } = useAuth();

  const [loading, setLoading] = useState(true);
  const [generatingReport, setGeneratingReport] = useState(false);
  const [reportData, setReportData] = useState<ReportData | null>(null);
  const [aiReport, setAiReport] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (eventId) {
      loadReportData();
    }
  }, [eventId]);

  const loadReportData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load event
      const event = await eventService.getById(eventId);
      if (!event) {
        setError('Event not found');
        return;
      }

      // Load attendees
      const attendees = await attendeesService.getByEvent(eventId);

      // Calculate registrations by day
      const regByDay: Record<string, number> = {};
      attendees.forEach((a) => {
        const date = a.createdAt?.toDate?.()
          ? a.createdAt.toDate().toISOString().split('T')[0]
          : a.createdAt
          ? new Date(a.createdAt).toISOString().split('T')[0]
          : null;
        if (date) {
          regByDay[date] = (regByDay[date] || 0) + 1;
        }
      });

      const registrationsByDay = Object.entries(regByDay)
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

      // Status breakdown
      const statusCounts = {
        confirmed: attendees.filter((a) => a.status === 'confirmed').length,
        cancelled: attendees.filter((a) => a.status === 'cancelled').length,
        waitlisted: attendees.filter((a) => a.status === 'waitlisted').length,
      };

      const statusBreakdown = [
        { name: 'Confirmed', value: statusCounts.confirmed },
        { name: 'Cancelled', value: statusCounts.cancelled },
        { name: 'Waitlisted', value: statusCounts.waitlisted },
      ].filter((s) => s.value > 0);

      // Load engagement data (quizzes & polls)
      let quizzesTotal = 0;
      let quizzesResponses = 0;
      let pollsTotal = 0;
      let pollsResponses = 0;

      try {
        const engagementRef = collection(db, 'events', eventId, 'engagement');
        const engagementSnap = await getDocs(engagementRef);

        for (const doc of engagementSnap.docs) {
          const data = doc.data();
          if (data.type === 'quiz') {
            quizzesTotal++;
            // Count responses
            const responsesRef = collection(db, 'events', eventId, 'engagement', doc.id, 'responses');
            const responsesSnap = await getDocs(responsesRef);
            quizzesResponses += responsesSnap.size;
          } else if (data.type === 'poll') {
            pollsTotal++;
            const responsesRef = collection(db, 'events', eventId, 'engagement', doc.id, 'responses');
            const responsesSnap = await getDocs(responsesRef);
            pollsResponses += responsesSnap.size;
          }
        }
      } catch (e) {
        console.log('No engagement data');
      }

      // Load survey data
      let surveysTotal = 0;
      let surveysResponses = 0;

      try {
        const surveysRef = collection(db, 'events', eventId, 'surveys');
        const surveysSnap = await getDocs(surveysRef);
        surveysTotal = surveysSnap.size;

        for (const doc of surveysSnap.docs) {
          const responsesRef = collection(db, 'events', eventId, 'surveys', doc.id, 'responses');
          const responsesSnap = await getDocs(responsesRef);
          surveysResponses += responsesSnap.size;
        }
      } catch (e) {
        console.log('No survey data');
      }

      setReportData({
        event,
        attendees,
        registrationsByDay,
        statusBreakdown,
        engagementData: {
          quizzes: { total: quizzesTotal, responses: quizzesResponses },
          polls: { total: pollsTotal, responses: pollsResponses },
        },
        surveyData: {
          total: surveysTotal,
          responses: surveysResponses,
        },
      });
    } catch (err: any) {
      console.error('Error loading report data:', err);
      setError(err.message || 'Failed to load report data');
    } finally {
      setLoading(false);
    }
  };

  const generateAIReport = async () => {
    if (!reportData) return;

    setGeneratingReport(true);
    setAiReport(null);

    try {
      const { event, attendees, registrationsByDay, engagementData, surveyData } = reportData;

      const revenue = event.type === 'paid' && event.price
        ? {
            total: attendees.filter((a) => a.status === 'confirmed').length * (event.price || 0),
            average: event.price || 0,
          }
        : undefined;

      const response = await fetch('/api/ai/report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reportData: {
            event: {
              name: event.name,
              description: event.description,
              date: event.date,
              time: event.time,
              location: event.location,
              category: event.category,
              type: event.type,
              price: event.price,
              totalTickets: event.totalTickets,
              soldTickets: event.soldTickets,
              availableTickets: event.availableTickets,
              status: event.status,
            },
            attendees: {
              total: attendees.length,
              confirmed: attendees.filter((a) => a.status === 'confirmed').length,
              cancelled: attendees.filter((a) => a.status === 'cancelled').length,
              waitlisted: attendees.filter((a) => a.status === 'waitlisted').length,
              registrationsByDay,
              ticketTypes: [
                { type: 'RSVP', count: attendees.filter((a) => a.registrationType === 'rsvp').length },
                { type: 'Paid', count: attendees.filter((a) => a.registrationType === 'paid').length },
              ],
            },
            engagement: engagementData.quizzes.total > 0 || engagementData.polls.total > 0
              ? {
                  quizzes: engagementData.quizzes,
                  polls: engagementData.polls,
                }
              : undefined,
            surveys: surveyData.total > 0
              ? {
                  total: surveyData.total,
                  totalResponses: surveyData.responses,
                }
              : undefined,
            revenue,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to generate report');
      }

      setAiReport(data.report);
    } catch (err: any) {
      console.error('Error generating AI report:', err);
      setError(err.message);
    } finally {
      setGeneratingReport(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p className="mt-4 text-gray-600">Loading report data...</p>
        </div>
      </div>
    );
  }

  if (error && !reportData) {
    return (
      <div className="text-center py-12">
        <FileText className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-4 text-lg font-semibold">Error Loading Report</h3>
        <p className="mt-2 text-sm text-gray-500">{error}</p>
        <Button className="mt-4" onClick={() => router.back()}>
          Go Back
        </Button>
      </div>
    );
  }

  if (!reportData) return null;

  const { event, attendees, registrationsByDay, statusBreakdown, engagementData, surveyData } = reportData;

  const ticketSalesPercent = event.totalTickets > 0
    ? Math.round((event.soldTickets / event.totalTickets) * 100)
    : 0;

  const totalRevenue = event.type === 'paid' && event.price
    ? attendees.filter((a) => a.status === 'confirmed').length * (event.price || 0)
    : 0;

  // Prepare data for the exporter
  const exporterReportData = {
    title: `${event.name} - Event Report`,
    subtitle: `Generated on ${new Date().toLocaleDateString()}`,
    date: new Date().toISOString(),
    sections: [],
    images: [],
    metrics: [
      { label: 'Total Attendees', value: attendees.length.toString() },
      { label: 'Confirmed', value: attendees.filter((a) => a.status === 'confirmed').length.toString() },
      { label: 'Ticket Sales', value: `${ticketSalesPercent}%` },
      { label: event.type === 'paid' ? 'Revenue' : 'Registrations', value: event.type === 'paid' ? `₵${totalRevenue.toFixed(2)}` : event.soldTickets.toString() },
      { label: 'Engagement', value: (engagementData.quizzes.responses + engagementData.polls.responses + surveyData.responses).toString() },
      { label: 'Surveys', value: surveyData.total.toString() },
    ],
    charts: {
      registrationData: registrationsByDay,
      statusData: statusBreakdown,
    },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href={`/dashboard/events/${eventId}`}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Event Reports</h1>
            <p className="text-gray-600 mt-1">{event.name}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadReportData}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Refresh Data
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">
            <BarChart3 className="mr-2 h-4 w-4" />
            Overview
          </TabsTrigger>
          <TabsTrigger value="ai-report">
            <Sparkles className="mr-2 h-4 w-4" />
            AI Report
          </TabsTrigger>
          <TabsTrigger value="export">
            <FileDown className="mr-2 h-4 w-4" />
            Export
          </TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
                <Users className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{attendees.length}</div>
                <p className="text-xs text-gray-500 mt-1">
                  {attendees.filter((a) => a.status === 'confirmed').length} confirmed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
                <Ticket className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{ticketSalesPercent}%</div>
                <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                  <div
                    className="bg-primary h-2 rounded-full"
                    style={{ width: `${ticketSalesPercent}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {event.soldTickets} / {event.totalTickets} tickets
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">
                  {event.type === 'paid' ? 'Revenue' : 'Registrations'}
                </CardTitle>
                {event.type === 'paid' ? (
                  <DollarSign className="h-4 w-4 text-gray-500" />
                ) : (
                  <TrendingUp className="h-4 w-4 text-gray-500" />
                )}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {event.type === 'paid' ? `₵${totalRevenue.toFixed(2)}` : event.soldTickets}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {event.type === 'paid'
                    ? `₵${event.price} per ticket`
                    : 'Total registrations'}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Engagement</CardTitle>
                <BarChart3 className="h-4 w-4 text-gray-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {engagementData.quizzes.responses + engagementData.polls.responses + surveyData.responses}
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Total responses across all activities
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Charts Row */}
          <div className="grid gap-6 md:grid-cols-2">
            {/* Registration Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Registration Timeline
                </CardTitle>
                <CardDescription>Daily registration trend</CardDescription>
              </CardHeader>
              <CardContent>
                {registrationsByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={registrationsByDay}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis
                        dataKey="date"
                        tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        fontSize={12}
                      />
                      <YAxis fontSize={12} />
                      <Tooltip
                        labelFormatter={(value) => new Date(value).toLocaleDateString()}
                        formatter={(value: number) => [value, 'Registrations']}
                      />
                      <Line
                        type="monotone"
                        dataKey="count"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: '#10b981' }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-gray-500">
                    No registration data available
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Status Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Attendee Status
                </CardTitle>
                <CardDescription>Registration status breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                {statusBreakdown.length > 0 ? (
                  <ResponsiveContainer width="100%" height={250}>
                    <RechartsPieChart>
                      <Pie
                        data={statusBreakdown}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {statusBreakdown.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                      <Legend />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-[250px] text-gray-500">
                    No attendee data available
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Engagement Stats */}
          {(engagementData.quizzes.total > 0 || engagementData.polls.total > 0 || surveyData.total > 0) && (
            <Card>
              <CardHeader>
                <CardTitle>Engagement Overview</CardTitle>
                <CardDescription>Quiz, poll, and survey participation</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 md:grid-cols-3">
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Quizzes</div>
                    <div className="text-2xl font-bold mt-1">{engagementData.quizzes.total}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {engagementData.quizzes.responses} responses
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Polls</div>
                    <div className="text-2xl font-bold mt-1">{engagementData.polls.total}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {engagementData.polls.responses} responses
                    </div>
                  </div>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="text-sm font-medium text-gray-500">Surveys</div>
                    <div className="text-2xl font-bold mt-1">{surveyData.total}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {surveyData.responses} responses
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* AI Report Tab */}
        <TabsContent value="ai-report" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-purple-500" />
                    AI-Generated Report
                  </CardTitle>
                  <CardDescription>
                    Get in-depth analysis and recommendations powered by AI
                  </CardDescription>
                </div>
                <Button onClick={generateAIReport} disabled={generatingReport}>
                  {generatingReport ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-4 w-4" />
                      {aiReport ? 'Regenerate Report' : 'Generate Report'}
                    </>
                  )}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {aiReport ? (
                <div className="prose prose-sm max-w-none">
                  <div
                    className="whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                      __html: aiReport
                        .replace(/## (.*)/g, '<h2 class="text-xl font-bold mt-6 mb-3">$1</h2>')
                        .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
                        .replace(/- (.*)/g, '<li class="ml-4">$1</li>')
                        .replace(/\n\n/g, '<br/><br/>')
                    }}
                  />
                </div>
              ) : (
                <div className="text-center py-12 text-gray-500">
                  <FileText className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p>Click &quot;Generate Report&quot; to create an AI-powered analysis of your event</p>
                  <p className="text-sm mt-2">
                    The report will include insights on attendance, engagement, and recommendations
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Export Tab */}
        <TabsContent value="export" className="space-y-6">
          {aiReport ? (
            <ReportExporter
              eventName={event.name}
              initialReport={aiReport}
              reportData={exporterReportData}
            />
          ) : (
            <Card>
              <CardContent className="py-12">
                <div className="text-center text-gray-500">
                  <FileDown className="mx-auto h-12 w-12 text-gray-300 mb-4" />
                  <p className="text-lg font-medium">Generate a Report First</p>
                  <p className="text-sm mt-2">
                    Please go to the &quot;AI Report&quot; tab and generate a report before exporting.
                  </p>
                  <Button className="mt-4" onClick={() => setActiveTab('ai-report')}>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Go to AI Report
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
