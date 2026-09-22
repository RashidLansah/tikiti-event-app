/** "2026-10-03" + "17:00" → "Sat 3 Oct, 17:00". Anything not YYYY-MM-DD is returned as-is. */
export function friendlyDate(date?: string, time?: string): string {
  const d = date && /^\d{4}-\d{2}-\d{2}$/.test(date) ? new Date(`${date}T12:00:00Z`) : null;
  const day = d && Number.isFinite(d.getTime())
    ? d.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' })
    : (date || '');
  if (!day) return '';
  return time ? `${day}, ${time}` : day;
}

/** Today's date in Accra as YYYY-MM-DD, offset by `plusDays`. */
export function accraDate(plusDays = 0, now = new Date()): string {
  const d = new Date(now.getTime() + plusDays * 86400000);
  return d.toLocaleDateString('en-CA', { timeZone: 'Africa/Accra' });
}
