'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Input } from '@/components/ui/input';
import {
  Search,
  Users,
  Calendar,
  Download,
  Filter,
  CheckCircle,
  UserCheck,
  ArrowRight,
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { attendeesService, Attendee } from '@/lib/services/attendeesService';
import { eventService } from '@/lib/services/eventService';
import { useToast } from '@/hooks/use-toast';
import { TableSkeleton } from '@/components/ui/Skeleton';

export default function AttendeesPage() {
  const { currentOrganization } = useAuth();
  const { toast } = useToast();
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [eventFilter, setEventFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [events, setEvents] = useState<any[]>([]);
  const [stats, setStats] = useState({
    total: 0,
    confirmed: 0,
    thisMonth: 0,
  });

  useEffect(() => {
    if (currentOrganization?.id) {
      loadEvents();
      loadAttendees();
      loadStats();
    }
  }, [currentOrganization?.id]);

  useEffect(() => {
    if (currentOrganization?.id) {
      loadAttendees();
    }
  }, [eventFilter, statusFilter]);

  const loadEvents = async () => {
    if (!currentOrganization?.id) return;

    try {
      const orgEvents = await eventService.getByOrganization(currentOrganization.id);
      setEvents(orgEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    }
  };

  const loadStats = async () => {
    if (!currentOrganization?.id) return;

    try {
      const statsData = await attendeesService.getStats(currentOrganization.id);
      setStats(statsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadAttendees = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const attendeesData = await attendeesService.getByOrganization(currentOrganization.id, {
        eventId: eventFilter !== 'all' ? eventFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        search: searchTerm || undefined,
      });
      setAttendees(attendeesData);
    } catch (error: any) {
      console.error('Error loading attendees:', error);
      toast({
        title: 'Error',
        description: error.message || 'Failed to load attendees',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const exportAttendees = () => {
    const headers = ['Name', 'Email', 'Phone', 'Event', 'Type', 'Quantity', 'Price', 'Status', 'Registered'];
    const rows = attendees.map((attendee) => [
      attendee.userName || `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim(),
      attendee.userEmail || '',
      attendee.phoneNumber || '',
      attendee.eventName || '',
      attendee.registrationType === 'paid' ? 'Paid' : 'RSVP',
      attendee.quantity.toString(),
      attendee.totalPrice ? `₵${attendee.totalPrice}` : 'Free',
      attendee.status,
      attendee.createdAt
        ? typeof attendee.createdAt === 'object' && 'toDate' in attendee.createdAt
          ? attendee.createdAt.toDate().toLocaleDateString()
          : new Date(attendee.createdAt).toLocaleDateString()
        : 'N/A',
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `attendees-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: 'Success',
      description: 'Attendees exported successfully',
    });
  };

  const getStatusStyles = (status: string) => {
    const styles: Record<string, { bg: string; text: string }> = {
      confirmed: { bg: 'bg-green-100', text: 'text-green-800' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800' },
      waitlisted: { bg: 'bg-[#f0f0f0]', text: 'text-[#333]' },
      pending: { bg: 'bg-[#f0f0f0]', text: 'text-[#86868b]' },
    };
    return styles[status] || styles.pending;
  };

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-[#333]">Attendees</h1>
          <p className="text-base font-semibold text-[#333]">
            Manage and view all event attendees
          </p>
        </div>
        <button
          onClick={exportAttendees}
          className="inline-flex items-center gap-2 bg-[#f0f0f0] text-[#333] px-6 py-3 rounded-full text-base font-semibold hover:bg-[#e8e8e8] transition-colors"
        >
          <Download className="w-5 h-5" />
          Export
        </button>
      </div>

      {/* Stats Cards - Large format matching Figma */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        {/* Total Attendees */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Total</p>
              <Users className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">{stats.total}</p>
            <p className="text-base text-[#333]">All Attendees</p>
          </div>
        </div>

        {/* Confirmed */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Confirmed</p>
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">{stats.confirmed}</p>
            <p className="text-base text-[#333]">Verified Registrations</p>
          </div>
        </div>

        {/* This Month */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">This Month</p>
              <Calendar className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">{stats.thisMonth}</p>
            <p className="text-base text-[#333]">New Registrations</p>
          </div>
        </div>

        {/* Total Events */}
        <div className="border border-black/10 rounded-[24px] px-8 py-6">
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-xl font-semibold text-[#333]">Events</p>
              <UserCheck className="w-6 h-6 text-[#333]" />
            </div>
            <p className="text-[64px] font-semibold text-[#333] leading-none">{events.length}</p>
            <p className="text-base text-[#333]">Active Events</p>
          </div>
        </div>
      </div>

      {/* Filters Card */}
      <div className="bg-white border border-black/10 rounded-[24px] px-6 py-5">
        <div className="grid gap-4 md:grid-cols-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#86868b]" />
            <Input
              placeholder="Search attendees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && loadAttendees()}
              className="pl-12 h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] focus:bg-white text-base"
            />
          </div>

          <Select value={eventFilter} onValueChange={setEventFilter}>
            <SelectTrigger className="h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] text-base">
              <SelectValue placeholder="All Events" />
            </SelectTrigger>
            <SelectContent className="rounded-[16px]">
              <SelectItem value="all">All Events</SelectItem>
              {events.map((event) => (
                <SelectItem key={event.id} value={event.id}>
                  {event.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] text-base">
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent className="rounded-[16px]">
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="confirmed">Confirmed</SelectItem>
              <SelectItem value="cancelled">Cancelled</SelectItem>
              <SelectItem value="waitlisted">Waitlisted</SelectItem>
            </SelectContent>
          </Select>

          <button
            onClick={loadAttendees}
            className="inline-flex items-center justify-center gap-2 bg-[#333] text-white h-12 px-6 rounded-[16px] text-base font-semibold hover:bg-[#444] transition-colors"
          >
            <Filter className="w-5 h-5" />
            Apply Filters
          </button>
        </div>
      </div>

      {/* Attendees List Card */}
      <div className="bg-white border border-black/10 rounded-[24px] overflow-hidden">
        <div className="px-6 py-5 border-b border-black/10 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-[#333]">Attendees List</h2>
            <p className="text-base text-[#333]">
              {attendees.length} {attendees.length === 1 ? 'attendee' : 'attendees'} found
            </p>
          </div>
        </div>

        {loading ? (
          <TableSkeleton rows={6} />
        ) : attendees.length === 0 ? (
          <div className="py-20 flex items-center justify-center">
            <div className="text-center">
              <Users className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-2xl font-semibold text-[#333]">No attendees found</h3>
              <p className="mt-2 text-base text-[#333]">
                {searchTerm || eventFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your filters'
                  : 'Create events to see attendees'}
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-black/5">
            {attendees.map((attendee) => {
              const statusStyle = getStatusStyles(attendee.status);
              return (
                <div
                  key={attendee.id}
                  className="flex items-center justify-between px-6 py-4 hover:bg-[#fafafa] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-[#2b2525] text-white flex items-center justify-center font-extrabold text-lg">
                      {(attendee.userName || attendee.firstName || attendee.userEmail || 'A')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-base font-semibold text-[#333]">
                        {attendee.userName ||
                         `${attendee.firstName || ''} ${attendee.lastName || ''}`.trim() ||
                         attendee.userEmail ||
                         'Unknown'}
                      </p>
                      <p className="text-sm text-[#86868b] mt-0.5">{attendee.userEmail}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-base font-semibold text-[#333] line-clamp-1 max-w-[200px]">{attendee.eventName}</p>
                      <div className="flex items-center gap-2 text-sm text-[#86868b] mt-0.5 justify-end">
                        <span>{attendee.quantity} ticket{attendee.quantity !== 1 ? 's' : ''}</span>
                        {attendee.totalPrice !== undefined && (
                          <>
                            <span>•</span>
                            <span>{attendee.totalPrice > 0 ? `₵${attendee.totalPrice}` : 'Free'}</span>
                          </>
                        )}
                      </div>
                    </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                      {attendee.status}
                    </span>
                    <button className="w-10 h-10 rounded-full bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e8e8e8] transition-colors">
                      <ArrowRight className="w-5 h-5 text-[#333]" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}
