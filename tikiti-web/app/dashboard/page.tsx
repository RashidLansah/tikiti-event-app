'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { attendeesService } from '@/lib/services/attendeesService';
import {
  Calendar,
  Users,
  MapPin,
  Clock,
  ArrowRight,
  Settings,
  Ticket,
} from 'lucide-react';
import { DashboardSkeleton } from '@/components/ui/Skeleton';

export default function DashboardPage() {
  const { currentOrganization, userProfile } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [stats, setStats] = useState({
    totalEvents: 0,
    totalAttendees: 0,
    ticketsSold: 0,
  });
  const [loading, setLoading] = useState(true);
  const [latestEvent, setLatestEvent] = useState<Event | null>(null);
  const [latestEventStats, setLatestEventStats] = useState({
    registrations: 0,
    checkedIn: 0,
  });

  useEffect(() => {
    if (currentOrganization?.id) {
      loadDashboardData();
    }
  }, [currentOrganization?.id]);

  const loadDashboardData = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      // Load events
      const orgEvents = await eventService.getByOrganization(currentOrganization.id);
      setEvents(orgEvents);

      // Get latest/upcoming event
      const upcomingEvents = orgEvents
        .filter(e => new Date(e.date) >= new Date())
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

      const latest = upcomingEvents[0] || orgEvents[0];
      setLatestEvent(latest);

      // Load attendee stats
      const attendeeStats = await attendeesService.getStats(currentOrganization.id);

      // Calculate stats
      const totalTicketsSold = orgEvents.reduce((sum, e) => sum + (e.soldTickets || 0), 0);

      setStats({
        totalEvents: orgEvents.length,
        totalAttendees: attendeeStats.total,
        ticketsSold: totalTicketsSold,
      });

      // Get latest event stats
      if (latest) {
        const eventAttendees = await attendeesService.getByEvent(latest.id!);
        const confirmedCount = eventAttendees.filter(a => a.status === 'confirmed').length;
        const checkedInCount = eventAttendees.filter(a => a.checkedIn).length;
        setLatestEventStats({
          registrations: confirmedCount,
          checkedIn: checkedInCount,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const userName = userProfile?.displayName?.split(' ')[0] || 'there';

  if (loading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Page Header */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-extrabold text-[#333]">Dashboard</h1>
        <p className="text-base font-semibold text-[#333]">
          Welcome back, {userName}
        </p>
      </div>

      {/* Featured Event Card */}
      {latestEvent && (
        <div className="bg-white border border-black/10 rounded-[24px] px-5 py-4">
          <div className="flex gap-10 items-center">
            {/* Event Image */}
            <div className="w-80 h-48 rounded-2xl overflow-hidden bg-gray-200 shrink-0">
              {latestEvent.imageUrl ? (
                <img
                  src={latestEvent.imageUrl}
                  alt={latestEvent.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
                  <Calendar className="w-12 h-12 text-white/60" />
                </div>
              )}
            </div>

            {/* Event Details */}
            <div className="flex gap-24 items-center flex-1">
              <div className="flex flex-col gap-3 w-64">
                <h2 className="text-2xl font-extrabold text-[#333] line-clamp-2">{latestEvent.name}</h2>
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2 text-sm text-[#333]">
                    <MapPin className="w-4 h-4" />
                    <span>{latestEvent.location || 'Location TBD'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#333]">
                    <Calendar className="w-4 h-4" />
                    <span>{formatDate(latestEvent.date)}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-[#333]">
                    <Clock className="w-4 h-4" />
                    <span>{latestEvent.time || '00:00'}</span>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div className="h-36 w-px bg-black/10" />

              {/* Registrations Stat */}
              <div className="flex flex-col">
                <p className="text-2xl font-semibold text-[#333]">Registrations</p>
                <p className="text-[96px] font-semibold text-[#333] leading-none">{latestEventStats.registrations}</p>
              </div>

              {/* Divider */}
              <div className="h-36 w-px bg-black/10" />

              {/* Check-ins Stat */}
              <div className="flex flex-col">
                <p className="text-2xl font-semibold text-[#333]">Check-ins</p>
                <p className="text-[96px] font-semibold text-[#333] leading-none">{latestEventStats.checkedIn}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* No Event Placeholder */}
      {!latestEvent && !loading && (
        <div className="bg-white border border-black/10 rounded-[24px] p-12 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[#333] mb-2">No Events Yet</h2>
          <p className="text-base text-[#333] mb-6">Create your first event to get started</p>
          <Link
            href="/dashboard/events/new"
            className="inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors"
          >
            <Calendar className="w-5 h-5" />
            Create Event
          </Link>
        </div>
      )}

      {/* Stats Cards - Large format matching Figma */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* Total Events */}
        <div className="border border-black/10 rounded-[24px] px-12 py-9">
          <div className="flex flex-col gap-12">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-semibold text-[#333]">Total Events</p>
              <Calendar className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[96px] font-semibold text-[#333] leading-none">{stats.totalEvents}</p>
            <p className="text-base text-[#333]">All Time Events</p>
          </div>
        </div>

        {/* Total Attendees */}
        <div className="border border-black/10 rounded-[24px] px-12 py-9">
          <div className="flex flex-col gap-12">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-semibold text-[#333]">Total Attendees</p>
              <Users className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[96px] font-semibold text-[#333] leading-none">{stats.totalAttendees}</p>
            <p className="text-base text-[#333]">All Time Registrations</p>
          </div>
        </div>

        {/* Tickets Sold */}
        <div className="border border-black/10 rounded-[24px] px-12 py-9">
          <div className="flex flex-col gap-12">
            <div className="flex items-center justify-between">
              <p className="text-2xl font-semibold text-[#333]">Tickets Sold</p>
              <Ticket className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[96px] font-semibold text-[#333] leading-none">{stats.ticketsSold}</p>
            <p className="text-base text-[#333]">All Time Tickets</p>
          </div>
        </div>
      </div>

      {/* Quick Actions - Matching Figma design */}
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold text-[#333]">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {/* Create Event */}
          <Link
            href="/dashboard/events/new"
            className="bg-[#f0f0f0] rounded-[24px] px-9 py-12 flex items-center gap-10 hover:bg-[#e8e8e8] transition-colors group"
          >
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <Calendar className="w-6 h-6 text-[#333]" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-2xl font-semibold text-[#333]">Create Event</p>
              <p className="text-base text-[#333]">Start planning your next event</p>
            </div>
            <ArrowRight className="w-6 h-6 text-[#333] group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* View Events */}
          <Link
            href="/dashboard/events"
            className="bg-[#f0f0f0] rounded-[24px] px-9 py-12 flex items-center gap-10 hover:bg-[#e8e8e8] transition-colors group"
          >
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <Calendar className="w-6 h-6 text-[#333]" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-2xl font-semibold text-[#333]">View Events</p>
              <p className="text-base text-[#333]">Manage your existing events</p>
            </div>
            <ArrowRight className="w-6 h-6 text-[#333] group-hover:translate-x-1 transition-transform" />
          </Link>

          {/* Settings */}
          <Link
            href="/dashboard/settings"
            className="bg-[#f0f0f0] rounded-[24px] px-9 py-12 flex items-center gap-10 hover:bg-[#e8e8e8] transition-colors group"
          >
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <Settings className="w-6 h-6 text-[#333]" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-2xl font-semibold text-[#333]">Settings</p>
              <p className="text-base text-[#333]">Configure your organisation</p>
            </div>
            <ArrowRight className="w-6 h-6 text-[#333] group-hover:translate-x-1 transition-transform" />
          </Link>
        </div>
      </div>
    </div>
  );
}
