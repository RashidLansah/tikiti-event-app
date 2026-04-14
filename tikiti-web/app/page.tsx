'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar, Users, BarChart3, QrCode, Bell, MessageSquare,
  ArrowRight, Check, Smartphone, Monitor, Globe, Zap,
  Shield, Clock, Star, ChevronRight, Menu, X,
  Ticket, MapPin, Heart, Send, FileText, Settings,
  TrendingUp, UserCheck, Radio, Share2
} from 'lucide-react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';

interface FeaturedEvent {
  id: string;
  name: string;
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

function formatEventDate(dateStr: string) {
  try {
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
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

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [featuredEvents, setFeaturedEvents] = useState<FeaturedEvent[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(true);

  useEffect(() => {
    async function fetchFeaturedEvents() {
      try {
        const today = new Date().toISOString().split('T')[0];
        const eventsRef = collection(db, 'events');
        const q = query(
          eventsRef,
          where('date', '>=', today),
          orderBy('date', 'asc'),
          limit(3)
        );
        const snapshot = await getDocs(q);
        const events: FeaturedEvent[] = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        })) as FeaturedEvent[];
        setFeaturedEvents(events);
      } catch (err) {
        console.error('Failed to fetch featured events:', err);
      } finally {
        setLoadingEvents(false);
      }
    }
    fetchFeaturedEvents();
  }, []);

  return (
    <div className="min-h-screen bg-[#fefff7]">

      {/* ════════════════════════════════════════════════════
          NAVIGATION
      ════════════════════════════════════════════════════ */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fefff7]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[1280px] mx-auto px-6 lg:px-12">
          <div className="flex items-center justify-between h-[72px]">
            {/* Logo */}
            <Link href="/" className="text-[28px] font-extrabold text-[#333] tracking-tight">
              Tikiti
            </Link>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              <a href="#events" className="text-[15px] font-medium text-[#86868b] hover:text-[#333] transition-colors">Events</a>
              <a href="#features" className="text-[15px] font-medium text-[#86868b] hover:text-[#333] transition-colors">Features</a>
              <a href="#pricing" className="text-[15px] font-medium text-[#86868b] hover:text-[#333] transition-colors">Pricing</a>
              <a href="#dashboard" className="text-[15px] font-medium text-[#86868b] hover:text-[#333] transition-colors">Dashboard</a>
              <a href="#mobile" className="text-[15px] font-medium text-[#86868b] hover:text-[#333] transition-colors">Mobile App</a>
            </div>

            {/* CTA Buttons */}
            <div className="hidden md:flex items-center gap-3">
              <Link
                href="/login"
                className="text-[15px] font-semibold text-[#333] px-5 py-2.5 rounded-full hover:bg-[#f0f0f0] transition-colors"
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

            {/* Mobile Menu Toggle */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-[#fefff7] border-t border-black/5 px-6 py-6 space-y-4">
            <a href="#events" className="block text-[15px] font-medium text-[#333]" onClick={() => setMobileMenuOpen(false)}>Events</a>
            <a href="#features" className="block text-[15px] font-medium text-[#333]" onClick={() => setMobileMenuOpen(false)}>Features</a>
            <a href="#pricing" className="block text-[15px] font-medium text-[#333]" onClick={() => setMobileMenuOpen(false)}>Pricing</a>
            <a href="#dashboard" className="block text-[15px] font-medium text-[#333]" onClick={() => setMobileMenuOpen(false)}>Dashboard</a>
            <a href="#mobile" className="block text-[15px] font-medium text-[#333]" onClick={() => setMobileMenuOpen(false)}>Mobile App</a>
            <div className="pt-4 flex flex-col gap-3">
              <Link href="/login" className="text-center text-[15px] font-semibold text-[#333] px-6 py-3 rounded-full border border-black/10">
                Sign In
              </Link>
              <Link href="/register" className="text-center text-[15px] font-semibold text-white bg-[#333] px-6 py-3 rounded-full">
                Get Started
              </Link>
            </div>
          </div>
        )}
      </nav>


      {/* ════════════════════════════════════════════════════
          HERO SECTION
      ════════════════════════════════════════════════════ */}
      <section className="pt-[140px] pb-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 bg-[#f0f0f0] rounded-full px-4 py-2 mb-8">
            <Zap size={14} className="text-[#333]" />
            <span className="text-[13px] font-semibold text-[#333]">Free for organizers to get started</span>
          </div>

          {/* Headline */}
          <h1 className="text-[48px] md:text-[72px] lg:text-[88px] font-extrabold text-[#333] leading-[0.95] tracking-tight mb-6">
            The event platform<br />
            <span className="text-[#a3a3a3]">built for Africa.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-[18px] md:text-[20px] text-[#86868b] max-w-[640px] mx-auto mb-10 leading-relaxed">
            Create events, sell tickets, scan QR codes at the gate, and let attendees share real photos and videos — all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-[#333] text-white text-[16px] font-semibold px-8 py-4 rounded-full hover:bg-[#1a1a1a] transition-colors"
            >
              Start for free <ArrowRight size={18} />
            </Link>
            <Link
              href="/events"
              className="flex items-center gap-2 bg-[#f0f0f0] text-[#333] text-[16px] font-semibold px-8 py-4 rounded-full hover:bg-[#e5e5e5] transition-colors"
            >
              Browse events
            </Link>
          </div>

          {/* Social proof points */}
          <div className="flex flex-wrap items-center justify-center gap-8 mt-16">
            {[
              { value: 'QR Check-In', label: 'Scan at the gate' },
              { value: 'Verified Content', label: 'Only real ticket holders post' },
              { value: 'Photo Downloads', label: 'Save memories to your phone' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[22px] md:text-[26px] font-extrabold text-[#333]">{stat.value}</div>
                <div className="text-[14px] font-medium text-[#86868b]">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          VALUE PROPS — Plan it, Fill it, Run it
      ════════════════════════════════════════════════════ */}
      <section className="py-20 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Organise it */}
            <div className="bg-[#333] rounded-[32px] p-10 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-[56px] h-[56px] bg-white/10 rounded-[18px] flex items-center justify-center mb-6">
                  <Calendar size={24} className="text-white" />
                </div>
                <h3 className="text-[28px] md:text-[32px] font-extrabold leading-tight mb-3">
                  Organise it
                </h3>
                <p className="text-[15px] text-white/50 leading-relaxed">
                  Full dashboard, speaker management, audience builder, email campaigns, and promo video — everything before doors open.
                </p>
              </div>
              <div className="absolute -bottom-16 -right-16 w-[160px] h-[160px] bg-white/5 rounded-full" />
            </div>

            {/* Sell it */}
            <div className="bg-[#f0f0f0] rounded-[32px] p-10 relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-[56px] h-[56px] bg-white rounded-[18px] flex items-center justify-center mb-6">
                  <Ticket size={24} className="text-[#333]" />
                </div>
                <h3 className="text-[28px] md:text-[32px] font-extrabold text-[#333] leading-tight mb-3">
                  Sell it
                </h3>
                <p className="text-[15px] text-[#86868b] leading-relaxed">
                  Paid tickets or free RSVP. QR codes generated instantly. Attendees buy, show up, and scan in — no friction.
                </p>
              </div>
              <div className="absolute -bottom-16 -right-16 w-[160px] h-[160px] bg-black/5 rounded-full" />
            </div>

            {/* Relive it */}
            <div className="bg-[#333] rounded-[32px] p-10 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-[56px] h-[56px] bg-white/10 rounded-[18px] flex items-center justify-center mb-6">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <h3 className="text-[28px] md:text-[32px] font-extrabold leading-tight mb-3">
                  Relive it
                </h3>
                <p className="text-[15px] text-white/50 leading-relaxed">
                  Verified attendees post photos and videos. Real-time analytics. Everyone downloads memories straight to their camera roll.
                </p>
              </div>
              <div className="absolute -bottom-16 -right-16 w-[160px] h-[160px] bg-white/5 rounded-full" />
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          FEATURES SECTION
      ════════════════════════════════════════════════════ */}
      <section id="features" className="py-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#f0f0f0] rounded-full px-4 py-2 mb-6">
              <Star size={14} className="text-[#333]" />
              <span className="text-[13px] font-semibold text-[#333]">Features</span>
            </div>
            <h2 className="text-[36px] md:text-[48px] font-extrabold text-[#333] leading-tight mb-4">
              Everything your event needs,<br />
              <span className="text-[#a3a3a3]">on one platform.</span>
            </h2>
            <p className="text-[16px] text-[#86868b] max-w-[520px] mx-auto">
              From event creation to post-event media — every feature is built in. No scattered WhatsApp groups, no missing tools.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Calendar size={22} />,
                title: 'Event Creation & Dashboard',
                description: 'Create and manage events with a full organizer dashboard — details, images, pricing, speakers, and a promo video all in one place.',
              },
              {
                icon: <QrCode size={22} />,
                title: 'QR Code Check-In',
                description: 'Every ticket comes with a QR code. Gate staff scan on mobile to check in attendees instantly — no paper, no lists.',
              },
              {
                icon: <Users size={22} />,
                title: 'Audience Builder',
                description: 'Filter attendees by category or interests, then send targeted email campaigns directly from the dashboard.',
              },
              {
                icon: <BarChart3 size={22} />,
                title: 'Real-Time Analytics',
                description: 'Track ticket sales, check-in rates, and revenue as they happen. Export reports after the event.',
              },
              {
                icon: <MessageSquare size={22} />,
                title: 'Event Updates & Notifications',
                description: 'Push event updates directly to attendees on mobile. Keep everyone informed — no group chats needed.',
              },
              {
                icon: <Shield size={22} />,
                title: 'Verified Attendee Content',
                description: 'Only real ticket holders can post photos and videos from your event — keeping the media feed authentic and trustworthy.',
              },
              {
                icon: <Heart size={22} />,
                title: 'Event Media Feed',
                description: 'Attendees see a live feed of verified content from the event — photos and videos from people who were actually there.',
              },
              {
                icon: <Smartphone size={22} />,
                title: 'Photo Downloads',
                description: 'Attendees can download event photos directly to their camera roll. Save memories without hunting through WhatsApp threads.',
              },
              {
                icon: <Globe size={22} />,
                title: 'Discover & Attend',
                description: 'Attendees browse events, buy tickets or RSVP free, get their QR code, and network with other attendees — all in the app.',
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="bg-[#f0f0f0] rounded-[24px] p-7 hover:bg-[#e8e8e8] transition-colors group"
              >
                <div className="w-[48px] h-[48px] bg-white rounded-[16px] flex items-center justify-center mb-5 group-hover:scale-105 transition-transform">
                  <span className="text-[#333]">{feature.icon}</span>
                </div>
                <h3 className="text-[18px] font-semibold text-[#333] mb-2">{feature.title}</h3>
                <p className="text-[14px] text-[#86868b] leading-relaxed">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          DASHBOARD SHOWCASE
      ════════════════════════════════════════════════════ */}
      <section id="dashboard" className="py-24 px-6 lg:px-12 bg-[#333]">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
              <Monitor size={14} className="text-white" />
              <span className="text-[13px] font-semibold text-white">Web Dashboard</span>
            </div>
            <h2 className="text-[36px] md:text-[48px] font-extrabold text-white leading-tight mb-4">
              Your organizer dashboard,<br />
              <span className="text-white/40">built for Africa.</span>
            </h2>
            <p className="text-[16px] text-white/50 max-w-[500px] mx-auto">
              Manage every event from one place — from creation to check-in day to post-event analytics.
            </p>
          </div>

          {/* Dashboard Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <TrendingUp size={20} />,
                title: 'Real-Time Analytics',
                description: 'Live overview of ticket sales, revenue, check-in counts, and attendee metrics across all your events.',
              },
              {
                icon: <Calendar size={20} />,
                title: 'Event Builder',
                description: 'Step-by-step creation with images, venue types, pricing, speakers, promo video, and scheduling.',
              },
              {
                icon: <UserCheck size={20} />,
                title: 'QR Check-In Scanner',
                description: 'Gate staff scan QR tickets on mobile. Track check-ins live and see real-time attendance counts.',
              },
              {
                icon: <Send size={20} />,
                title: 'Audience Builder & Campaigns',
                description: 'Filter attendees by category or interests, then send targeted email campaigns directly from the dashboard.',
              },
              {
                icon: <FileText size={20} />,
                title: 'Export Reports',
                description: 'Generate PDF and DOCX reports for attendance, revenue, and event performance.',
              },
              {
                icon: <Settings size={20} />,
                title: 'Speaker & Team Management',
                description: 'Invite speakers, manage event staff roles, and keep your whole team on the same page.',
              },
            ].map((item) => (
              <div
                key={item.title}
                className="bg-white/5 border border-white/10 rounded-[24px] p-7 hover:bg-white/10 transition-colors"
              >
                <div className="w-[44px] h-[44px] bg-white/10 rounded-[14px] flex items-center justify-center mb-5">
                  <span className="text-white">{item.icon}</span>
                </div>
                <h3 className="text-[17px] font-semibold text-white mb-2">{item.title}</h3>
                <p className="text-[14px] text-white/50 leading-relaxed">{item.description}</p>
              </div>
            ))}
          </div>

          {/* Dashboard Screenshot */}
          <div className="mt-14 rounded-[20px] overflow-hidden border border-white/10 shadow-2xl">
            <Image
              src="/images/dashboard.png"
              alt="Tikiti organizer dashboard showing event management, analytics, and attendee tracking"
              width={1280}
              height={720}
              className="w-full h-auto"
              unoptimized
            />
          </div>

          {/* Dashboard CTA */}
          <div className="text-center mt-12">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 bg-white text-[#333] text-[16px] font-semibold px-8 py-4 rounded-full hover:bg-white/90 transition-colors"
            >
              Try the dashboard <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          MOBILE APP SHOWCASE
      ════════════════════════════════════════════════════ */}
      <section id="mobile" className="py-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-[#f0f0f0] rounded-full px-4 py-2 mb-6">
              <Smartphone size={14} className="text-[#333]" />
              <span className="text-[13px] font-semibold text-[#333]">Mobile App</span>
            </div>
            <h2 className="text-[36px] md:text-[48px] font-extrabold text-[#333] leading-tight mb-4">
              More than a ticket app.<br />
              <span className="text-[#a3a3a3]">It&apos;s your event hub.</span>
            </h2>
            <p className="text-[16px] text-[#86868b] max-w-[500px] mx-auto">
              Browse events, buy tickets, scan in at the gate, post from the event, and download memories — all in one app.
            </p>
          </div>

          {/* App Features — Alternating layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* Left column */}
            <div className="space-y-5">
              {[
                {
                  icon: <Calendar size={20} />,
                  title: 'Discover Events',
                  description: 'Browse upcoming events in Ghana and across West Africa. Filter by date — today, this week, this month.',
                },
                {
                  icon: <Ticket size={20} />,
                  title: 'Buy Tickets & Free RSVP',
                  description: 'Pay for tickets or RSVP free in seconds. Your QR code ticket is generated immediately after registration.',
                },
                {
                  icon: <QrCode size={20} />,
                  title: 'QR Ticket at the Gate',
                  description: 'Your ticket lives in the app. Show your QR code at the door — organizers scan and you&apos;re in.',
                },
                {
                  icon: <Heart size={20} />,
                  title: 'My Events',
                  description: 'All your registered events in one place, with countdown timers and quick access to your tickets.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-[#f0f0f0] rounded-[24px] p-6 flex gap-5">
                  <div className="w-[48px] h-[48px] bg-white rounded-[16px] flex items-center justify-center shrink-0">
                    <span className="text-[#333]">{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#333] mb-1">{item.title}</h3>
                    <p className="text-[14px] text-[#86868b] leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Right column */}
            <div className="space-y-5">
              {[
                {
                  icon: <MessageSquare size={20} />,
                  title: 'Post Photos & Videos',
                  description: 'Share moments from the event in real time. Only verified ticket holders can post — so the feed is always authentic.',
                },
                {
                  icon: <Share2 size={20} />,
                  title: 'Event Media Feed',
                  description: 'See photos and videos from events you attended, posted by other real attendees. Relive the best moments.',
                },
                {
                  icon: <Smartphone size={20} />,
                  title: 'Download to Camera Roll',
                  description: 'Save event photos directly to your phone. No more asking around for pictures in WhatsApp groups.',
                },
                {
                  icon: <Bell size={20} />,
                  title: 'Updates & Notifications',
                  description: 'Get notified about event changes, organizer messages, and reminders so you never miss a thing.',
                },
              ].map((item) => (
                <div key={item.title} className="bg-[#f0f0f0] rounded-[24px] p-6 flex gap-5">
                  <div className="w-[48px] h-[48px] bg-white rounded-[16px] flex items-center justify-center shrink-0">
                    <span className="text-[#333]">{item.icon}</span>
                  </div>
                  <div>
                    <h3 className="text-[17px] font-semibold text-[#333] mb-1">{item.title}</h3>
                    <p className="text-[14px] text-[#86868b] leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mobile App Screenshots */}
          <div className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-4 lg:gap-6">
            <div className="rounded-[32px] overflow-hidden shadow-2xl border border-[#e0e0e0] w-[240px] sm:w-[200px] lg:w-[260px] shrink-0">
              <Image
                src="/images/mobile-home.png"
                alt="Tikiti mobile app home screen showing event discovery"
                width={260}
                height={560}
                className="w-full h-auto"
                unoptimized
              />
            </div>
            <div className="rounded-[32px] overflow-hidden shadow-2xl border border-[#e0e0e0] w-[240px] sm:w-[200px] lg:w-[260px] shrink-0">
              <Image
                src="/images/mobile-event.png"
                alt="Tikiti mobile app event detail with description and image"
                width={260}
                height={560}
                className="w-full h-auto"
                unoptimized
              />
            </div>
            <div className="rounded-[32px] overflow-hidden shadow-2xl border border-[#e0e0e0] w-[240px] sm:w-[200px] lg:w-[260px] shrink-0 hidden sm:block">
              <Image
                src="/images/mobile-ticket.png"
                alt="Tikiti mobile app QR ticket screen"
                width={260}
                height={560}
                className="w-full h-auto"
                unoptimized
              />
            </div>
          </div>

          {/* Download CTA */}
          <div className="mt-14 text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="https://apps.apple.com/gh/app/tikiti/id6751210748"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-3 bg-[#333] text-white text-[16px] font-semibold px-8 py-4 rounded-full hover:bg-[#1a1a1a] transition-colors"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
                Download on the App Store
              </a>
              <div className="inline-flex items-center gap-2 bg-[#f0f0f0] text-[#86868b] text-[16px] font-semibold px-8 py-4 rounded-full">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M17.523 2.295l-2.005 3.472c1.372.562 2.494 1.57 3.193 2.838H3.29c.699-1.268 1.82-2.276 3.193-2.838L4.478 2.295a.39.39 0 01.143-.533.39.39 0 01.533.143l2.036 3.525a8.29 8.29 0 012.81-.49 8.29 8.29 0 012.81.49l2.036-3.525a.39.39 0 01.533-.143.39.39 0 01.143.533zM7.008 7.17a.78.78 0 10-.001 1.56.78.78 0 00.001-1.56zm5.985 0a.78.78 0 100 1.56.78.78 0 000-1.56zM3.09 9.824h17.82c.054.395.09.796.09 1.206v6.93c0 2.37-1.922 4.29-4.29 4.29H7.29A4.294 4.294 0 013 17.96v-6.93c0-.41.036-.811.09-1.206z"/></svg>
                Android — Coming Soon
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          HOW IT WORKS
      ════════════════════════════════════════════════════ */}
      <section id="how-it-works" className="py-24 px-6 lg:px-12 bg-[#f0f0f0]">
        <div className="max-w-[1280px] mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-[36px] md:text-[48px] font-extrabold text-[#333] leading-tight mb-4">
              How it works
            </h2>
            <p className="text-[16px] text-[#86868b] max-w-[500px] mx-auto">
              From setup to the after-party — Tikiti has you covered.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Create your event',
                description: 'Sign up free as an organizer. Use the web dashboard to set up your event — date, venue, pricing, speakers, promo video, and more.',
                icon: <Calendar size={24} />,
              },
              {
                step: '02',
                title: 'Attendees discover & register',
                description: 'Attendees find your event on the Tikiti app. They buy a ticket or RSVP free and instantly get their QR code. No friction.',
                icon: <Users size={24} />,
              },
              {
                step: '03',
                title: 'Run it & relive it',
                description: 'Scan QR codes at the gate, send live updates, track analytics — then let attendees post photos and relive the memories.',
                icon: <TrendingUp size={24} />,
              },
            ].map((item) => (
              <div key={item.step} className="bg-white rounded-[24px] p-8 relative">
                <div className="text-[64px] font-extrabold text-[#f0f0f0] absolute top-6 right-8 leading-none">{item.step}</div>
                <div className="relative z-10">
                  <div className="w-[56px] h-[56px] bg-[#333] rounded-[18px] flex items-center justify-center mb-6">
                    <span className="text-white">{item.icon}</span>
                  </div>
                  <h3 className="text-[20px] font-bold text-[#333] mb-3">{item.title}</h3>
                  <p className="text-[14px] text-[#86868b] leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          ALIGNMENT SECTION — Web + Mobile in sync
      ════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="bg-[#333] rounded-[32px] p-10 md:p-16 text-white relative overflow-hidden">
            <div className="relative z-10 max-w-[600px]">
              <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-2 mb-6">
                <Radio size={14} className="text-white" />
                <span className="text-[13px] font-semibold text-white">Always in sync</span>
              </div>
              <h2 className="text-[32px] md:text-[44px] font-extrabold leading-tight mb-5">
                No scattered groups.<br />
                Everything in one place.
              </h2>
              <p className="text-[16px] text-white/50 mb-8 leading-relaxed">
                Stop sending event updates over WhatsApp and hunting for photos in group chats.
                Tikiti keeps everything — tickets, updates, media, and attendee connections — in a single platform built for events.
              </p>
              <div className="space-y-4">
                {[
                  'Events created on web appear on mobile instantly',
                  'QR codes generated instantly, scanned seamlessly at the gate',
                  'Only real ticket holders can post to the event feed',
                  'Organizer updates pushed as notifications — no group chats needed',
                  'Attendees download photos to camera roll with one tap',
                ].map((point) => (
                  <div key={point} className="flex items-center gap-3">
                    <div className="w-[24px] h-[24px] bg-white/10 rounded-full flex items-center justify-center shrink-0">
                      <Check size={14} className="text-white" />
                    </div>
                    <span className="text-[15px] text-white/70">{point}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Decorative elements */}
            <div className="absolute -bottom-32 -right-32 w-[400px] h-[400px] bg-white/5 rounded-full" />
            <div className="absolute top-10 right-10 w-[200px] h-[200px] bg-white/5 rounded-full hidden lg:block" />
            <div className="absolute top-1/2 right-1/4 w-[80px] h-[80px] bg-white/5 rounded-full hidden lg:block" />
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          FEATURED EVENTS
      ════════════════════════════════════════════════════ */}
      <section id="events" className="py-24 px-6 lg:px-12 border-t border-black/5">
        <div className="max-w-[1280px] mx-auto">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-12 gap-4">
            <div>
              <div className="inline-flex items-center gap-2 bg-[#f0f0f0] rounded-full px-4 py-2 mb-4">
                <Calendar size={14} className="text-[#333]" />
                <span className="text-[13px] font-semibold text-[#333]">Upcoming Events</span>
              </div>
              <h2 className="text-[36px] md:text-[48px] font-extrabold text-[#333] leading-tight">
                Discover events<br />
                <span className="text-[#a3a3a3]">happening soon.</span>
              </h2>
            </div>
            <Link
              href="/events"
              className="flex items-center gap-2 bg-[#333] text-white text-[15px] font-semibold px-6 py-3 rounded-full hover:bg-[#1a1a1a] transition-colors shrink-0"
            >
              View all events <ArrowRight size={16} />
            </Link>
          </div>

          {/* Events Grid */}
          {loadingEvents ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-[#f0f0f0] rounded-[24px] overflow-hidden animate-pulse">
                  <div className="h-[200px] bg-[#e5e5e5]" />
                  <div className="p-6 space-y-3">
                    <div className="h-4 bg-[#e5e5e5] rounded-full w-1/3" />
                    <div className="h-6 bg-[#e5e5e5] rounded-full w-3/4" />
                    <div className="h-4 bg-[#e5e5e5] rounded-full w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : featuredEvents.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {featuredEvents.map((event) => (
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
                  </div>

                  {/* Event Info */}
                  <div className="p-6">
                    <div className="flex items-center gap-2 text-[13px] text-[#86868b] font-medium mb-2">
                      <Calendar size={13} />
                      <span>{formatEventDate(event.date)}</span>
                      <span className="text-[#d4d4d4]">·</span>
                      <Clock size={13} />
                      <span>{formatEventTime(event.time)}</span>
                    </div>
                    <h3 className="text-[18px] font-bold text-[#333] mb-2 line-clamp-2 group-hover:text-[#1a1a1a]">
                      {event.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[13px] text-[#86868b] mb-4">
                      <MapPin size={13} />
                      <span className="truncate">{event.location}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[12px] text-[#a3a3a3]">
                        <Users size={12} />
                        <span>{event.availableTickets} spots left</span>
                      </div>
                      <span className="text-[13px] font-semibold text-[#333] flex items-center gap-1 group-hover:gap-2 transition-all">
                        Register <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-16 bg-[#f0f0f0] rounded-[32px]">
              <div className="w-[64px] h-[64px] bg-white rounded-[20px] flex items-center justify-center mx-auto mb-5">
                <Calendar size={28} className="text-[#a3a3a3]" />
              </div>
              <h3 className="text-[20px] font-bold text-[#333] mb-2">No upcoming events yet</h3>
              <p className="text-[15px] text-[#86868b] max-w-[400px] mx-auto mb-6">
                Be the first to create an event on Tikiti and reach thousands of attendees.
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 bg-[#333] text-white text-[15px] font-semibold px-6 py-3 rounded-full hover:bg-[#1a1a1a] transition-colors"
              >
                Create an event <ArrowRight size={16} />
              </Link>
            </div>
          )}

          {/* View All CTA (below grid) */}
          <div className="text-center mt-10">
            <Link
              href="/events"
              className="inline-flex items-center gap-2 bg-[#333] text-white text-[15px] font-semibold px-8 py-4 rounded-full hover:bg-[#1a1a1a] transition-colors"
            >
              View All Events <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          PRICING
      ════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6 lg:px-12">
        <div className="max-w-[640px] mx-auto">
          <h2 className="text-[32px] md:text-[40px] font-extrabold text-[#333] mb-6">Pricing</h2>
          <div className="bg-[#f0f0f0] rounded-[24px] p-8 md:p-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-[10px] h-[10px] rounded-full bg-[#4ade80]" />
              <span className="text-[15px] font-semibold text-[#333]">Tikiti is currently free</span>
            </div>
            <p className="text-[16px] text-[#555] leading-relaxed">
              In the future, we may introduce paid features or plans. If we do, we&apos;ll clearly describe the terms and pricing before you&apos;re charged.
            </p>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="text-[36px] md:text-[56px] font-extrabold text-[#333] leading-tight mb-6">
            Ready to run your<br />next event?
          </h2>
          <p className="text-[18px] text-[#86868b] max-w-[540px] mx-auto mb-10">
            Join organizers across Ghana and West Africa who use Tikiti to plan, sell tickets, and build real communities around their events. Free to get started.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-[#333] text-white text-[16px] font-semibold px-8 py-4 rounded-full hover:bg-[#1a1a1a] transition-colors"
            >
              Get started — it&apos;s free <ArrowRight size={18} />
            </Link>
            <Link
              href="/login"
              className="flex items-center gap-2 text-[#333] text-[16px] font-semibold px-8 py-4 rounded-full border border-black/10 hover:bg-[#f0f0f0] transition-colors"
            >
              Sign in to your account
            </Link>
          </div>
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          FOOTER
      ════════════════════════════════════════════════════ */}
      <footer className="bg-[#333] py-16 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
            {/* Brand */}
            <div className="md:col-span-1">
              <div className="text-[28px] font-extrabold text-white mb-3">Tikiti</div>
              <p className="text-[14px] text-white/40 leading-relaxed">
                The event platform built for Africa.
              </p>
            </div>

            {/* Product */}
            <div>
              <h4 className="text-[14px] font-semibold text-white/60 uppercase tracking-wider mb-4">Product</h4>
              <div className="space-y-3">
                <Link href="/events" className="block text-[14px] text-white/40 hover:text-white transition-colors">Browse Events</Link>
                <a href="#features" className="block text-[14px] text-white/40 hover:text-white transition-colors">Features</a>
                <a href="#dashboard" className="block text-[14px] text-white/40 hover:text-white transition-colors">Dashboard</a>
                <a href="#mobile" className="block text-[14px] text-white/40 hover:text-white transition-colors">Mobile App</a>
                <a href="https://apps.apple.com/gh/app/tikiti/id6751210748" target="_blank" rel="noopener noreferrer" className="block text-[14px] text-white/40 hover:text-white transition-colors">Download for iOS</a>
              </div>
            </div>

            {/* Company */}
            <div>
              <h4 className="text-[14px] font-semibold text-white/60 uppercase tracking-wider mb-4">Company</h4>
              <div className="space-y-3">
                <a href="#" className="block text-[14px] text-white/40 hover:text-white transition-colors">About</a>
                <a href="#" className="block text-[14px] text-white/40 hover:text-white transition-colors">Blog</a>
                <a href="#" className="block text-[14px] text-white/40 hover:text-white transition-colors">Careers</a>
                <a href="#" className="block text-[14px] text-white/40 hover:text-white transition-colors">Contact</a>
              </div>
            </div>

            {/* Legal */}
            <div>
              <h4 className="text-[14px] font-semibold text-white/60 uppercase tracking-wider mb-4">Legal</h4>
              <div className="space-y-3">
                <a href="/privacy" className="block text-[14px] text-white/40 hover:text-white transition-colors">Privacy Policy</a>
                <a href="#" className="block text-[14px] text-white/40 hover:text-white transition-colors">Terms of Service</a>
                <a href="#" className="block text-[14px] text-white/40 hover:text-white transition-colors">Cookie Policy</a>
              </div>
            </div>
          </div>

          {/* Bottom bar */}
          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-[13px] text-white/30">&copy; {new Date().getFullYear()} Tikiti. All rights reserved.</p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-[13px] text-white/30 hover:text-white transition-colors">Twitter</a>
              <a href="#" className="text-[13px] text-white/30 hover:text-white transition-colors">LinkedIn</a>
              <a href="#" className="text-[13px] text-white/30 hover:text-white transition-colors">Instagram</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
