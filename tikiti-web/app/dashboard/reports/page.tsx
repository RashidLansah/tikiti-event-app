'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { attendeesService, Attendee } from '@/lib/services/attendeesService';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  FileText,
  Users,
  Ticket,
  DollarSign,
  BarChart3,
  Calendar,
  RefreshCw,
  ArrowRight,
  PieChart,
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
} from 'recharts';
import { ReportsSkeleton } from '@/components/ui/Skeleton';

const COLORS = ['#333', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

interface EventWithStats extends Event {
  attendeeCount: number;
  confirmedCount: number;
  revenue: number;
}

export default function ReportsPage() {
  const { currentOrganization } = useAuth();
  const [loading, setLoading] = useState(true);
  const [events, setEvents] = useState<EventWithStats[]>([]);
  const [allAttendees, setAllAttendees] = useState<Attendee[]>([]);
  const [selectedEventId, setSelectedEventId] = useState<string>('all');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadData();
    }
  }, [currentOrganization?.id]);

  const loadData = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    setError(null);

    try {
      const orgEvents = await eventService.getByOrganization(currentOrganization.id);
      const attendees = await attendeesService.getByOrganization(currentOrganization.id);
      setAllAttendees(attendees);

      const eventsWithStats: EventWithStats[] = orgEvents.map((event) => {
        const eventAttendees = attendees.filter((a) => a.eventId === event.id);
        const confirmedAttendees = eventAttendees.filter((a) => a.status === 'confirmed');
        const revenue = event.type === 'paid' && event.price
          ? confirmedAttendees.length * (event.price || 0)
          : 0;

        return {
          ...event,
          attendeeCount: eventAttendees.length,
          confirmedCount: confirmedAttendees.length,
          revenue,
        };
      });

      setEvents(eventsWithStats);
    } catch (err: any) {
      console.error('Error loading data:', err);
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredAttendees = selectedEventId === 'all'
    ? allAttendees
    : allAttendees.filter((a) => a.eventId === selectedEventId);

  const filteredEvents = selectedEventId === 'all'
    ? events
    : events.filter((e) => e.id === selectedEventId);

  const totalAttendees = filteredAttendees.length;
  const confirmedAttendees = filteredAttendees.filter((a) => a.status === 'confirmed').length;
  const cancelledAttendees = filteredAttendees.filter((a) => a.status === 'cancelled').length;
  const totalTicketsSold = filteredEvents.reduce((sum, e) => sum + (e.soldTickets || 0), 0);
  const totalCapacity = filteredEvents.reduce((sum, e) => sum + (e.totalTickets || 0), 0);
  const totalRevenue = filteredEvents.reduce((sum, e) => sum + e.revenue, 0);

  const eventPerformanceData = events.map((e) => ({
    name: e.name.length > 20 ? e.name.substring(0, 20) + '...' : e.name,
    attendees: e.attendeeCount,
    confirmed: e.confirmedCount,
    capacity: e.totalTickets,
  }));

  const statusBreakdown = [
    { name: 'Confirmed', value: confirmedAttendees },
    { name: 'Cancelled', value: cancelledAttendees },
    { name: 'Waitlisted', value: filteredAttendees.filter((a) => a.status === 'waitlisted').length },
  ].filter((s) => s.value > 0);

  const getStatusStyles = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      published: { bg: 'bg-green-100', text: 'text-green-800' },
      draft: { bg: 'bg-[#f0f0f0]', text: 'text-[#333]' },
      archived: { bg: 'bg-[#f0f0f0]', text: 'text-[#86868b]' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
    };
    return styles[status] || styles.draft;
  };

  if (loading) {
    return <ReportsSkeleton />;
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-2xl font-semibold text-[#333]">Error Loading Reports</h3>
          <p className="mt-2 text-base text-[#333]">{error}</p>
          <button
            onClick={loadData}
            className="mt-6 inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="h-full flex items-center justify-center" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div className="text-center">
          <FileText className="mx-auto h-16 w-16 text-gray-300" />
          <h3 className="mt-4 text-2xl font-semibold text-[#333]">No Events Yet</h3>
          <p className="mt-2 text-base text-[#333]">Create events to see reports</p>
          <Link
            href="/dashboard/events/new"
            className="mt-6 inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Create Event
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-[#333]">Reports & Analytics</h1>
          <p className="text-base font-semibold text-[#333]">
            Overview of events performance
          </p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={selectedEventId} onValueChange={setSelectedEventId}>
            <SelectTrigger className="w-56 h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] text-base">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent className="rounded-[16px]">
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id!}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 bg-[#f0f0f0] text-[#333] px-6 py-3 rounded-full text-base font-semibold hover:bg-[#e8e8e8] transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </button>
        </div>
      </div>

      {/* Key Metrics - Large format */}
      <div className="grid gap-5 md:grid-cols-4">
        {/* Total Events */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Total Events</p>
              <Calendar className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">{filteredEvents.length}</p>
            <p className="text-base text-[#333]">{events.filter((e) => e.status === 'published').length} published</p>
          </div>
        </div>

        {/* Total Attendees */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Attendees</p>
              <Users className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">{totalAttendees}</p>
            <p className="text-base text-[#333]">{confirmedAttendees} confirmed</p>
          </div>
        </div>

        {/* Ticket Sales */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Ticket Sales</p>
              <Ticket className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">
              {totalCapacity > 0 ? Math.round((totalTicketsSold / totalCapacity) * 100) : 0}%
            </p>
            <div className="w-full bg-[#f0f0f0] rounded-full h-3">
              <div
                className="bg-[#333] h-3 rounded-full transition-all"
                style={{ width: `${totalCapacity > 0 ? (totalTicketsSold / totalCapacity) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>

        {/* Total Revenue */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Revenue</p>
              <DollarSign className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">₵{totalRevenue.toFixed(0)}</p>
            <p className="text-base text-[#333]">{events.filter((e) => e.type === 'paid').length} paid events</p>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid gap-5 md:grid-cols-2">
        {/* Event Performance */}
        <div className="bg-white border border-black/10 rounded-[24px] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
              <BarChart3 className="w-6 h-6 text-[#333]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#333]">Event Performance</h2>
              <p className="text-sm text-[#86868b]">Confirmed vs capacity</p>
            </div>
          </div>
          {eventPerformanceData.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={eventPerformanceData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis type="number" tick={{ fontSize: 12, fill: '#333' }} />
                <YAxis dataKey="name" type="category" width={100} tick={{ fontSize: 12, fill: '#333' }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    padding: '12px'
                  }}
                />
                <Bar dataKey="confirmed" name="Confirmed" fill="#333" radius={[0, 8, 8, 0]} />
                <Bar dataKey="capacity" name="Capacity" fill="#f0f0f0" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-base text-[#86868b]">
              No data available
            </div>
          )}
        </div>

        {/* Status Breakdown */}
        <div className="bg-white border border-black/10 rounded-[24px] p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
              <PieChart className="w-6 h-6 text-[#333]" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[#333]">Attendee Status</h2>
              <p className="text-sm text-[#86868b]">Registration breakdown</p>
            </div>
          </div>
          {statusBreakdown.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <RechartsPieChart>
                <Pie
                  data={statusBreakdown}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'white',
                    border: '1px solid rgba(0,0,0,0.1)',
                    borderRadius: '16px',
                    padding: '12px'
                  }}
                />
              </RechartsPieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[240px] text-base text-[#86868b]">
              No data available
            </div>
          )}
        </div>
      </div>

      {/* Event List with Reports */}
      <div className="bg-white border border-black/10 rounded-[24px] overflow-hidden">
        <div className="px-6 py-5 border-b border-black/10">
          <h2 className="text-xl font-semibold text-[#333]">Event Reports</h2>
          <p className="text-base text-[#333]">Detailed breakdown by event</p>
        </div>
        <div className="divide-y divide-black/5">
          {events.map((event) => {
            const statusStyle = getStatusStyles(event.status);
            return (
              <div
                key={event.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-[#333] truncate">{event.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold shrink-0 ${statusStyle.bg} ${statusStyle.text}`}>
                      {event.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-sm text-[#86868b]">
                    <span className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      {event.confirmedCount} attendees
                    </span>
                    <span className="flex items-center gap-2">
                      <Ticket className="h-4 w-4" />
                      {event.soldTickets || 0}/{event.totalTickets} tickets
                    </span>
                    {event.type === 'paid' && (
                      <span className="flex items-center gap-2">
                        <DollarSign className="h-4 w-4" />
                        ₵{event.revenue.toFixed(0)}
                      </span>
                    )}
                  </div>
                </div>
                <Link
                  href={`/dashboard/events/${event.id}/reports`}
                  className="inline-flex items-center gap-2 bg-[#f0f0f0] text-[#333] px-5 py-2.5 rounded-full text-base font-semibold hover:bg-[#e8e8e8] transition-colors shrink-0"
                >
                  View Report
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
