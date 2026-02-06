'use client';

import { useEffect, useState } from 'react';
import {
  Calendar,
  Search,
  Trash2,
  MoreVertical,
  MapPin,
  Users,
  AlertTriangle,
  RefreshCw,
  ExternalLink,
  Eye
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { adminService, PlatformEvent } from '@/lib/services/adminService';
import { useToast } from '@/hooks/use-toast';

export default function AdminEventsPage() {
  const [events, setEvents] = useState<PlatformEvent[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<PlatformEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft' | 'cancelled'>('all');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; event: PlatformEvent | null }>({
    open: false,
    event: null
  });
  const [detailModal, setDetailModal] = useState<{ open: boolean; event: PlatformEvent | null }>({
    open: false,
    event: null
  });
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadEvents();
  }, []);

  useEffect(() => {
    filterEvents();
  }, [events, searchQuery, filterStatus]);

  const loadEvents = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllEvents(100);
      setEvents(data);
    } catch (err) {
      console.error('Error loading events:', err);
      toast({
        title: 'Error',
        description: 'Failed to load events',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterEvents = () => {
    let filtered = events;

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(e => e.status === filterStatus);
    }

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(e =>
        e.title?.toLowerCase().includes(query) ||
        e.location?.toLowerCase().includes(query) ||
        e.organizationName?.toLowerCase().includes(query)
      );
    }

    setFilteredEvents(filtered);
  };

  const handleDeleteEvent = async () => {
    if (!deleteModal.event) return;

    try {
      setDeleting(true);
      await adminService.deleteEvent(deleteModal.event.id);
      setEvents(prev => prev.filter(e => e.id !== deleteModal.event?.id));
      toast({
        title: 'Event deleted',
        description: `"${deleteModal.event.title}" has been removed from the platform`
      });
      setDeleteModal({ open: false, event: null });
    } catch (err) {
      console.error('Error deleting event:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete event. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return 'N/A';
    const d = typeof date === 'string' ? new Date(date) : date;
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(d);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-700';
      case 'draft':
        return 'bg-yellow-100 text-yellow-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      case 'archived':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getVenueTypeBadge = (type: string) => {
    switch (type) {
      case 'physical':
        return 'bg-blue-100 text-blue-700';
      case 'virtual':
        return 'bg-purple-100 text-purple-700';
      case 'hybrid':
        return 'bg-orange-100 text-orange-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const stats = {
    total: events.length,
    published: events.filter(e => e.status === 'published').length,
    draft: events.filter(e => e.status === 'draft').length,
    totalRegistrations: events.reduce((acc, e) => acc + (e.totalRegistrations || 0), 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1d1f]">Events Management</h1>
          <p className="text-[#86868b] mt-1">Manage all events on the platform</p>
        </div>
        <Button onClick={loadEvents} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="border-black/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1d1d1f]">{stats.total}</p>
                <p className="text-xs text-[#86868b]">Total Events</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-black/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1d1d1f]">{stats.published}</p>
                <p className="text-xs text-[#86868b]">Published</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-black/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                <Calendar className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1d1d1f]">{stats.draft}</p>
                <p className="text-xs text-[#86868b]">Drafts</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-black/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1d1d1f]">{stats.totalRegistrations}</p>
                <p className="text-xs text-[#86868b]">Total Registrations</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-black/10">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
              <Input
                placeholder="Search by title, location, or organization..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant={filterStatus === 'all' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('all')}
                size="sm"
              >
                All
              </Button>
              <Button
                variant={filterStatus === 'published' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('published')}
                size="sm"
              >
                Published
              </Button>
              <Button
                variant={filterStatus === 'draft' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('draft')}
                size="sm"
              >
                Drafts
              </Button>
              <Button
                variant={filterStatus === 'cancelled' ? 'default' : 'outline'}
                onClick={() => setFilterStatus('cancelled')}
                size="sm"
              >
                Cancelled
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Events Table */}
      <Card className="border-black/10">
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredEvents.length} {filteredEvents.length === 1 ? 'Event' : 'Events'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#333]"></div>
              <p className="mt-4 text-[#86868b]">Loading events...</p>
            </div>
          ) : filteredEvents.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="w-12 h-12 text-[#86868b] mx-auto mb-4" />
              <p className="text-[#86868b]">No events found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Event</TableHead>
                    <TableHead>Organization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Registrations</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEvents.map((event) => (
                    <TableRow key={event.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center overflow-hidden flex-shrink-0">
                            {event.imageBase64 ? (
                              <img src={event.imageBase64} alt={event.title} className="w-full h-full object-cover" />
                            ) : (
                              <Calendar className="w-5 h-5 text-green-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-[#1d1d1f] text-sm truncate">{event.title}</p>
                            <div className="flex items-center gap-1 text-xs text-[#86868b]">
                              <MapPin className="w-3 h-3" />
                              <span className="truncate">{event.location || 'No location'}</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[#86868b]">{event.organizationName || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge className={`${getStatusColor(event.status)} border-0 text-xs w-fit`}>
                            {event.status}
                          </Badge>
                          <Badge className={`${getVenueTypeBadge(event.venueType)} border-0 text-xs w-fit`}>
                            {event.venueType}
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[#86868b]">{formatDate(event.date)}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-4 h-4 text-[#86868b]" />
                          <span className="font-medium">{event.totalRegistrations}</span>
                          <span className="text-[#86868b]">/ {event.totalCheckedIn} checked in</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreVertical className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setDetailModal({ open: true, event })}
                              className="cursor-pointer"
                            >
                              <Eye className="w-4 h-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => window.open(`/event/${event.id}`, '_blank')}
                              className="cursor-pointer"
                            >
                              <ExternalLink className="w-4 h-4 mr-2" />
                              View Public Page
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => setDeleteModal({ open: true, event })}
                              className="text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Event
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Event Details Modal */}
      <Dialog open={detailModal.open} onOpenChange={(open) => setDetailModal({ open, event: open ? detailModal.event : null })}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Event Details</DialogTitle>
          </DialogHeader>
          {detailModal.event && (
            <div className="space-y-4">
              {detailModal.event.imageBase64 && (
                <div className="w-full h-40 rounded-lg overflow-hidden">
                  <img
                    src={detailModal.event.imageBase64}
                    alt={detailModal.event.title}
                    className="w-full h-full object-cover"
                  />
                </div>
              )}
              <div>
                <h3 className="font-semibold text-lg">{detailModal.event.title}</h3>
                <p className="text-sm text-[#86868b]">ID: {detailModal.event.id}</p>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-[#86868b]">Organization</p>
                  <p className="font-medium">{detailModal.event.organizationName || 'Unknown'}</p>
                </div>
                <div>
                  <p className="text-[#86868b]">Status</p>
                  <Badge className={`${getStatusColor(detailModal.event.status)} border-0 mt-1`}>
                    {detailModal.event.status}
                  </Badge>
                </div>
                <div>
                  <p className="text-[#86868b]">Date</p>
                  <p className="font-medium">{formatDate(detailModal.event.date)}</p>
                </div>
                <div>
                  <p className="text-[#86868b]">Venue Type</p>
                  <Badge className={`${getVenueTypeBadge(detailModal.event.venueType)} border-0 mt-1`}>
                    {detailModal.event.venueType}
                  </Badge>
                </div>
                <div>
                  <p className="text-[#86868b]">Location</p>
                  <p className="font-medium">{detailModal.event.location || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-[#86868b]">Created</p>
                  <p className="font-medium">{formatDate(detailModal.event.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[#86868b]">Registrations</p>
                  <p className="font-medium">{detailModal.event.totalRegistrations}</p>
                </div>
                <div>
                  <p className="text-[#86868b]">Checked In</p>
                  <p className="font-medium">{detailModal.event.totalCheckedIn}</p>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setDetailModal({ open: false, event: null })}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, event: open ? deleteModal.event : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Event
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteModal.event?.title}&quot;</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-4 rounded-lg">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This will permanently delete the event and all associated data including registrations, check-ins, and analytics.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, event: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteEvent}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
