// Client-side helper for anonymous event engagement tracking.
export type TrackType = 'view' | 'register_click';

/** Fire-and-forget beacon to /api/events/[id]/track. Safe to call during navigation. */
export function trackEvent(eventId: string, type: TrackType): void {
  if (typeof window === 'undefined' || !eventId) return;
  const url = `/api/events/${encodeURIComponent(eventId)}/track`;
  const payload = JSON.stringify({ type });
  try {
    if (navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      if (navigator.sendBeacon(url, blob)) return;
    }
  } catch {
    // fall through to fetch
  }
  fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: payload, keepalive: true }).catch(() => {});
}

/** External/community events: registrations happen off-Tikiti, so we show Tikiti-side interest instead. */
export function isExternalEvent(ev: { registrationUrl?: string; isScraped?: boolean; source?: string }): boolean {
  return Boolean(ev.registrationUrl) || ev.isScraped === true || ev.source === 'community';
}

/** Returns "~N interested" when at least 3 register clicks, else null. */
export function interestedLabel(stats?: { registerClicks?: number }): string | null {
  const n = stats?.registerClicks ?? 0;
  return n >= 3 ? `~${n} interested` : null;
}
