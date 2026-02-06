'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { eventService, Event } from '@/lib/services/eventService';
import { attendeesService, Attendee } from '@/lib/services/attendeesService';
import { Input } from '@/components/ui/input';
import {
  ArrowLeft,
  Search,
  UserCheck,
  UserX,
  Users,
  CheckCircle2,
  Clock,
  RefreshCw,
  Loader2,
  QrCode,
} from 'lucide-react';

export default function CheckInPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params.id as string;
  const { user } = useAuth();

  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<Event | null>(null);
  const [attendees, setAttendees] = useState<Attendee[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Attendee[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [checkingIn, setCheckingIn] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('search');
  const [stats, setStats] = useState({
    total: 0,
    checkedIn: 0,
    notCheckedIn: 0,
    checkInRate: 0,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [eventData, attendeesData, statsData] = await Promise.all([
        eventService.getById(eventId),
        attendeesService.getByEvent(eventId),
        attendeesService.getCheckInStats(eventId),
      ]);

      setEvent(eventData);
      setAttendees(attendeesData.filter((a) => a.status === 'confirmed'));
      setStats(statsData);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [eventId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!searchTerm.trim()) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const results = await attendeesService.searchForCheckIn(eventId, searchTerm);
        setSearchResults(results);
      } catch (error) {
        console.error('Error searching:', error);
      } finally {
        setIsSearching(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm, eventId]);

  const handleCheckIn = async (attendeeId: string) => {
    if (!user) return;

    setCheckingIn(attendeeId);
    try {
      await attendeesService.checkIn(attendeeId, user.uid, 'manual');

      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendeeId
            ? { ...a, checkedIn: true, checkedInAt: new Date(), checkInMethod: 'manual' as const }
            : a
        )
      );
      setSearchResults((prev) =>
        prev.map((a) =>
          a.id === attendeeId
            ? { ...a, checkedIn: true, checkedInAt: new Date(), checkInMethod: 'manual' as const }
            : a
        )
      );

      setStats((prev) => ({
        ...prev,
        checkedIn: prev.checkedIn + 1,
        notCheckedIn: prev.notCheckedIn - 1,
        checkInRate: Math.round(((prev.checkedIn + 1) / prev.total) * 100),
      }));
    } catch (error) {
      console.error('Error checking in:', error);
      alert('Failed to check in attendee');
    } finally {
      setCheckingIn(null);
    }
  };

  const handleUndoCheckIn = async (attendeeId: string) => {
    setCheckingIn(attendeeId);
    try {
      await attendeesService.undoCheckIn(attendeeId);

      setAttendees((prev) =>
        prev.map((a) =>
          a.id === attendeeId
            ? { ...a, checkedIn: false, checkedInAt: null, checkInMethod: undefined }
            : a
        )
      );
      setSearchResults((prev) =>
        prev.map((a) =>
          a.id === attendeeId
            ? { ...a, checkedIn: false, checkedInAt: null, checkInMethod: undefined }
            : a
        )
      );

      setStats((prev) => ({
        ...prev,
        checkedIn: prev.checkedIn - 1,
        notCheckedIn: prev.notCheckedIn + 1,
        checkInRate: Math.round(((prev.checkedIn - 1) / prev.total) * 100),
      }));
    } catch (error) {
      console.error('Error undoing check-in:', error);
      alert('Failed to undo check-in');
    } finally {
      setCheckingIn(null);
    }
  };

  const formatTime = (timestamp: any) => {
    if (!timestamp) return '';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-[#333]"></div>
          <p className="mt-4 text-[#333]">Loading check-in...</p>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="text-center py-16" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
        <h3 className="text-xl font-semibold text-[#333]">Event not found</h3>
        <button
          onClick={() => router.back()}
          className="mt-6 inline-flex items-center gap-2 bg-[#333] text-white px-6 py-3 rounded-full font-semibold hover:bg-[#444] transition-colors"
        >
          Go Back
        </button>
      </div>
    );
  }

  const checkedInAttendees = attendees.filter((a) => a.checkedIn);
  const notCheckedInAttendees = attendees.filter((a) => !a.checkedIn);

  const tabs = [
    { id: 'search', label: 'Search', icon: Search, count: null },
    { id: 'not-checked-in', label: 'Not Checked In', icon: Clock, count: notCheckedInAttendees.length },
    { id: 'checked-in', label: 'Checked In', icon: CheckCircle2, count: checkedInAttendees.length },
    { id: 'all', label: 'All', icon: Users, count: attendees.length },
  ];

  return (
    <div className="space-y-8" style={{ fontFamily: 'Plus Jakarta Sans, sans-serif' }}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href={`/dashboard/events/${eventId}`}
            className="bg-[#f0f0f0] rounded-full p-3 hover:bg-[#e5e5e5] transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-[#333]" />
          </Link>
          <div>
            <h1 className="text-2xl font-extrabold text-[#333]">Event Check-In</h1>
            <p className="text-base font-semibold text-[#333]">{event.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href={`/scan/${eventId}`}
            className="inline-flex items-center gap-2 bg-[#333] text-white px-5 py-2.5 rounded-full font-semibold hover:bg-[#444] transition-colors"
          >
            <QrCode className="w-4 h-4" />
            QR Scanner
          </Link>
          <button
            onClick={loadData}
            className="inline-flex items-center gap-2 bg-[#f0f0f0] text-[#333] px-5 py-2.5 rounded-full font-semibold hover:bg-[#e5e5e5] transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-5 md:grid-cols-4">
        <div className="border border-black/10 rounded-3xl p-6 bg-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#333]">Total Registered</p>
            <Users className="w-5 h-5 text-[#333]" />
          </div>
          <p className="text-4xl font-semibold text-[#333]">{stats.total}</p>
        </div>

        <div className="border border-green-200 rounded-3xl p-6 bg-green-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-green-700">Checked In</p>
            <UserCheck className="w-5 h-5 text-green-600" />
          </div>
          <p className="text-4xl font-semibold text-green-700">{stats.checkedIn}</p>
        </div>

        <div className="border border-orange-200 rounded-3xl p-6 bg-orange-50">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-orange-700">Not Checked In</p>
            <UserX className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-4xl font-semibold text-orange-700">{stats.notCheckedIn}</p>
        </div>

        <div className="border border-black/10 rounded-3xl p-6 bg-white">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-[#333]">Check-In Rate</p>
            <CheckCircle2 className="w-5 h-5 text-[#333]" />
          </div>
          <p className="text-4xl font-semibold text-[#333]">{stats.checkInRate}%</p>
          <div className="w-full bg-[#f0f0f0] rounded-full h-2 mt-3">
            <div
              className="bg-green-500 h-2 rounded-full transition-all"
              style={{ width: `${stats.checkInRate}%` }}
            />
          </div>
        </div>
      </div>

      {/* Search & Check-in */}
      <div className="bg-white border border-black/10 rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-[#333] mb-2">Quick Check-In</h2>
        <p className="text-sm text-[#333]/70 mb-4">Search by name, email, or phone number to check in attendees</p>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-[#333]/50" />
          <Input
            placeholder="Search attendee by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 h-14 rounded-full border-black/10 bg-[#f0f0f0] focus:bg-white text-lg"
            autoFocus
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 animate-spin text-[#333]/50" />
          )}
        </div>

        {/* Search Results */}
        {searchTerm && (
          <div className="mt-4">
            {searchResults.length === 0 && !isSearching ? (
              <p className="text-center text-[#333]/70 py-6">
                No attendees found matching "{searchTerm}"
              </p>
            ) : (
              <div className="space-y-3">
                {searchResults.map((attendee) => (
                  <div
                    key={attendee.id}
                    className={`flex items-center justify-between p-4 rounded-2xl ${
                      attendee.checkedIn ? 'bg-green-50 border border-green-200' : 'bg-[#f0f0f0]'
                    }`}
                  >
                    <div>
                      <div className="font-semibold text-[#333]">
                        {attendee.firstName} {attendee.lastName}
                      </div>
                      <div className="text-sm text-[#333]/70">{attendee.userEmail}</div>
                      {attendee.phoneNumber && (
                        <div className="text-sm text-[#333]/70">{attendee.phoneNumber}</div>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {attendee.checkedIn ? (
                        <>
                          <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3" />
                            Checked In {formatTime(attendee.checkedInAt)}
                          </span>
                          <button
                            onClick={() => handleUndoCheckIn(attendee.id)}
                            disabled={checkingIn === attendee.id}
                            className="px-4 py-2 rounded-full text-sm font-semibold bg-white border border-black/10 text-[#333] hover:bg-[#f0f0f0] transition-colors disabled:opacity-50"
                          >
                            {checkingIn === attendee.id ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              'Undo'
                            )}
                          </button>
                        </>
                      ) : (
                        <button
                          onClick={() => handleCheckIn(attendee.id)}
                          disabled={checkingIn === attendee.id}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                        >
                          {checkingIn === attendee.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <>
                              <UserCheck className="h-4 w-4" />
                              Check In
                            </>
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Tabs Navigation */}
      <div className="bg-white border border-black/10 rounded-3xl p-2 inline-flex gap-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-semibold transition-colors ${
                activeTab === tab.id
                  ? 'bg-[#333] text-white'
                  : 'text-[#333] hover:bg-[#f0f0f0]'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== null && ` (${tab.count})`}
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      {activeTab === 'search' && (
        <div className="bg-white border border-black/10 rounded-3xl p-12 text-center">
          <Search className="mx-auto h-16 w-16 text-gray-300 mb-4" />
          <p className="text-[#333]/70">Use the search box above to find and check in attendees</p>
        </div>
      )}

      {activeTab === 'not-checked-in' && (
        <div className="bg-white border border-black/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-black/10">
            <h2 className="text-lg font-semibold text-[#333]">Attendees Not Yet Checked In</h2>
          </div>
          {notCheckedInAttendees.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle2 className="mx-auto h-16 w-16 text-green-300 mb-4" />
              <p className="text-[#333]/70">All attendees have checked in!</p>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {notCheckedInAttendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-semibold text-[#333]">
                      {attendee.firstName} {attendee.lastName}
                    </p>
                    <p className="text-sm text-[#333]/70">{attendee.userEmail}</p>
                  </div>
                  <button
                    onClick={() => handleCheckIn(attendee.id)}
                    disabled={checkingIn === attendee.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {checkingIn === attendee.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <UserCheck className="h-4 w-4" />
                        Check In
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'checked-in' && (
        <div className="bg-white border border-black/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-black/10">
            <h2 className="text-lg font-semibold text-[#333]">Checked In Attendees</h2>
          </div>
          {checkedInAttendees.length === 0 ? (
            <div className="p-12 text-center">
              <Clock className="mx-auto h-16 w-16 text-gray-300 mb-4" />
              <p className="text-[#333]/70">No attendees have checked in yet</p>
            </div>
          ) : (
            <div className="divide-y divide-black/10">
              {checkedInAttendees.map((attendee) => (
                <div key={attendee.id} className="flex items-center justify-between p-5">
                  <div>
                    <p className="font-semibold text-[#333]">
                      {attendee.firstName} {attendee.lastName}
                    </p>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm text-[#333]/70">{attendee.userEmail}</span>
                      <span className="text-xs text-[#333]/50">•</span>
                      <span className="text-sm text-[#333]/70">{formatTime(attendee.checkedInAt)}</span>
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-[#f0f0f0] text-[#333]">
                        {attendee.checkInMethod === 'app' && 'Self (App)'}
                        {attendee.checkInMethod === 'manual' && 'Manual'}
                        {attendee.checkInMethod === 'qr' && 'QR Code'}
                        {!attendee.checkInMethod && 'Unknown'}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleUndoCheckIn(attendee.id)}
                    disabled={checkingIn === attendee.id}
                    className="px-4 py-2 rounded-full text-sm font-semibold bg-[#f0f0f0] text-[#333] hover:bg-[#e5e5e5] transition-colors disabled:opacity-50"
                  >
                    {checkingIn === attendee.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Undo'
                    )}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {activeTab === 'all' && (
        <div className="bg-white border border-black/10 rounded-3xl overflow-hidden">
          <div className="p-6 border-b border-black/10">
            <h2 className="text-lg font-semibold text-[#333]">All Registered Attendees</h2>
          </div>
          <div className="divide-y divide-black/10">
            {attendees.map((attendee) => (
              <div key={attendee.id} className="flex items-center justify-between p-5">
                <div className="flex items-center gap-4">
                  {attendee.checkedIn ? (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" />
                      Checked In
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-semibold bg-orange-100 text-orange-700 flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      Pending
                    </span>
                  )}
                  <div>
                    <p className="font-semibold text-[#333]">
                      {attendee.firstName} {attendee.lastName}
                    </p>
                    <p className="text-sm text-[#333]/70">{attendee.userEmail}</p>
                  </div>
                </div>
                {attendee.checkedIn ? (
                  <button
                    onClick={() => handleUndoCheckIn(attendee.id)}
                    disabled={checkingIn === attendee.id}
                    className="px-4 py-2 rounded-full text-sm font-semibold bg-[#f0f0f0] text-[#333] hover:bg-[#e5e5e5] transition-colors disabled:opacity-50"
                  >
                    {checkingIn === attendee.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Undo'
                    )}
                  </button>
                ) : (
                  <button
                    onClick={() => handleCheckIn(attendee.id)}
                    disabled={checkingIn === attendee.id}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {checkingIn === attendee.id ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Check In'
                    )}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
