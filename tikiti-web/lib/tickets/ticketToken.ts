import { randomBytes } from 'crypto';
import type { Firestore } from 'firebase-admin/firestore';

/** 22-char URL-safe random token (base64url of 16 random bytes, no padding). */
export function generateTicketToken(): string {
  return randomBytes(16).toString('base64url').slice(0, 22);
}

/** Returns the booking's ticketToken, creating and persisting one if missing. */
export async function ensureTicketToken(db: Firestore, bookingId: string): Promise<string> {
  const ref = db.collection('bookings').doc(bookingId);
  const snap = await ref.get();
  const existing = snap.data()?.ticketToken;
  if (typeof existing === 'string' && existing.length > 0) return existing;
  const token = generateTicketToken();
  await ref.update({ ticketToken: token, updatedAt: new Date() });
  return token;
}

export function ticketUrl(baseUrl: string, bookingId: string, token: string): string {
  return `${baseUrl.replace(/\/$/, '')}/t/${bookingId}?k=${token}`;
}

/** Public ticket base URL. Prod: NEXT_PUBLIC_APP_URL; falls back to gettikiti.com. */
export function ticketBaseUrl() {
  const raw = (process.env.TICKET_LINK_BASE_URL || process.env.NEXT_PUBLIC_APP_URL || 'https://www.gettikiti.com').replace(/\/$/, '');
  // Never put a localhost link in a real SMS/email, whatever the env says.
  if (process.env.NODE_ENV === 'production' && /localhost|127\.0\.0\.1/.test(raw)) return 'https://www.gettikiti.com';
  return raw;
}
