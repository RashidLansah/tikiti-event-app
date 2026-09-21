// GET  /api/audience/unsubscribe?t=<token> → { masked } (masked identifier for the confirm page)
// POST /api/audience/unsubscribe { token, channel?: 'whatsapp'|'sms'|'email'|'all' } → opt out (default 'all')
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { optOut, verifyUnsubscribeToken } from '@/lib/audience/contacts';
import { AUDIENCE_CHANNELS, AUDIENCE_COLLECTION, type AudienceChannel } from '@/lib/audience/types';

export const runtime = 'nodejs';

function maskPhone(d: string): string {
  if (d.startsWith('233') && d.length === 12) return `+233 •• ••• ${d.slice(-4)}`;
  return `+${d.slice(0, 2)} ••• ${d.slice(-4)}`;
}

function maskEmail(e: string): string {
  const [user, domain] = e.split('@');
  return `${user.slice(0, 1)}•••@${domain || ''}`;
}

export async function GET(req: NextRequest) {
  const id = verifyUnsubscribeToken(req.nextUrl.searchParams.get('t'));
  if (!id) return NextResponse.json({ error: 'This link is not valid' }, { status: 400 });
  try {
    const snap = await getAdminFirestore().collection(AUDIENCE_COLLECTION).doc(id).get();
    const c = snap.data();
    if (!c) return NextResponse.json({ error: 'This link is not valid' }, { status: 404 });
    const masked = c.phone ? maskPhone(String(c.phone)) : c.email ? maskEmail(String(c.email)) : 'your contact';
    return NextResponse.json({ masked });
  } catch (err) {
    console.error('[audience/unsubscribe]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = verifyUnsubscribeToken(body?.token);
    if (!id) return NextResponse.json({ error: 'This link is not valid' }, { status: 400 });
    const channel: AudienceChannel | 'all' = AUDIENCE_CHANNELS.includes(body?.channel) ? body.channel : 'all';
    const ok = await optOut(getAdminFirestore(), id, channel, 'web_signup');
    if (!ok) return NextResponse.json({ error: 'This link is not valid' }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('[audience/unsubscribe]', err);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
