'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
  return (
    <div
      className={cn(
        'animate-pulse bg-[#f0f0f0] rounded-[16px]',
        className
      )}
    />
  );
}

// Dashboard skeleton for page transitions
export function DashboardSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      {/* Header Skeleton */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-12 w-32 rounded-full" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-[24px] border border-black/10 p-6">
            <Skeleton className="h-4 w-24 mb-4" />
            <Skeleton className="h-16 w-32" />
          </div>
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-[24px] border border-black/10 p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <Skeleton className="h-48 w-full rounded-[16px]" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
          </div>
        </div>
        <div className="bg-white rounded-[24px] border border-black/10 p-6 space-y-4">
          <Skeleton className="h-6 w-40" />
          <div className="space-y-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-12 w-12 rounded-[12px]" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// Events page skeleton
export function EventsSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="h-12 w-40 rounded-full" />
      </div>

      {/* Filter Bar */}
      <div className="flex gap-4">
        <Skeleton className="h-12 w-32 rounded-full" />
        <Skeleton className="h-12 w-32 rounded-full" />
        <Skeleton className="h-12 w-48 rounded-[16px]" />
      </div>

      {/* Events Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="bg-white rounded-[24px] border border-black/10 overflow-hidden">
            <Skeleton className="h-40 w-full rounded-none" />
            <div className="p-5 space-y-3">
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
              <div className="flex gap-2 pt-2">
                <Skeleton className="h-8 w-20 rounded-full" />
                <Skeleton className="h-8 w-24 rounded-full" />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Attendees page skeleton
export function AttendeesSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <Skeleton className="h-8 w-40" />

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-[24px] border border-black/10 p-6">
            <Skeleton className="h-4 w-20 mb-3" />
            <Skeleton className="h-12 w-24" />
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-[24px] border border-black/10 p-6">
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-12 w-64 rounded-[16px]" />
          <Skeleton className="h-10 w-32 rounded-full" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4 py-3 border-b border-[#f0f0f0] last:border-0">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-3 w-32" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full" />
              <Skeleton className="h-8 w-24 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// Settings page skeleton
export function SettingsSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <Skeleton className="h-8 w-32" />

      {/* Tabs */}
      <div className="flex gap-2">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-10 w-24 rounded-full" />
        ))}
      </div>

      {/* Form */}
      <div className="bg-white rounded-[24px] border border-black/10 p-8 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-12 w-full rounded-[16px]" />
            </div>
          ))}
        </div>
        <Skeleton className="h-12 w-40 rounded-full" />
      </div>
    </div>
  );
}

// Reports page skeleton
export function ReportsSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <Skeleton className="h-8 w-32" />

      {/* Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-white rounded-[24px] border border-black/10 p-6">
            <div className="flex items-center gap-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-[12px]" />
              <Skeleton className="h-4 w-20" />
            </div>
            <Skeleton className="h-10 w-24" />
          </div>
        ))}
      </div>

      {/* Chart */}
      <div className="bg-white rounded-[24px] border border-black/10 p-6">
        <Skeleton className="h-6 w-40 mb-6" />
        <Skeleton className="h-64 w-full rounded-[16px]" />
      </div>
    </div>
  );
}

// Generic page skeleton
export function PageSkeleton() {
  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-300">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-[24px] border border-black/10 p-6 space-y-4">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

// Table loading skeleton (for inline loading states)
export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="py-6 px-6 space-y-4 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 py-3 border-b border-[#f0f0f0] last:border-0">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3 w-32" />
          </div>
          <Skeleton className="h-6 w-20 rounded-full" />
          <Skeleton className="h-8 w-24 rounded-full" />
        </div>
      ))}
    </div>
  );
}
