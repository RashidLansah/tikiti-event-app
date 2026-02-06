'use client';

import { useEffect, useState } from 'react';
import {
  Building2,
  Search,
  Trash2,
  MoreVertical,
  Users,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { adminService, PlatformOrganization } from '@/lib/services/adminService';
import { useToast } from '@/hooks/use-toast';

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<PlatformOrganization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<PlatformOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModal, setDeleteModal] = useState<{ open: boolean; org: PlatformOrganization | null }>({
    open: false,
    org: null
  });
  const [deleting, setDeleting] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadOrganizations();
  }, []);

  useEffect(() => {
    filterOrganizations();
  }, [organizations, searchQuery]);

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      const data = await adminService.getAllOrganizations(100);
      setOrganizations(data);
    } catch (err) {
      console.error('Error loading organizations:', err);
      toast({
        title: 'Error',
        description: 'Failed to load organizations',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const filterOrganizations = () => {
    let filtered = organizations;

    // Filter by search
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(o =>
        o.name?.toLowerCase().includes(query) ||
        o.ownerEmail?.toLowerCase().includes(query)
      );
    }

    setFilteredOrganizations(filtered);
  };

  const handleDeleteOrganization = async () => {
    if (!deleteModal.org) return;

    try {
      setDeleting(true);
      await adminService.deleteOrganization(deleteModal.org.id);
      setOrganizations(prev => prev.filter(o => o.id !== deleteModal.org?.id));
      toast({
        title: 'Organization deleted',
        description: `"${deleteModal.org.name}" has been removed from the platform`
      });
      setDeleteModal({ open: false, org: null });
    } catch (err) {
      console.error('Error deleting organization:', err);
      toast({
        title: 'Error',
        description: 'Failed to delete organization. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    }).format(date);
  };

  const stats = {
    total: organizations.length,
    totalEvents: organizations.reduce((acc, o) => acc + o.eventsCount, 0),
    totalMembers: organizations.reduce((acc, o) => acc + o.membersCount, 0)
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1d1f]">Organizations Management</h1>
          <p className="text-[#86868b] mt-1">Manage all organizations on the platform</p>
        </div>
        <Button onClick={loadOrganizations} variant="outline" disabled={loading}>
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-black/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Building2 className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1d1d1f]">{stats.total}</p>
                <p className="text-xs text-[#86868b]">Total Organizations</p>
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
                <p className="text-2xl font-bold text-[#1d1d1f]">{stats.totalEvents}</p>
                <p className="text-xs text-[#86868b]">Total Events Created</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-black/10">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1d1d1f]">{stats.totalMembers}</p>
                <p className="text-xs text-[#86868b]">Total Team Members</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="border-black/10">
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#86868b]" />
            <Input
              placeholder="Search by organization name or owner email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardContent>
      </Card>

      {/* Organizations Table */}
      <Card className="border-black/10">
        <CardHeader>
          <CardTitle className="text-lg">
            {filteredOrganizations.length} {filteredOrganizations.length === 1 ? 'Organization' : 'Organizations'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#333]"></div>
              <p className="mt-4 text-[#86868b]">Loading organizations...</p>
            </div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-12">
              <Building2 className="w-12 h-12 text-[#86868b] mx-auto mb-4" />
              <p className="text-[#86868b]">No organizations found</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Organization</TableHead>
                    <TableHead>Owner</TableHead>
                    <TableHead>Events</TableHead>
                    <TableHead>Members</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredOrganizations.map((org) => (
                    <TableRow key={org.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                            <span className="text-purple-600 font-semibold text-sm">
                              {org.name?.charAt(0) || '?'}
                            </span>
                          </div>
                          <div>
                            <p className="font-medium text-[#1d1d1f] text-sm">{org.name}</p>
                            <p className="text-xs text-[#86868b]">ID: {org.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="text-sm text-[#86868b]">{org.ownerEmail || 'Unknown'}</span>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="w-4 h-4 text-[#86868b]" />
                          <span className="font-medium">{org.eventsCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Users className="w-4 h-4 text-[#86868b]" />
                          <span className="font-medium">{org.membersCount}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm text-[#86868b]">
                          <Clock className="w-3 h-3" />
                          {formatDate(org.createdAt)}
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
                              onClick={() => setDeleteModal({ open: true, org })}
                              className="text-red-600 cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4 mr-2" />
                              Delete Organization
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

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteModal.open} onOpenChange={(open) => setDeleteModal({ open, org: open ? deleteModal.org : null })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <AlertTriangle className="w-5 h-5" />
              Delete Organization
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>&quot;{deleteModal.org?.name}&quot;</strong>?
              This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="bg-red-50 p-4 rounded-lg space-y-2">
            <p className="text-sm text-red-700">
              <strong>Warning:</strong> This will permanently delete the organization and may orphan related data.
            </p>
            <p className="text-sm text-red-700">
              This organization has <strong>{deleteModal.org?.eventsCount || 0}</strong> events and <strong>{deleteModal.org?.membersCount || 0}</strong> team members.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteModal({ open: false, org: null })}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteOrganization}
              disabled={deleting}
            >
              {deleting ? 'Deleting...' : 'Delete Organization'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
