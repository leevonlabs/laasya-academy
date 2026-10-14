import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, role, fcm_token, platform, batch_ids } = body;

    if (!fcm_token || typeof fcm_token !== 'string' || fcm_token.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'Valid fcm_token is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const cleanRole = (role || 'student').toString().toLowerCase();
    const cleanPlatform = (platform || 'android').toString().toLowerCase();
    const cleanUserId = user_id && user_id.toString().trim() !== '' ? user_id.toString().trim() : null;
    const cleanBatchIds = Array.isArray(batch_ids) ? batch_ids : [];

    await query(`
      INSERT INTO public.device_tokens (user_id, role, fcm_token, platform, batch_ids, updated_at)
      VALUES ($1, $2, $3, $4, $5::jsonb, NOW())
      ON CONFLICT (fcm_token)
      DO UPDATE SET
        user_id = COALESCE(EXCLUDED.user_id, public.device_tokens.user_id),
        role = EXCLUDED.role,
        platform = EXCLUDED.platform,
        batch_ids = EXCLUDED.batch_ids,
        updated_at = NOW();
    `, [cleanUserId, cleanRole, fcm_token.trim(), cleanPlatform, JSON.stringify(cleanBatchIds)]);

    return NextResponse.json({ success: true, message: 'Device token registered.' }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('Error in register-token POST:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error.' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');
    if (token) {
      await query(`DELETE FROM public.device_tokens WHERE fcm_token = $1`, [token]);
    }
    return NextResponse.json({ success: true, message: 'Token removed.' }, { headers: corsHeaders });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500, headers: corsHeaders });
  }
}
