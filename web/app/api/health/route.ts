import { NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const start = Date.now();
    const res = await queryOne<{ ping: number }>('SELECT 1 as ping;');
    const latencyMs = Date.now() - start;

    return NextResponse.json({
      status: 'ok',
      database: res?.ping === 1 ? 'connected' : 'degraded',
      latency_ms: latencyMs,
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
