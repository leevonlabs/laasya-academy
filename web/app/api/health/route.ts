import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { pruneOrphanedMedia } from '@/lib/media';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const start = Date.now();
    const res = await queryOne<{ ping: number }>('SELECT 1 as ping;');
    const latencyMs = Date.now() - start;

    let prunedMediaCount: number | undefined;
    const pruneRequested = req.nextUrl.searchParams.get('prune') === 'true';
    if (pruneRequested) {
      prunedMediaCount = await pruneOrphanedMedia();
    }

    return NextResponse.json({
      status: 'ok',
      database: res?.ping === 1 ? 'connected' : 'degraded',
      latency_ms: latencyMs,
      timezone: 'Asia/Kolkata (IST)',
      pruned_media_count: prunedMediaCount,
      timestamp: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json(
      { 
        status: 'error', 
        database: 'disconnected', 
        error: error?.message || 'Database connection error' 
      },
      { status: 503 }
    );
  }
}
