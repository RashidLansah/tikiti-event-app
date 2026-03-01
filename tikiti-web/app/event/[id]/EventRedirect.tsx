'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

interface EventRedirectProps {
  eventId: string;
}

/**
 * Client component that redirects to the static event.html page.
 * Extracted from page.tsx so the parent can be a server component
 * with generateMetadata() for social sharing previews.
 */
export default function EventRedirect({ eventId }: EventRedirectProps) {
  useEffect(() => {
    if (eventId) {
      // Preserve any extra URL params (uid, name, email from app redirect)
      const currentParams = new URLSearchParams(window.location.search);
      currentParams.set('eventId', eventId);
      window.location.href = `/event.html?${currentParams.toString()}`;
    }
  }, [eventId]);

  return (
    <div className="min-h-screen bg-[#fefff7]">
      {/* Header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#fefff7]/80 backdrop-blur-xl border-b border-black/5">
        <div className="max-w-[800px] mx-auto px-6">
          <div className="flex items-center justify-between h-[64px]">
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.history.length > 1 ? window.history.back() : window.location.href = '/events'}
                className="w-9 h-9 rounded-full bg-[#f0f0f0] flex items-center justify-center hover:bg-[#e5e5e5] transition-colors"
              >
                <ArrowLeft size={18} className="text-[#333]" />
              </button>
              <Link href="/" className="text-[28px] font-extrabold text-[#333] tracking-tight">
                Tikiti
              </Link>
            </div>
            <Link
              href="/events"
              className="text-[13px] font-semibold text-white bg-[#333] px-4 py-2 rounded-full hover:bg-[#1a1a1a] transition-colors"
            >
              Browse Events
            </Link>
          </div>
        </div>
      </nav>

      {/* Loading State */}
      <div className="pt-[120px] pb-24 px-6">
        <div className="max-w-[800px] mx-auto">
          {/* Banner skeleton */}
          <div className="h-[300px] bg-[#f0f0f0] rounded-[24px] animate-pulse mb-8" />
          {/* Content skeleton */}
          <div className="space-y-4">
            <div className="h-5 bg-[#f0f0f0] rounded-full w-1/4 animate-pulse" />
            <div className="h-8 bg-[#f0f0f0] rounded-full w-3/4 animate-pulse" />
            <div className="h-4 bg-[#f0f0f0] rounded-full w-1/2 animate-pulse" />
            <div className="h-4 bg-[#f0f0f0] rounded-full w-1/3 animate-pulse" />
          </div>
        </div>
      </div>
    </div>
  );
}
