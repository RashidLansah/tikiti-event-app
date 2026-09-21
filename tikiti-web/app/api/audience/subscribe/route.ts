// POST /api/audience/subscribe — public opt-in capture. Stores consent; sends nothing.
// Body: { name?, phone?, email?, city?, interests?, priceComfort?, channels, source, eventId?, consent: true, wordingVersion? }
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { normaliseGhPhone } from '@/lib/events/contact';
import { categoryToInterest, channelHasIdentifier, cityFromLocation, normaliseEmail, upsertContact } from '@/lib/audience/contacts';
import { AUDIENCE_CHANNELS, PRICE_COMFORTS, type AudienceChannel, type AudienceSource } from '@/lib/audience/types';

export const runtime = 'nodejs';

const SOURCES: AudienceSource[] = ['web_event_prompt', 'web_signup', 'registration'];
const WINDOW_MS = 10 * 60 * 1000;
const MAX_HITS = 8;
const hits = new Map<string, number[]>();

function getIp(req: NextRequest): string {
  const fwd = req.headers.get('x-forwarded-for');
  if (fwd) return fwd.split(',')[0].trim();
  return req.headers.get('x-real-ip') || 'unknown';
}

function rateLimited(ip: string, now: number): boolean {
  const recent = (hits.get(ip) || []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_HITS) { hits.set(ip, recent); return true; }
  recent.push(now);
  hits.set(ip, recent);
  if (hits.size > 5000) for (const [k, v] of hits) if (!v.some((t) => now - t < WINDOW_MS)) hits.delete(k);
  return false;
}

const bad = (error: string, status = 400) => NextResponse.json({ error }, { status });

export async function POST(req: NextRequest) {
  try {
    if (rateLimited(getIp(req), Date.now())) return bad('Too many requests. Please try again later.', 429);
    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') return bad('Invalid JSON body');
    if (body.consent !== true) return bad('Consent is required');
    if (!SOURCES.includes(body.source)) return bad('Invalid source');

    const phone = normaliseGhPhone(body.phone);
    const email = normaliseEmail(body.email);
    if (!phone && !email) return bad('A valid phone number or email is required');

    const channels = (Array.isArray(body.channels) ? body.channels : [])
      .filter((c: unknown): c is AudienceChannel => AUDIENCE_CHANNELS.includes(c as AudienceChannel))
      .filter((c: AudienceChannel) => channelHasIdentifier(c, { phone, email }));
    if (!channels.length) return bad('Choose at least one channel that matches the contact details given');

    const db = getAdminFirestore();
    const interests: string[] = Array.isArray(body.interests) ? body.interests.map(String).slice(0, 30) : [];
    let city = typeof body.city === 'string' ? body.city.trim() : '';

    if (typeof body.eventId === 'string' && body.eventId && !body.eventId.includes('/')) {
      let ev = (await db.collection('events').doc(body.eventId).get()).data();
      if (!ev) ev = (await db.collection('scraped_events').doc(body.eventId).get()).data();
      if (ev) {
        const tag = categoryToInterest(ev.category);
        if (tag) interests.push(tag);
        if (!city) city = cityFromLocation(ev.city || ev.location);
      }
    }

    const result = await upsertContact(db, {
      phone: phone || undefined,
      email: email || undefined,
      name: typeof body.name === 'string' ? body.name : undefined,
      city,
      interests,
      priceComfort: PRICE_COMFORTS.includes(body.priceComfort) ? body.priceComfort : undefined,
      source: body.source,
      consent: { channels, wordingVersion: typeof body.wordingVersion === 'string' ? body.wordingVersion : undefined },
    });
    if (!result) return bad('A valid phone number or email is required');

    const res = NextResponse.json({ ok: true });
    res.cookies.set('tk_cid', result.id, {
      httpOnly: true, secure: process.env.NODE_ENV === 'production', sameSite: 'lax', maxAge: 60 * 60 * 24 * 365, path: '/',
    });
    return res;
  } catch (err) {
    console.error('[audience/subscribe]', err);
    return bad('Could not save your preferences', 500);
  }
}
