'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Users,
  Calendar,
  Building2,
  Ticket,
  TrendingUp,
  ArrowRight,
  UserCheck,
  CalendarCheck,
  Clock
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { adminService, PlatformStats } from '@/lib/services/adminService';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<PlatformStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadStats();
  }, []);

  const loadStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminService.getPlatformStats();
      setStats(data);
    } catch (err) {
      console.error('Error loading stats:', err);
      setError('Failed to load platform statistics');
    } finally {
      setLoading(false);
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

  if (loading) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-[#1d1d1f]">Platform Overview</h1>
          <p className="text-[#86868b] mt-1">Loading statistics...</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-6">
                <div className="h-16 bg-gray-200 rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500 mb-4">{error}</p>
        <Button onClick={loadStats}>Retry</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-[#1d1d1f]">Platform Overview</h1>
        <p className="text-[#86868b] mt-1">
          Monitor and manage all users, events, and organizations on the platform
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="border-black/10 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#86868b]">Total Users</p>
                <p className="text-3xl font-bold text-[#1d1d1f] mt-1">{stats?.totalUsers || 0}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#86868b]">
                  <UserCheck className="w-3 h-3" />
                  <span>{stats?.totalOrganizers || 0} organizers</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/10 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#86868b]">Total Events</p>
                <p className="text-3xl font-bold text-[#1d1d1f] mt-1">{stats?.totalEvents || 0}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#86868b]">
                  <CalendarCheck className="w-3 h-3" />
                  <span>{stats?.publishedEvents || 0} published</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                <Calendar className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/10 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#86868b]">Organizations</p>
                <p className="text-3xl font-bold text-[#1d1d1f] mt-1">{stats?.totalOrganizations || 0}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#86868b]">
                  <TrendingUp className="w-3 h-3" />
                  <span>Active teams</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-purple-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="border-black/10 hover:shadow-lg transition-shadow">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[#86868b]">Registrations</p>
                <p className="text-3xl font-bold text-[#1d1d1f] mt-1">{stats?.totalRegistrations || 0}</p>
                <div className="flex items-center gap-2 mt-2 text-xs text-[#86868b]">
                  <Ticket className="w-3 h-3" />
                  <span>Total bookings</span>
                </div>
              </div>
              <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                <Ticket className="w-6 h-6 text-orange-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Users */}
        <Card className="border-black/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Users</CardTitle>
            <Link href="/admin/users">
              <Button variant="ghost" size="sm" className="text-[#86868b] hover:text-[#1d1d1f]">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentUsers.length === 0 ? (
                <p className="text-sm text-[#86868b] text-center py-4">No users yet</p>
              ) : (
                stats?.recentUsers.map((user) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-[#f5f5f7] rounded-xl">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={user.photoURL || ''} />
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-sm">
                          {user.displayName?.charAt(0) || user.email?.charAt(0) || '?'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-[#1d1d1f] text-sm">{user.displayName}</p>
                        <p className="text-xs text-[#86868b]">{user.email}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline" className={user.accountType === 'organiser' ? 'bg-purple-100 text-purple-700 border-0' : 'bg-gray-100 text-gray-700 border-0'}>
                        {user.accountType === 'organiser' ? 'Organizer' : 'User'}
                      </Badge>
                      <p className="text-xs text-[#86868b] mt-1 flex items-center justify-end gap-1">
                        <Clock className="w-3 h-3" />
                        {formatDate(user.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Events */}
        <Card className="border-black/10">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-lg font-semibold">Recent Events</CardTitle>
            <Link href="/admin/events">
              <Button variant="ghost" size="sm" className="text-[#86868b] hover:text-[#1d1d1f]">
                View All
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats?.recentEvents.length === 0 ? (
                <p className="text-sm text-[#86868b] text-center py-4">No events yet</p>
              ) : (
                stats?.recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center justify-between p-3 bg-[#f5f5f7] rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-green-100 rounded-xl flex items-center justify-center overflow-hidden">
                        {event.imageBase64 ? (
                          <img src={event.imageBase64} alt={event.title} className="w-full h-full object-cover" />
                        ) : (
                          <Calendar className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-[#1d1d1f] text-sm line-clamp-1">{event.title}</p>
                        <p className="text-xs text-[#86868b]">{event.location || 'No location'}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={`${getStatusColor(event.status)} border-0 text-xs`}>
                        {event.status}
                      </Badge>
                      <p className="text-xs text-[#86868b] mt-1">
                        {event.totalRegistrations} registrations
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card className="border-black/10">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Link href="/admin/users">
              <div className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors cursor-pointer">
                <Users className="w-8 h-8 text-blue-600 mb-2" />
                <h3 className="font-medium text-[#1d1d1f]">Manage Users</h3>
                <p className="text-sm text-[#86868b]">View, search and manage user accounts</p>
              </div>
            </Link>
            <Link href="/admin/events">
              <div className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors cursor-pointer">
                <Calendar className="w-8 h-8 text-green-600 mb-2" />
                <h3 className="font-medium text-[#1d1d1f]">Manage Events</h3>
                <p className="text-sm text-[#86868b]">View, edit and delete platform events</p>
              </div>
            </Link>
            <Link href="/admin/organizations">
              <div className="p-4 bg-purple-50 rounded-xl hover:bg-purple-100 transition-colors cursor-pointer">
                <Building2 className="w-8 h-8 text-purple-600 mb-2" />
                <h3 className="font-medium text-[#1d1d1f]">Manage Organizations</h3>
                <p className="text-sm text-[#86868b]">View and manage organization teams</p>
              </div>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
