'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
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
          where('status', '==', 'published'),
          where('date', '>=', today),
          orderBy('date', 'asc'),
          limit(6)
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
            <span className="text-[13px] font-semibold text-[#333]">Free to start</span>
          </div>

          {/* Headline */}
          <h1 className="text-[48px] md:text-[72px] lg:text-[88px] font-extrabold text-[#333] leading-[0.95] tracking-tight mb-6">
            Run professional events<br />
            <span className="text-[#a3a3a3]">without the chaos.</span>
          </h1>

          {/* Subheadline */}
          <p className="text-[18px] md:text-[20px] text-[#86868b] max-w-[640px] mx-auto mb-10 leading-relaxed">
            Everything you need to plan, promote, and manage your event — from speaker coordination to check-in day. Free to start.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="flex items-center gap-2 bg-[#333] text-white text-[16px] font-semibold px-8 py-4 rounded-full hover:bg-[#1a1a1a] transition-colors"
            >
              Start for free <ArrowRight size={18} />
            </Link>
            <a
              href="#dashboard"
              className="flex items-center gap-2 bg-[#f0f0f0] text-[#333] text-[16px] font-semibold px-8 py-4 rounded-full hover:bg-[#e5e5e5] transition-colors"
            >
              See the dashboard
            </a>
          </div>

          {/* Stats */}
          <div className="flex flex-wrap items-center justify-center gap-12 mt-16">
            {[
              { value: '10K+', label: 'Events created' },
              { value: '500K+', label: 'Tickets issued' },
              { value: '99.9%', label: 'Uptime' },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-[36px] md:text-[48px] font-extrabold text-[#333]">{stat.value}</div>
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
            {/* Plan it */}
            <div className="bg-[#333] rounded-[32px] p-10 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-[56px] h-[56px] bg-white/10 rounded-[18px] flex items-center justify-center mb-6">
                  <Calendar size={24} className="text-white" />
                </div>
                <h3 className="text-[28px] md:text-[32px] font-extrabold leading-tight mb-3">
                  Plan it
                </h3>
                <p className="text-[15px] text-white/50 leading-relaxed">
                  Program builder, speaker invitations, team collaboration. Set up every detail before doors open.
                </p>
              </div>
              <div className="absolute -bottom-16 -right-16 w-[160px] h-[160px] bg-white/5 rounded-full" />
            </div>

            {/* Fill it */}
            <div className="bg-[#f0f0f0] rounded-[32px] p-10 relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-[56px] h-[56px] bg-white rounded-[18px] flex items-center justify-center mb-6">
                  <Ticket size={24} className="text-[#333]" />
                </div>
                <h3 className="text-[28px] md:text-[32px] font-extrabold text-[#333] leading-tight mb-3">
                  Fill it
                </h3>
                <p className="text-[15px] text-[#86868b] leading-relaxed">
                  Beautiful event pages, QR tickets, email confirmations. Make it easy for people to show up.
                </p>
              </div>
              <div className="absolute -bottom-16 -right-16 w-[160px] h-[160px] bg-black/5 rounded-full" />
            </div>

            {/* Run it */}
            <div className="bg-[#333] rounded-[32px] p-10 text-white relative overflow-hidden">
              <div className="relative z-10">
                <div className="w-[56px] h-[56px] bg-white/10 rounded-[18px] flex items-center justify-center mb-6">
                  <BarChart3 size={24} className="text-white" />
                </div>
                <h3 className="text-[28px] md:text-[32px] font-extrabold leading-tight mb-3">
                  Run it
                </h3>
                <p className="text-[15px] text-white/50 leading-relaxed">
                  QR check-in, live attendee tracking, real-time analytics. Stay in control on the big day.
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
              Everything you need,<br />
              <span className="text-[#a3a3a3]">nothing you don&apos;t.</span>
            </h2>
            <p className="text-[16px] text-[#86868b] max-w-[520px] mx-auto">
              From event creation to post-event analytics — every feature is included on the free plan. No paywalls, no surprises.
            </p>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <Calendar size={22} />,
                title: 'Event Creation',
                description: 'Create free, paid, or hybrid events with rich details, images, and custom categories.',
              },
              {
                icon: <QrCode size={22} />,
                title: 'QR Ticketing',
                description: 'Auto-generated QR tickets for every registration. Scan at entry for seamless check-in.',
              },
              {
                icon: <Users size={22} />,
                title: 'Attendee Management',
                description: 'Track RSVPs, view attendee lists, export data, and manage capacity in real-time.',
              },
              {
                icon: <BarChart3 size={22} />,
                title: 'Analytics & Reports',
                description: 'Revenue tracking, attendance rates, check-in stats, and exportable PDF/DOCX reports.',
              },
              {
                icon: <MessageSquare size={22} />,
                title: 'Event Messaging',
                description: 'Send updates, reminders, and announcements to all attendees from the dashboard.',
              },
              {
                icon: <Bell size={22} />,
                title: 'Push Notifications',
                description: 'Real-time alerts for new RSVPs, event updates, and important reminders on mobile.',
              },
              {
                icon: <Globe size={22} />,
                title: 'Hybrid Events',
                description: 'Support for in-person, virtual, and hybrid events with Google Meet, Zoom, and Teams links.',
              },
              {
                icon: <Shield size={22} />,
                title: 'Role-Based Access',
                description: 'Separate views for organizers, attendees, and gate staff with appropriate permissions.',
              },
              {
                icon: <Smartphone size={22} />,
                title: 'Cross-Platform Sync',
                description: 'Events created on the web dashboard appear instantly on the mobile app. Always in sync.',
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
          PRICING SECTION
      ════════════════════════════════════════════════════ */}
      <section id="pricing" className="py-24 px-6 lg:px-12 bg-[#f0f0f0]">
        <div className="max-w-[1280px] mx-auto">
          {/* Section Header */}
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-2 mb-6">
              <Zap size={14} className="text-[#333]" />
              <span className="text-[13px] font-semibold text-[#333]">Simple Pricing</span>
            </div>
            <h2 className="text-[36px] md:text-[48px] font-extrabold text-[#333] leading-tight mb-4">
              All features free.<br />
              <span className="text-[#a3a3a3]">Upgrade when you grow.</span>
            </h2>
            <p className="text-[16px] text-[#86868b] max-w-[520px] mx-auto">
              No feature walls. Every tool is available on the free plan.
              Only upgrade when you need more than one active event.
            </p>
          </div>

          {/* Pricing Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-[800px] mx-auto">
            {/* Free Plan */}
            <div className="bg-white rounded-[24px] p-8 relative">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-[48px] h-[48px] bg-[#f0f0f0] rounded-[16px] flex items-center justify-center">
                  <Zap size={22} className="text-[#333]" />
                </div>
                <div>
                  <h3 className="text-[20px] font-bold text-[#333]">Free</h3>
                  <p className="text-[13px] text-[#86868b]">Everything you need to get started</p>
                </div>
              </div>
              <div className="mb-6">
                <span className="text-[48px] font-extrabold text-[#333]">$0</span>
                <span className="text-[16px] text-[#86868b] font-medium">/forever</span>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  '1 active event',
                  'Unlimited attendees',
                  'Unlimited team members',
                  'QR ticketing & check-in',
                  'Attendee messaging',
                  'AI event descriptions',
                  'Analytics & reports',
                  'Bulk email',
                  'Custom branding',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-[20px] h-[20px] bg-[#f0f0f0] rounded-full flex items-center justify-center shrink-0">
                      <Check size={12} className="text-[#333]" />
                    </div>
                    <span className="text-[14px] text-[#555]">{feature}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="block w-full text-center bg-[#f0f0f0] text-[#333] text-[15px] font-semibold py-3.5 rounded-full hover:bg-[#e5e5e5] transition-colors"
              >
                Get started free
              </Link>
            </div>

            {/* Pro Plan */}
            <div className="bg-[#333] rounded-[24px] p-8 relative text-white">
              {/* Recommended Badge */}
              <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                <span className="bg-[#333] text-white text-[12px] font-bold uppercase tracking-wider px-4 py-1.5 rounded-full border-2 border-[#f0f0f0]">
                  Most Popular
                </span>
              </div>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-[48px] h-[48px] bg-white/10 rounded-[16px] flex items-center justify-center">
                  <Star size={22} className="text-white" />
                </div>
                <div>
                  <h3 className="text-[20px] font-bold">Pro</h3>
                  <p className="text-[13px] text-white/50">For growing organisations</p>
                </div>
              </div>
              <div className="mb-6">
                <span className="text-[48px] font-extrabold">$2.99</span>
                <span className="text-[16px] text-white/50 font-medium">/month</span>
              </div>
              <div className="space-y-3 mb-8">
                {[
                  'Unlimited active events',
                  'Unlimited attendees',
                  'Unlimited team members',
                  'QR ticketing & check-in',
                  'Attendee messaging',
                  'AI event descriptions',
                  'Analytics & reports',
                  'Bulk email',
                  'Custom branding',
                  'Priority support',
                ].map((feature) => (
                  <div key={feature} className="flex items-center gap-3">
                    <div className="w-[20px] h-[20px] bg-white/10 rounded-full flex items-center justify-center shrink-0">
                      <Check size={12} className="text-white" />
                    </div>
                    <span className="text-[14px] text-white/70">{feature}</span>
                  </div>
                ))}
              </div>
              <Link
                href="/register"
                className="block w-full text-center bg-white text-[#333] text-[15px] font-semibold py-3.5 rounded-full hover:bg-white/90 transition-colors"
              >
                Start with Pro
              </Link>
            </div>
          </div>

          {/* Bottom note */}
          <p className="text-center text-[13px] text-[#86868b] mt-8 max-w-[400px] mx-auto">
            No credit card required for the free plan. Upgrade or downgrade anytime.
          </p>
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
              Your command center<br />
              <span className="text-white/40">for every event.</span>
            </h2>
            <p className="text-[16px] text-white/50 max-w-[500px] mx-auto">
              A powerful organizer dashboard built for speed. Manage everything from one place.
            </p>
          </div>

          {/* Dashboard Features */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: <TrendingUp size={20} />,
                title: 'Live Dashboard',
                description: 'Real-time overview of all your events, revenue, and attendee metrics at a glance.',
              },
              {
                icon: <Calendar size={20} />,
                title: 'Event Builder',
                description: 'Step-by-step event creation with image uploads, venue types, pricing, and scheduling.',
              },
              {
                icon: <UserCheck size={20} />,
                title: 'Check-In System',
                description: 'Built-in QR scanner for gate staff. Track check-ins live with real-time counts.',
              },
              {
                icon: <Send size={20} />,
                title: 'Broadcast Messages',
                description: 'Send targeted messages and updates to all attendees with one click.',
              },
              {
                icon: <FileText size={20} />,
                title: 'Export Reports',
                description: 'Generate PDF and DOCX reports for attendance, revenue, and event performance.',
              },
              {
                icon: <Settings size={20} />,
                title: 'Organization Settings',
                description: 'Customize your brand colors, logo, organization details, and team access.',
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
              Events in your pocket.<br />
              <span className="text-[#a3a3a3]">Always with you.</span>
            </h2>
            <p className="text-[16px] text-[#86868b] max-w-[500px] mx-auto">
              Built with React Native for iOS and Android. Everything stays perfectly in sync with the web dashboard.
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
                  description: 'Browse events near you with smart time-based filters — live, today, this week, this month.',
                },
                {
                  icon: <Ticket size={20} />,
                  title: 'Instant Registration',
                  description: 'RSVP to free events or buy paid tickets in seconds. Your QR code is generated immediately.',
                },
                {
                  icon: <QrCode size={20} />,
                  title: 'QR Code Tickets',
                  description: 'Your ticket lives in the app. Show the QR code at the door — no paper tickets needed.',
                },
                {
                  icon: <Heart size={20} />,
                  title: 'My Registered Events',
                  description: 'Track all your upcoming events with days-left countdowns and quick access to event details.',
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
                  icon: <Bell size={20} />,
                  title: 'Real-Time Notifications',
                  description: 'Get notified about event updates, new messages, and reminders so you never miss anything.',
                },
                {
                  icon: <MessageSquare size={20} />,
                  title: 'Event Updates & Messages',
                  description: 'Read organizer updates, event program changes, and messages — all within the event detail view.',
                },
                {
                  icon: <Globe size={20} />,
                  title: 'Join Virtual Events',
                  description: 'Hybrid and virtual events show meeting links right in the app. One tap to join Google Meet, Zoom, or Teams.',
                },
                {
                  icon: <Share2 size={20} />,
                  title: 'Share & Invite',
                  description: 'Share events and tickets with friends. Spread the word and fill every seat.',
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
              Three steps to your next successful event.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                step: '01',
                title: 'Create your event',
                description: 'Sign up as an organizer. Use the web dashboard to create your event with all the details — date, venue, pricing, images, and more.',
                icon: <Calendar size={24} />,
              },
              {
                step: '02',
                title: 'Attendees register',
                description: 'Attendees discover your event on the mobile app. They register with one tap and instantly receive their QR code ticket.',
                icon: <Users size={24} />,
              },
              {
                step: '03',
                title: 'Manage & grow',
                description: 'Track attendance, scan tickets at the door, send updates, view analytics, and use insights to make your next event even better.',
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
                Dashboard and app,<br />
                perfectly aligned.
              </h2>
              <p className="text-[16px] text-white/50 mb-8 leading-relaxed">
                When an organizer creates an event on the web, attendees see it instantly on the mobile app.
                When someone registers on the app, the dashboard updates in real-time.
                Check-in data, messages, and analytics flow seamlessly between both platforms.
              </p>
              <div className="space-y-4">
                {[
                  'Events created on web appear on mobile instantly',
                  'QR codes generated on mobile scan on the web dashboard',
                  'Attendee registrations sync in real-time',
                  'Messages from dashboard delivered as push notifications',
                  'Analytics reflect both web and mobile activity',
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
          {featuredEvents.length > 0 && (
            <div className="text-center mt-10">
              <Link
                href="/events"
                className="inline-flex items-center gap-2 bg-[#f0f0f0] text-[#333] text-[15px] font-semibold px-8 py-4 rounded-full hover:bg-[#e5e5e5] transition-colors"
              >
                Browse all events <ArrowRight size={16} />
              </Link>
            </div>
          )}
        </div>
      </section>


      {/* ════════════════════════════════════════════════════
          FINAL CTA
      ════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 lg:px-12">
        <div className="max-w-[1280px] mx-auto text-center">
          <h2 className="text-[36px] md:text-[56px] font-extrabold text-[#333] leading-tight mb-6">
            Ready to create your<br />next event?
          </h2>
          <p className="text-[18px] text-[#86868b] max-w-[540px] mx-auto mb-10">
            Join organizers who use Tikiti to plan, promote, and run professional events. All features included — free to start.
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
                The modern event platform for organizers and attendees.
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
