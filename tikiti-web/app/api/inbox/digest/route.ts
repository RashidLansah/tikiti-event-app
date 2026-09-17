// GET/POST /api/inbox/digest — sends admins a WhatsApp digest of flyers auto-rejected in the last 24h.
// Meant to run from a daily cron (.github/workflows/inbox-digest.yml).
// Protected by header `x-cron-key` or `Authorization: Bearer` == env CRON_SECRET.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { sendRejectionDigest } from '@/lib/inbox/digest';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  const bearer = (req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!secret || (req.headers.get('x-cron-key') !== secret && bearer !== secret)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const db = getAdminFirestore();
    const { sent, count } = await sendRejectionDigest(db);
    return NextResponse.json({ sent, count });
  } catch (error: any) {
    console.error('[inbox/digest]', error);
    return NextResponse.json({ error: error.message || 'Digest failed' }, { status: 500 });
  }
}

export const GET = POST;
