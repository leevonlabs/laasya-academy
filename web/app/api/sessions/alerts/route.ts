import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { batch_id, batch_name, course_title, trainer_name, message } = body;

    if (!batch_id || !batch_name || !course_title) {
      return NextResponse.json(
        { success: false, error: 'batch_id, batch_name, and course_title are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const alertMessage = message || `The ${course_title} (${batch_name}) class session has concluded. Parents are requested to pick up their child safely.`;

    // 1. Insert into session_alerts table
    const alert = await queryOne<any>(`
      INSERT INTO public.session_alerts (batch_id, batch_name, course_title, trainer_name, message, created_at)
      VALUES ($1, $2, $3, $4, $5, NOW())
      RETURNING id, batch_id, batch_name, course_title, trainer_name, message, created_at;
    `, [batch_id, batch_name, course_title, trainer_name || 'Assigned Guru', alertMessage]);

    // 2. Also log as a live announcement notification so it appears in notices
    try {
      const today = new Date().toISOString().split('T')[0];
      await query(`
        INSERT INTO public.announcements (
          title, message, audience, target_batch_name, target_course_title,
          type_tag, announcement_type, sender_role, trainer_name,
          publish_date, expiry_date, status, delivery_status, created_by, created_at, updated_at
        ) VALUES (
          $1, $2, 'Selected course or batch', $3, $4,
          'General', 'notification', 'trainer', $5,
          $6, $6, 'Published', 'System verified (Delivered)', $5, NOW(), NOW()
        );
      `, [
        `Class Completed: ${course_title} (${batch_name})`,
        alertMessage,
        batch_name,
        course_title,
        trainer_name || 'Assigned Guru',
        today
      ]);
    } catch (annError) {
      console.warn('Could not insert alert announcement copy:', annError);
    }

    return NextResponse.json({ success: true, alert }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Session alert error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to trigger session alert.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const batchIdsParam = searchParams.get('batchIds');
    const secondsParam = parseInt(searchParams.get('sinceSeconds') || '60', 10);
    const windowSeconds = isNaN(secondsParam) || secondsParam < 10 ? 60 : Math.min(secondsParam, 300);

    const alerts = await query<any>(`
      SELECT id, batch_id, batch_name, course_title, trainer_name, message, created_at
      FROM public.session_alerts
      WHERE created_at >= NOW() - ($1 || ' seconds')::interval
      ORDER BY created_at DESC
      LIMIT 20;
    `, [windowSeconds]);

    let filtered = alerts;
    if (batchIdsParam && batchIdsParam.trim() && batchIdsParam !== 'all') {
      const allowedIds = batchIdsParam.split(',').map(s => s.trim().toLowerCase());
      filtered = alerts.filter(a => allowedIds.includes((a.batch_id || '').toLowerCase()));
    }

    return NextResponse.json({ success: true, alerts: filtered }, { headers: corsHeaders });
  } catch (error: any) {
    console.error('Fetch session alerts error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to fetch session alerts.' },
      { status: 500, headers: corsHeaders }
    );
  }
}
