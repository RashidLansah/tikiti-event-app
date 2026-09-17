import { unstable_cache } from 'next/cache';
import { getAdminFirestore } from '@/lib/firebase/admin';

export interface PlatformStats {
  eventsListed: number;
  peopleServed: number;
  organisers: number;
  cities: number;
  updatedAt: string;
}

const EXCLUDED_EVENT_STATUSES = ['draft', 'archived'];
const MAX_CITY_SCAN = 5000;

/** Normalise a location value to a city key: text before first comma, trimmed, lowercased. */
function cityKey(raw: unknown): string {
  let text = '';
  if (typeof raw === 'string') text = raw;
  else if (raw && typeof raw === 'object') {
    const o = raw as { city?: string; name?: string; address?: string };
    text = o.city || o.name || o.address || '';
  }
  return text.split(',')[0].trim().toLowerCase();
}

async function countCollection(name: string): Promise<number> {
  try {
    const snap = await getAdminFirestore().collection(name).count().get();
    return snap.data().count;
  } catch {
    return 0;
  }
}

async function countEvents(): Promise<number> {
  const db = getAdminFirestore();
  try {
    const [total, excluded] = await Promise.all([
      db.collection('events').count().get(),
      db.collection('events').where('status', 'in', EXCLUDED_EVENT_STATUSES).count().get(),
    ]);
    return Math.max(0, total.data().count - excluded.data().count);
  } catch {
    return countCollection('events');
  }
}

async function countPeopleServed(): Promise<number> {
  const db = getAdminFirestore();
  try {
    const snap = await db
      .collection('bookings')
      .where('status', 'in', ['confirmed', 'used'])
      .select('quantity')
      .get();
    let total = 0;
    snap.forEach(doc => {
      const q = Number(doc.get('quantity'));
      total += Number.isFinite(q) && q > 0 ? q : 1;
    });
    return total;
  } catch {
    return 0;
  }
}

async function countCities(): Promise<number> {
  const db = getAdminFirestore();
  const cities = new Set<string>();
  const scan = async (collection: string) => {
    try {
      const snap = await db.collection(collection).select('location', 'city').limit(MAX_CITY_SCAN).get();
      snap.forEach(doc => {
        const key = cityKey(doc.get('city')) || cityKey(doc.get('location'));
        if (key) cities.add(key);
      });
    } catch {
      /* ignore missing collection */
    }
  };
  await Promise.all([scan('events'), scan('scraped_events')]);
  return cities.size;
}

export async function computePlatformStats(): Promise<PlatformStats> {
  const [events, scraped, peopleServed, organisers, cities] = await Promise.all([
    countEvents(),
    countCollection('scraped_events'),
    countPeopleServed(),
    countCollection('organizations'),
    countCities(),
  ]);
  return {
    eventsListed: events + scraped,
    peopleServed,
    organisers,
    cities,
    updatedAt: new Date().toISOString(),
  };
}

/** Cached for one hour (Next data cache; works on Vercel serverless). */
export const getPlatformStats = unstable_cache(computePlatformStats, ['platform-stats'], {
  revalidate: 3600,
  tags: ['platform-stats'],
});
