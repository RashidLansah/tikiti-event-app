// Aggregate counts for the admin audience overview. Iterates the whole collection (capped) — fine at current scale.
import type { Firestore } from 'firebase-admin/firestore';
import { AUDIENCE_CHANNELS, AUDIENCE_COLLECTION, type AudienceChannel } from './types';

const MAX_DOCS = 20000;
const PAGE = 1000;

export interface SegmentCounts {
  total: number;
  reachable: Record<AudienceChannel, number>;
  reachableAny: number;
  paidBefore: number;
  createdLast7Days: number;
  createdLast30Days: number;
  byCity: Array<{ key: string; count: number }>;
  byInterest: Array<{ key: string; count: number }>;
  bySource: Array<{ key: string; count: number }>;
  truncated: boolean;
}

const toMs = (v: any): number => (v?.toDate ? v.toDate().getTime() : v instanceof Date ? v.getTime() : 0);
const sorted = (m: Map<string, number>, top?: number) =>
  [...m.entries()].map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count || a.key.localeCompare(b.key)).slice(0, top);
const bump = (m: Map<string, number>, k: string) => m.set(k, (m.get(k) || 0) + 1);

export async function segmentCounts(db: Firestore): Promise<SegmentCounts> {
  const now = Date.now();
  const out: SegmentCounts = {
    total: 0, reachable: { whatsapp: 0, sms: 0, email: 0 }, reachableAny: 0, paidBefore: 0,
    createdLast7Days: 0, createdLast30Days: 0, byCity: [], byInterest: [], bySource: [], truncated: false,
  };
  const cities = new Map<string, number>();
  const cityLabel = new Map<string, string>();
  const interests = new Map<string, number>();
  const sources = new Map<string, number>();

  let last: FirebaseFirestore.QueryDocumentSnapshot | null = null;
  while (out.total < MAX_DOCS) {
    let q = db.collection(AUDIENCE_COLLECTION).orderBy('__name__').limit(PAGE);
    if (last) q = q.startAfter(last);
    const snap = await q.get();
    if (snap.empty) break;
    for (const d of snap.docs) {
      const c = d.data();
      out.total++;
      let any = false;
      for (const ch of AUDIENCE_CHANNELS) if (c.channels?.[ch]?.optedIn === true) { out.reachable[ch]++; any = true; }
      if (any) out.reachableAny++;
      if ((c.signals?.paidBookings || 0) > 0) out.paidBefore++;
      const age = now - toMs(c.createdAt);
      if (age <= 7 * 86400000) out.createdLast7Days++;
      if (age <= 30 * 86400000) out.createdLast30Days++;
      const city = String(c.city || '').trim();
      if (city) { const k = city.toLowerCase(); bump(cities, k); if (!cityLabel.has(k)) cityLabel.set(k, city); }
      for (const i of c.interests || []) bump(interests, String(i));
      for (const s of c.sources || []) bump(sources, String(s));
    }
    last = snap.docs[snap.docs.length - 1];
    if (snap.size < PAGE) break;
  }
  if (out.total >= MAX_DOCS) out.truncated = true;
  out.byCity = sorted(cities, 10).map((r) => ({ key: cityLabel.get(r.key) || r.key, count: r.count }));
  out.byInterest = sorted(interests);
  out.bySource = sorted(sources);
  return out;
}
