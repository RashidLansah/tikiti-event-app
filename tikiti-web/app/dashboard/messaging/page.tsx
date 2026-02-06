'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import {
  MessageSquare,
  Send,
  Calendar,
  Users,
  Mail,
  Bell,
  ArrowRight,
  Plus,
} from 'lucide-react';
import { PageSkeleton } from '@/components/ui/Skeleton';

export default function MessagingPage() {
  const { currentOrganization } = useAuth();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadEvents();
    }
  }, [currentOrganization?.id]);

  const loadEvents = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const orgEvents = await eventService.getByOrganization(currentOrganization.id);
      setEvents(orgEvents.filter(e => e.status === 'published'));
    } catch (error) {
      console.error('Error loading events:', error);
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

  if (loading) {
    return <PageSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-[#333]">Messages</h1>
          <p className="text-base font-semibold text-[#333]">
            Communicate with your event attendees
          </p>
        </div>
      </div>

      {/* Messaging Options - Large stat cards */}
      <div className="grid gap-5 md:grid-cols-3">
        {/* Email Broadcasts */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Email Broadcasts</p>
              <div className="w-12 h-12 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
                <Mail className="w-6 h-6 text-[#333]" />
              </div>
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">0</p>
            <p className="text-base text-[#333]">Emails sent this month</p>
          </div>
        </div>

        {/* Push Notifications */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Push Notifications</p>
              <div className="w-12 h-12 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
                <Bell className="w-6 h-6 text-[#333]" />
              </div>
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">0</p>
            <p className="text-base text-[#333]">Notifications sent this month</p>
          </div>
        </div>

        {/* Event Updates */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Event Updates</p>
              <div className="w-12 h-12 rounded-[16px] bg-[#f0f0f0] flex items-center justify-center">
                <Send className="w-6 h-6 text-[#333]" />
              </div>
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">0</p>
            <p className="text-base text-[#333]">Updates posted this month</p>
          </div>
        </div>
      </div>

      {/* Events with Messaging */}
      <div className="bg-white border border-black/10 rounded-[24px] overflow-hidden">
        <div className="px-6 py-5 border-b border-black/10">
          <h2 className="text-xl font-semibold text-[#333]">Send Messages by Event</h2>
          <p className="text-base text-[#333]">Select an event to send messages to its attendees</p>
        </div>

        {events.length === 0 ? (
          <div className="py-20 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-2xl font-semibold text-[#333]">No Published Events</h3>
              <p className="mt-2 text-base text-[#333]">
                Publish an event to start sending messages to attendees
              </p>
              <Link
                href="/dashboard/events/new"
                className="mt-6 inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors"
              >
                <Plus className="w-5 h-5" />
                Create Event
              </Link>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {events.map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors"
              >
                <div className="flex items-center gap-4">
                  {/* Event Image */}
                  <div className="w-16 h-16 rounded-[16px] overflow-hidden bg-gray-200 shrink-0">
                    {event.imageUrl ? (
                      <img
                        src={event.imageUrl}
                        alt={event.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
                        <Calendar className="w-6 h-6 text-white/60" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-[#333]">{event.name}</h3>
                    <div className="flex items-center gap-4 mt-1 text-sm text-[#86868b]">
                      <span className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        {formatDate(event.date)}
                      </span>
                      <span className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        {event.soldTickets || 0} attendees
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Link
                    href={`/dashboard/events/${event.id}/updates`}
                    className="inline-flex items-center gap-2 bg-[#f0f0f0] text-[#333] px-5 py-2.5 rounded-full text-base font-semibold hover:bg-[#e8e8e8] transition-colors"
                  >
                    <Send className="w-5 h-5" />
                    Updates
                  </Link>
                  <Link
                    href={`/dashboard/events/${event.id}/messaging`}
                    className="inline-flex items-center gap-2 bg-[#333] text-white px-5 py-2.5 rounded-full text-base font-semibold hover:bg-[#444] transition-colors"
                  >
                    <MessageSquare className="w-5 h-5" />
                    Message
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Actions - Matching Figma style */}
      <div className="flex flex-col gap-6">
        <h2 className="text-2xl font-semibold text-[#333]">Messaging Tips</h2>
        <div className="grid gap-5 md:grid-cols-3">
          {/* Email Best Practices */}
          <div className="bg-[#f0f0f0] rounded-[24px] px-9 py-12 flex items-center gap-10">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <Mail className="w-6 h-6 text-[#333]" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-2xl font-semibold text-[#333]">Email Best Practices</p>
              <p className="text-base text-[#333]">Send emails at optimal times for better open rates</p>
            </div>
          </div>

          {/* Push Notifications */}
          <div className="bg-[#f0f0f0] rounded-[24px] px-9 py-12 flex items-center gap-10">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <Bell className="w-6 h-6 text-[#333]" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-2xl font-semibold text-[#333]">Push Notifications</p>
              <p className="text-base text-[#333]">Use for time-sensitive updates like schedule changes</p>
            </div>
          </div>

          {/* Event Updates */}
          <div className="bg-[#f0f0f0] rounded-[24px] px-9 py-12 flex items-center gap-10">
            <div className="bg-white rounded-lg p-3 shadow-sm">
              <Send className="w-6 h-6 text-[#333]" />
            </div>
            <div className="flex flex-col gap-1 flex-1">
              <p className="text-2xl font-semibold text-[#333]">Event Updates</p>
              <p className="text-base text-[#333]">Keep attendees informed about event details</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
