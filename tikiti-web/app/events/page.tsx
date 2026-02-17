'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import {
  Calendar, Users, Clock, MapPin, ArrowRight, Search,
  ArrowLeft, Filter, X, ChevronDown, Globe, Ticket
} from 'lucide-react';
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface EventItem {
  id: string;
  name: string;
  description: string;
  date: string;
  time: string;
  location: string;
  category: string;
  type: 'free' | 'paid';
  price?: number;
  imageUrl?: string;
  imageBase64?: string;
  organizerName?: string;
  totalTickets: number;
  availableTickets: number;
  venueType?: string;
}

const CATEGORIES = [
  'All',
  'Conference',
  'Workshop',
  'Seminar',
  'Networking',
  'Concert',
  'Festival',
  'Sports',
  'Charity',
  'Education',
  'Technology',
  'Business',
  'Arts',
  'Health',
  'Other',
];

function formatEventDate(dateStr: string) {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function formatEventTime(timeStr: string) {
  try {
    const [h, m] = timeStr.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  } catch {
    return timeStr;
  }
}

function getRelativeDateLabel(dateStr: string) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(dateStr + 'T00:00:00');
  const diffDays = Math.ceil((eventDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Tomorrow';
  if (diffDays <= 7) return `In ${diffDays} days`;
  return null;
}

export default function EventsPage() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceFilter, setPriceFilter] = useState<'all' | 'free' | 'paid'>('all');
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    async function fetchEvents() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const eventsRef = collection(db, 'events');
        const q = query(
          eventsRef,
          where('status', '==', 'published'),
          where('date', '>=', today),
          orderBy('date', 'asc')
        );
        const snapshot = await getDocs(q);
        const fetched: EventItem[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as EventItem[];
        setEvents(fetched);
      } catch (err) {
        console.error('Failed to fetch events:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchEvents();
  }, []);

  const filteredEvents = useMemo(() => {
    return events.filter((event) => {
      // Search
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        const matchesSearch =
          event.name.toLowerCase().includes(q) ||
          event.location.toLowerCase().includes(q) ||
          event.category.toLowerCase().includes(q) ||
          (event.organizerName && event.organizerName.toLowerCase().includes(q));
        if (!matchesSearch) return false;
      }
      // Category
      if (selectedCategory !== 'All' && event.category.toLowerCase() !== selectedCategory.toLowerCase()) {
        return false;
      }
      // Price
      if (priceFilter === 'free' && event.type !== 'free') return false;
      if (priceFilter === 'paid' && event.type !== 'paid') return false;

      return true;
    });
  }, [events, searchQuery, selectedCategory, priceFilter]);

  const activeFilterCount = (selectedCategory !== 'All' ? 1 : 0) + (priceFilter !== 'all' ? 1 : 0);

  return (
    <div className="min-h-screen bg-[#fefff7]">
      {/* ── HEADER ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fefff7]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-[72px]">
            <div className="flex items-center gap-4">
              <Link href="/" className="flex items-center gap-2 text-[#86868b] hover:text-[#333] transition-colors">
                <ArrowLeft size={20} />
              </Link>
              <Link href="/" className="text-[28px] font-extrabold text-[#333] tracking-tight">
                Tikiti
              </Link>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/login"
                className="text-[15px] font-semibold text-[#333] px-5 py-2.5 rounded-full hover:bg-[#f0f0f0] transition-colors hidden sm:block"
              >
                Sign In
              </Link>
              <Link
                href="/register"
                className="text-[15px] font-semibold text-white bg-[#333] px-6 py-2.5 rounded-full hover:bg-[#1a1a1a] transition-colors"
              >
                Get Started
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── HERO / SEARCH ── */}
      <section className="pt-[120px] pb-8 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <h1 className="text-[36px] md:text-[56px] font-extrabold text-[#333] leading-tight mb-3">
            All Events
          </h1>
          <p className="text-[16px] md:text-[18px] text-[#86868b] mb-8 max-w-[500px]">
            Browse upcoming events and register directly. No app needed.
          </p>

          {/* Search + Filter Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Search Input */}
            <div className="flex-1 relative">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-[#a3a3a3]" />
              <input
                type="text"
                placeholder="Search events, locations, or organizers..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-[#f0f0f0] rounded-full pl-12 pr-4 py-3.5 text-[15px] text-[#333] placeholder-[#a3a3a3] outline-none focus:ring-2 focus:ring-[#333]/10 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-[#a3a3a3] hover:text-[#333]"
                >
                  <X size={16} />
                </button>
              )}
            </div>

            {/* Filter Toggle */}
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 px-6 py-3.5 rounded-full text-[15px] font-semibold transition-colors shrink-0 ${
                showFilters || activeFilterCount > 0
                  ? 'bg-[#333] text-white'
                  : 'bg-[#f0f0f0] text-[#333] hover:bg-[#e5e5e5]'
              }`}
            >
              <Filter size={16} />
              Filters
              {activeFilterCount > 0 && (
                <span className="bg-white/20 text-[12px] px-2 py-0.5 rounded-full">{activeFilterCount}</span>
              )}
            </button>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 bg-[#f0f0f0] rounded-[20px] p-6 space-y-5 animate-in slide-in-from-top-2">
              {/* Category */}
              <div>
                <label className="text-[13px] font-semibold text-[#86868b] uppercase tracking-wider block mb-3">Category</label>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                        selectedCategory === cat
                          ? 'bg-[#333] text-white'
                          : 'bg-white text-[#333] hover:bg-[#e5e5e5]'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price */}
              <div>
                <label className="text-[13px] font-semibold text-[#86868b] uppercase tracking-wider block mb-3">Price</label>
                <div className="flex gap-2">
                  {[
                    { value: 'all', label: 'All Prices' },
                    { value: 'free', label: 'Free' },
                    { value: 'paid', label: 'Paid' },
                  ].map((opt) => (
                    <button
                      key={opt.value}
                      onClick={() => setPriceFilter(opt.value as 'all' | 'free' | 'paid')}
                      className={`px-4 py-2 rounded-full text-[13px] font-medium transition-colors ${
                        priceFilter === opt.value
                          ? 'bg-[#333] text-white'
                          : 'bg-white text-[#333] hover:bg-[#e5e5e5]'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Clear Filters */}
              {activeFilterCount > 0 && (
                <button
                  onClick={() => {
                    setSelectedCategory('All');
                    setPriceFilter('all');
                  }}
                  className="text-[14px] font-medium text-[#86868b] hover:text-[#333] transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── RESULTS COUNT ── */}
      <section className="px-6 lg:px-12 pb-4">
        <div className="max-w-[1280px] mx-auto">
          {!loading && (
            <p className="text-[14px] text-[#86868b]">
              {filteredEvents.length} {filteredEvents.length === 1 ? 'event' : 'events'} found
              {searchQuery && <> for &ldquo;{searchQuery}&rdquo;</>}
              {selectedCategory !== 'All' && <> in {selectedCategory}</>}
            </p>
          )}
        </div>
      </section>

      {/* ── EVENTS GRID ── */}
      <section className="px-6 lg:px-12 pb-24">
        <div className="max-w-[1280px] mx-auto">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-[#f0f0f0] rounded-[24px] overflow-hidden animate-pulse">
                  <div className="h-[200px] bg-[#e5e5e5]" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-[#e5e5e5] rounded-full w-1/3" />
                    <div className="h-6 bg-[#e5e5e5] rounded-full w-3/4" />
                    <div className="h-4 bg-[#e5e5e5] rounded-full w-1/2" />
                    <div className="flex justify-between">
                      <div className="h-4 bg-[#e5e5e5] rounded-full w-1/4" />
                      <div className="h-4 bg-[#e5e5e5] rounded-full w-1/5" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {filteredEvents.map((event) => {
                const relativeLabel = getRelativeDateLabel(event.date);
                return (
                  <Link
                    key={event.id}
                    href={`/event/${event.id}`}
                    className="bg-[#f0f0f0] rounded-[24px] overflow-hidden hover:shadow-lg transition-all duration-300 group"
                  >
                    {/* Event Image */}
                    <div className="h-[200px] bg-[#e5e5e5] relative overflow-hidden">
                      {(event.imageUrl || event.imageBase64) ? (
                        <img
                          src={event.imageUrl || event.imageBase64}
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-[#333]">
                          <Calendar size={48} className="text-white/20" />
                        </div>
                      )}
                      {/* Price Badge */}
                      <div className="absolute top-4 right-4">
                        <span className="bg-white/90 backdrop-blur-sm text-[#333] text-[13px] font-semibold px-3 py-1.5 rounded-full">
                          {event.type === 'free' ? 'Free' : `KES ${event.price?.toLocaleString()}`}
                        </span>
                      </div>
                      {/* Category Badge */}
                      <div className="absolute top-4 left-4">
                        <span className="bg-[#333]/70 backdrop-blur-sm text-white text-[12px] font-medium px-3 py-1.5 rounded-full">
                          {event.category}
                        </span>
                      </div>
                      {/* Relative Date Label */}
                      {relativeLabel && (
                        <div className="absolute bottom-4 left-4">
                          <span className="bg-white/90 backdrop-blur-sm text-[#333] text-[12px] font-bold px-3 py-1.5 rounded-full">
                            {relativeLabel}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Event Info */}
                    <div className="p-6">
                      <div className="flex items-center gap-2 text-[13px] text-[#86868b] font-medium mb-2">
                        <Calendar size={13} />
                        <span>{formatEventDate(event.date)}</span>
                        <span className="text-[#d4d4d4]">&middot;</span>
                        <Clock size={13} />
                        <span>{formatEventTime(event.time)}</span>
                      </div>
                      <h3 className="text-[18px] font-bold text-[#333] mb-2 line-clamp-2 group-hover:text-[#1a1a1a]">
                        {event.name}
                      </h3>
                      <div className="flex items-center gap-1.5 text-[13px] text-[#86868b] mb-1">
                        <MapPin size={13} />
                        <span className="truncate">{event.location}</span>
                      </div>
                      {event.venueType && event.venueType !== 'in_person' && (
                        <div className="flex items-center gap-1.5 text-[12px] text-[#a3a3a3] mb-3">
                          <Globe size={12} />
                          <span>{event.venueType === 'hybrid' ? 'Hybrid event' : 'Virtual event'}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between mt-3 pt-3 border-t border-black/5">
                        <div className="flex items-center gap-1.5 text-[12px] text-[#a3a3a3]">
                          <Ticket size={12} />
                          <span>{event.availableTickets > 0 ? `${event.availableTickets} spots left` : 'Sold out'}</span>
                        </div>
                        <span className="text-[13px] font-semibold text-[#333] flex items-center gap-1 group-hover:gap-2 transition-all">
                          Register <ArrowRight size={14} />
                        </span>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-20 bg-[#f0f0f0] rounded-[32px]">
              <div className="w-[64px] h-[64px] bg-white rounded-[20px] flex items-center justify-center mx-auto mb-5">
                <Search size={28} className="text-[#a3a3a3]" />
              </div>
              <h3 className="text-[20px] font-bold text-[#333] mb-2">No events found</h3>
              <p className="text-[15px] text-[#86868b] max-w-[400px] mx-auto mb-6">
                {searchQuery || selectedCategory !== 'All' || priceFilter !== 'all'
                  ? 'Try adjusting your search or filters to find what you\'re looking for.'
                  : 'There are no upcoming events at the moment. Check back soon!'}
              </p>
              {(searchQuery || selectedCategory !== 'All' || priceFilter !== 'all') && (
                <button
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('All');
                    setPriceFilter('all');
                  }}
                  className="inline-flex items-center gap-2 bg-[#333] text-white text-[15px] font-semibold px-6 py-3 rounded-full hover:bg-[#1a1a1a] transition-colors"
                >
                  Clear all filters
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#333] py-12 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <Link href="/" className="text-[24px] font-extrabold text-white">Tikiti</Link>
          <p className="text-[13px] text-white/30">&copy; {new Date().getFullYear()} Tikiti. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <Link href="/" className="text-[13px] text-white/40 hover:text-white transition-colors">Home</Link>
            <Link href="/login" className="text-[13px] text-white/40 hover:text-white transition-colors">Sign In</Link>
            <Link href="/register" className="text-[13px] text-white/40 hover:text-white transition-colors">Get Started</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
