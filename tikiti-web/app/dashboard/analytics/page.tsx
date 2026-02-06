'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Ticket,
  Calendar,
  DollarSign,
  Eye,
  Share2,
} from 'lucide-react';

interface AnalyticsData {
  totalEvents: number;
  totalAttendees: number;
  totalRevenue: number;
  totalTicketsSold: number;
  activeEvents: number;
  upcomingEvents: number;
  eventsByStatus: {
    published: number;
    draft: number;
    archived: number;
  };
  eventsByCategory: Record<string, number>;
  recentEvents: Event[];
  topEvents: Array<{
    id: string;
    name: string;
    attendees: number;
    revenue: number;
  }>;
}

export default function AnalyticsPage() {
  const { currentOrganization } = useAuth();
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalEvents: 0,
    totalAttendees: 0,
    totalRevenue: 0,
    totalTicketsSold: 0,
    activeEvents: 0,
    upcomingEvents: 0,
    eventsByStatus: { published: 0, draft: 0, archived: 0 },
    eventsByCategory: {},
    recentEvents: [],
    topEvents: [],
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7days' | '30days' | '90days' | 'all'>('30days');
  const [selectedEvent, setSelectedEvent] = useState<string>('all');

  useEffect(() => {
    if (currentOrganization?.id) {
      loadAnalytics();
    }
  }, [currentOrganization, timeRange, selectedEvent]);

  const loadAnalytics = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      // Load all events for the organization
      const events = await eventService.getByOrganization(currentOrganization.id);
      
      // Filter by time range
      const now = new Date();
      const filteredEvents = events.filter((event) => {
        if (timeRange === 'all') return true;
        
        const eventDate = new Date(event.date);
        const daysDiff = Math.floor((eventDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (timeRange === '7days') return daysDiff <= 7 && daysDiff >= -7;
        if (timeRange === '30days') return daysDiff <= 30 && daysDiff >= -30;
        if (timeRange === '90days') return daysDiff <= 90 && daysDiff >= -90;
        return true;
      });

      // Calculate analytics
      const totalEvents = filteredEvents.length;
      const totalTicketsSold = filteredEvents.reduce(
        (sum, event) => sum + (event.soldTickets || 0),
        0
      );
      const totalRevenue = filteredEvents.reduce(
        (sum, event) => sum + (event.soldTickets || 0) * (event.price || 0),
        0
      );
      
      // Count by status
      const eventsByStatus = {
        published: filteredEvents.filter((e) => e.status === 'published').length,
        draft: filteredEvents.filter((e) => e.status === 'draft').length,
        archived: filteredEvents.filter((e) => e.status === 'archived').length,
      };

      // Count by category
      const eventsByCategory: Record<string, number> = {};
      filteredEvents.forEach((event) => {
        eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
      });

      // Active and upcoming events
      const activeEvents = filteredEvents.filter(
        (e) => e.status === 'published' && new Date(e.date) >= now
      ).length;
      const upcomingEvents = filteredEvents.filter(
        (e) => e.status === 'published' && new Date(e.date) > now
      ).length;

      // Recent events (last 5)
      const recentEvents = [...filteredEvents]
        .sort((a, b) => {
          const dateA = new Date(a.createdAt?.toDate?.() || a.createdAt || 0);
          const dateB = new Date(b.createdAt?.toDate?.() || b.createdAt || 0);
          return dateB.getTime() - dateA.getTime();
        })
        .slice(0, 5);

      // Top events by attendees
      const topEvents = filteredEvents
        .map((event) => ({
          id: event.id!,
          name: event.name,
          attendees: event.soldTickets || 0,
          revenue: (event.soldTickets || 0) * (event.price || 0),
        }))
        .sort((a, b) => b.attendees - a.attendees)
        .slice(0, 5);

      setAnalytics({
        totalEvents,
        totalAttendees: totalTicketsSold, // Using tickets sold as attendee count
        totalRevenue,
        totalTicketsSold,
        activeEvents,
        upcomingEvents,
        eventsByStatus,
        eventsByCategory,
        recentEvents,
        topEvents,
      });
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Analytics</h1>
          <p className="text-gray-600 mt-1">
            Insights and metrics for your events
          </p>
        </div>
        <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Time Range" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="7days">Last 7 days</SelectItem>
            <SelectItem value="30days">Last 30 days</SelectItem>
            <SelectItem value="90days">Last 90 days</SelectItem>
            <SelectItem value="all">All time</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalEvents}</div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.activeEvents} active events
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Attendees</CardTitle>
            <Users className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalAttendees.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">
              {analytics.totalTicketsSold} tickets sold
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(analytics.totalRevenue)}</div>
            <p className="text-xs text-gray-500 mt-1">
              All time earnings
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Upcoming Events</CardTitle>
            <Calendar className="h-4 w-4 text-gray-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.upcomingEvents}</div>
            <p className="text-xs text-gray-500 mt-1">
              Scheduled events
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Events by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Events by Status</CardTitle>
            <CardDescription>Distribution of event statuses</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="default">Published</Badge>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{analytics.eventsByStatus.published}</p>
                  <p className="text-xs text-gray-500">
                    {analytics.totalEvents > 0
                      ? Math.round(
                          (analytics.eventsByStatus.published / analytics.totalEvents) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary">Draft</Badge>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{analytics.eventsByStatus.draft}</p>
                  <p className="text-xs text-gray-500">
                    {analytics.totalEvents > 0
                      ? Math.round(
                          (analytics.eventsByStatus.draft / analytics.totalEvents) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">Archived</Badge>
                </div>
                <div className="text-right">
                  <p className="font-semibold">{analytics.eventsByStatus.archived}</p>
                  <p className="text-xs text-gray-500">
                    {analytics.totalEvents > 0
                      ? Math.round(
                          (analytics.eventsByStatus.archived / analytics.totalEvents) * 100
                        )
                      : 0}
                    %
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Events by Category */}
        <Card>
          <CardHeader>
            <CardTitle>Events by Category</CardTitle>
            <CardDescription>Event distribution by category</CardDescription>
          </CardHeader>
          <CardContent>
            {Object.keys(analytics.eventsByCategory).length === 0 ? (
              <p className="text-sm text-gray-500 text-center py-4">No category data</p>
            ) : (
              <div className="space-y-4">
                {Object.entries(analytics.eventsByCategory)
                  .sort(([, a], [, b]) => b - a)
                  .map(([category, count]) => (
                    <div key={category} className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{category}</span>
                      <div className="text-right">
                        <p className="font-semibold">{count}</p>
                        <p className="text-xs text-gray-500">
                          {analytics.totalEvents > 0
                            ? Math.round((count / analytics.totalEvents) * 100)
                            : 0}
                          %
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Events */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Events</CardTitle>
          <CardDescription>Events with the most attendees</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.topEvents.length === 0 ? (
            <div className="text-center py-8">
              <BarChart3 className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">No event data available</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.topEvents.map((event, index) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold">
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">{event.name}</p>
                      <div className="flex items-center gap-4 mt-1">
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Users className="h-3 w-3" />
                          {event.attendees} attendees
                        </div>
                        {event.revenue > 0 && (
                          <div className="flex items-center gap-1 text-sm text-gray-500">
                            <DollarSign className="h-3 w-3" />
                            {formatCurrency(event.revenue)}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                  <Badge variant="default">Top Event</Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Events */}
      <Card>
        <CardHeader>
          <CardTitle>Recent Events</CardTitle>
          <CardDescription>Latest events created</CardDescription>
        </CardHeader>
        <CardContent>
          {analytics.recentEvents.length === 0 ? (
            <div className="text-center py-8">
              <Calendar className="mx-auto h-12 w-12 text-gray-400" />
              <p className="mt-4 text-sm text-gray-500">No recent events</p>
            </div>
          ) : (
            <div className="space-y-4">
              {analytics.recentEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div>
                    <p className="font-medium">{event.name}</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {event.date} at {event.time}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        event.status === 'published'
                          ? 'default'
                          : event.status === 'draft'
                          ? 'secondary'
                          : 'outline'
                      }
                    >
                      {event.status}
                    </Badge>
                    {event.soldTickets > 0 && (
                      <span className="text-sm text-gray-500">
                        {event.soldTickets} tickets
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
