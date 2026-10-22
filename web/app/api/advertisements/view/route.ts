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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const announcementId = searchParams.get('announcement_id');

    if (!announcementId) {
      return NextResponse.json(
        { success: false, error: 'Announcement ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const viewers = await query<any>(`
      SELECT id, announcement_id, user_id, user_role, user_name, viewed_at
      FROM public.advertisement_views
      WHERE announcement_id = $1
      ORDER BY viewed_at DESC
    `, [announcementId]);

    const countRow = await queryOne<{ count: string }>(`
      SELECT COUNT(DISTINCT user_id)::text as count
      FROM public.advertisement_views
      WHERE announcement_id = $1
    `, [announcementId]);

    const count = parseInt(countRow?.count || '0', 10);

    return NextResponse.json({
      success: true,
      views_count: count,
      viewers
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Error fetching advertisement views:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { announcement_id, user_id, user_role, user_name } = body;

    if (!announcement_id) {
      return NextResponse.json(
        { success: false, error: 'Announcement ID is required' },
        { status: 400, headers: corsHeaders }
      );
    }

    const safeUserId = (user_id || 'guest-' + Date.now()).toString().trim();
    const safeRole = (user_role || 'student').toString().trim();
    const safeName = (user_name || 'Logged-in User').toString().trim();

    // Insert or ignore if user already viewed
    await query(`
      INSERT INTO public.advertisement_views (announcement_id, user_id, user_role, user_name, viewed_at)
      VALUES ($1, $2, $3, $4, NOW())
      ON CONFLICT (announcement_id, user_id) 
      DO UPDATE SET viewed_at = NOW(), user_name = EXCLUDED.user_name, user_role = EXCLUDED.user_role;
    `, [announcement_id, safeUserId, safeRole, safeName]);

    // Recalculate unique views count and update announcements table
    const countRow = await queryOne<{ count: string }>(`
      SELECT COUNT(DISTINCT user_id)::text as count
      FROM public.advertisement_views
      WHERE announcement_id = $1
    `, [announcement_id]);

    const totalViews = parseInt(countRow?.count || '1', 10);

    await query(`
      UPDATE public.announcements
      SET views_count = $1
      WHERE id = $2;
    `, [totalViews, announcement_id]);

    return NextResponse.json({
      success: true,
      message: 'Advertisement view recorded successfully',
      views_count: totalViews
    }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Error recording advertisement view:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500, headers: corsHeaders }
    );
  }
}
