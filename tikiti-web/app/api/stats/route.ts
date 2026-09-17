import { NextResponse } from 'next/server';
import { getPlatformStats } from '@/lib/stats/platformStats';

export const revalidate = 3600;

export async function GET() {
  try {
    const stats = await getPlatformStats();
    return NextResponse.json(stats, {
      headers: { 'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400' },
    });
  } catch (error) {
    console.error('Failed to compute platform stats', error);
    return NextResponse.json({ error: 'Failed to compute stats' }, { status: 500 });
  }
}
