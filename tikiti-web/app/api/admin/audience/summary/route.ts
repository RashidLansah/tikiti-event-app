// GET /api/admin/audience/summary — aggregate audience counts (admin only). Never returns contact records.
import { NextRequest, NextResponse } from 'next/server';
import { getAdminFirestore } from '@/lib/firebase/admin';
import { isAdminResponse, requireAdmin } from '@/lib/inbox/admin';
import { segmentCounts } from '@/lib/audience/segments';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (isAdminResponse(admin)) return admin;
  try {
    return NextResponse.json(await segmentCounts(getAdminFirestore()));
  } catch (err: any) {
    console.error('[admin/audience/summary]', err);
    return NextResponse.json({ error: err?.message || 'Failed to load audience summary' }, { status: 500 });
  }
}
