'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Plus,
  Search,
  Calendar,
  MapPin,
  Copy,
  Edit,
  MoreVertical,
  Eye,
  ArrowRight,
  Ticket,
  Clock,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { eventCategories } from '@/lib/data/categories';
import { useRouter } from 'next/navigation';
import { EventsSkeleton } from '@/components/ui/Skeleton';

export default function EventsPage() {
  const { currentOrganization, user } = useAuth();
  const router = useRouter();
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<Event['status'] | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  useEffect(() => {
    if (currentOrganization?.id) {
      loadEvents();
    }
  }, [currentOrganization, statusFilter, categoryFilter]);

  const loadEvents = async () => {
    if (!currentOrganization?.id) return;

    setLoading(true);
    try {
      const filters: any = {};
      if (statusFilter !== 'all') {
        filters.status = statusFilter;
      }
      if (categoryFilter !== 'all') {
        filters.category = categoryFilter;
      }
      if (searchTerm) {
        filters.search = searchTerm;
      }

      const orgEvents = await eventService.getByOrganization(currentOrganization.id, filters);
      setEvents(orgEvents);
    } catch (error) {
      console.error('Error loading events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDuplicate = async (eventId: string) => {
    if (!user || !currentOrganization?.id) return;

    try {
      const duplicatedEvent = await eventService.duplicate(eventId, user.uid, currentOrganization.id);
      router.push(`/dashboard/events/${duplicatedEvent.id}/edit`);
    } catch (error) {
      console.error('Error duplicating event:', error);
      alert('Failed to duplicate event');
    }
  };

  const handleDelete = async (eventId: string) => {
    if (!confirm('Are you sure you want to archive this event?')) return;

    try {
      await eventService.delete(eventId);
      loadEvents();
    } catch (error) {
      console.error('Error deleting event:', error);
      alert('Failed to delete event');
    }
  };

  const handlePublish = async (eventId: string) => {
    try {
      await eventService.publish(eventId);
      loadEvents();
    } catch (error) {
      console.error('Error publishing event:', error);
      alert('Failed to publish event');
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

  const getStatusStyles = (status: Event['status']) => {
    const styles: Record<Event['status'], { bg: string; text: string; label: string }> = {
      draft: { bg: 'bg-[#f0f0f0]', text: 'text-[#333]', label: 'Draft' },
      published: { bg: 'bg-green-100', text: 'text-green-800', label: 'Published' },
      archived: { bg: 'bg-[#f0f0f0]', text: 'text-[#86868b]', label: 'Archived' },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelled' },
    };
    return styles[status] || styles.draft;
  };

  const filteredEvents = events.filter(event => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      event.name.toLowerCase().includes(searchLower) ||
      event.description.toLowerCase().includes(searchLower) ||
      event.location.toLowerCase().includes(searchLower)
    );
  });

  if (loading && events.length === 0) {
    return <EventsSkeleton />;
  }

  return (
    <div className="flex flex-col gap-5" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-2xl font-extrabold text-[#333]">Events</h1>
          <p className="text-base font-semibold text-[#333]">
            Manage your organization's events
          </p>
        </div>
        <Link
          href="/dashboard/events/new"
          className="inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors"
        >
          <Plus className="w-5 h-5" />
          Create Event
        </Link>
      </div>

      {/* Filters Card */}
      <div className="bg-white border border-black/10 rounded-[24px] px-6 py-5">
        <div className="grid gap-4 md:grid-cols-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-[#86868b]" />
            <Input
              placeholder="Search events..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setTimeout(() => {
                  if (e.target.value === searchTerm) {
                    loadEvents();
                  }
                }, 500);
              }}
              className="pl-12 h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] focus:bg-white text-base"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as any)}>
            <SelectTrigger className="h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] text-base">
              <SelectValue placeholder="All Statuses" />
            </SelectTrigger>
            <SelectContent className="rounded-[16px]">
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="published">Published</SelectItem>
              <SelectItem value="archived">Archived</SelectItem>
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={(value) => setCategoryFilter(value)}>
            <SelectTrigger className="h-12 rounded-[16px] border-black/10 bg-[#f0f0f0] text-base">
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent className="rounded-[16px]">
              <SelectItem value="all">All Categories</SelectItem>
              {eventCategories.map((category) => (
                <SelectItem key={category.id} value={category.id}>
                  {category.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Events Grid */}
      {filteredEvents.length === 0 ? (
        <div className="bg-white border border-black/10 rounded-[24px] px-12 py-16 text-center">
          <Calendar className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-2xl font-semibold text-[#333] mb-2">No Events Found</h2>
          <p className="text-base text-[#333] mb-6">
            {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first event'}
          </p>
          {!searchTerm && statusFilter === 'all' && categoryFilter === 'all' && (
            <Link
              href="/dashboard/events/new"
              className="inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full text-base font-semibold hover:bg-[#444] transition-colors"
            >
              <Plus className="w-5 h-5" />
              Create Event
            </Link>
          )}
        </div>
      ) : (
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {filteredEvents.map((event) => {
            const statusStyle = getStatusStyles(event.status);
            return (
              <div
                key={event.id}
                className="bg-white border border-black/10 rounded-[24px] overflow-hidden hover:shadow-lg transition-shadow group"
              >
                {/* Event Image */}
                <div className="h-48 bg-gray-200 relative">
                  {event.imageUrl ? (
                    <img
                      src={event.imageUrl}
                      alt={event.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-purple-400 to-indigo-600 flex items-center justify-center">
                      <Calendar className="w-12 h-12 text-white/60" />
                    </div>
                  )}
                  {/* Status Badge */}
                  <div className={`absolute top-4 left-4 px-3 py-1 rounded-full text-sm font-semibold ${statusStyle.bg} ${statusStyle.text}`}>
                    {statusStyle.label}
                  </div>
                  {/* Actions Menu */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="absolute top-4 right-4 bg-white/90 hover:bg-white rounded-full p-2 transition-colors">
                        <MoreVertical className="h-4 w-4 text-[#333]" />
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="rounded-[16px]">
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/events/${event.id}`}>
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem asChild>
                        <Link href={`/dashboard/events/${event.id}/edit`}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </Link>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleDuplicate(event.id!)}>
                        <Copy className="mr-2 h-4 w-4" />
                        Duplicate
                      </DropdownMenuItem>
                      {event.status === 'draft' && (
                        <DropdownMenuItem onClick={() => handlePublish(event.id!)}>
                          Publish
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        onClick={() => handleDelete(event.id!)}
                        className="text-red-600"
                      >
                        Archive
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>

                {/* Event Details */}
                <div className="p-5">
                  <h3 className="text-xl font-extrabold text-[#333] mb-3 line-clamp-2">
                    {event.name}
                  </h3>

                  <div className="flex flex-col gap-2 mb-4">
                    <div className="flex items-center gap-2 text-sm text-[#333]">
                      <MapPin className="w-4 h-4" />
                      <span className="line-clamp-1">{event.location || 'Location TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#333]">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(event.date)}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-[#333]">
                      <Clock className="w-4 h-4" />
                      <span>{event.time || '00:00'}</span>
                    </div>
                  </div>

                  {/* Stats Row */}
                  <div className="flex items-center gap-4 py-4 border-t border-black/10">
                    <div className="flex-1">
                      <p className="text-sm text-[#86868b]">Tickets</p>
                      <p className="text-2xl font-semibold text-[#333]">{event.soldTickets || 0}/{event.totalTickets}</p>
                    </div>
                    <div className="h-10 w-px bg-black/10" />
                    <div className="flex-1">
                      <p className="text-sm text-[#86868b]">Category</p>
                      <p className="text-base font-semibold text-[#333]">{event.category}</p>
                    </div>
                  </div>

                  {/* Action Button */}
                  <Link
                    href={`/dashboard/events/${event.id}`}
                    className="flex items-center justify-center gap-2 w-full bg-[#f0f0f0] text-[#333] px-4 py-3 rounded-[16px] text-base font-semibold hover:bg-[#e8e8e8] transition-colors mt-2 group"
                  >
                    View Details
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
