import { NextRequest, NextResponse } from 'next/server';
import { registerDeviceToken } from '@/lib/fcm';
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
    const { userId, user_id, role, token, fcm_token, platform, batchIds, batch_ids, environment } = body;

    const actualUserId = user_id || userId;
    const actualToken = fcm_token || token;
    const actualRole = role || 'student';
    const actualPlatform = platform || 'android';
    const actualBatchIds = batch_ids || batchIds || [];
    const actualEnvironment = environment; // 'development' | 'production' or undefined (defaults inside registerDeviceToken)

    if (!actualUserId || !actualToken) {
      return NextResponse.json(
        { success: false, error: 'userId and token (fcm_token) are required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Verify user exists in database
    const userRow = await queryOne<{ id: string }>(
      `SELECT id FROM public.profiles 
       WHERE id::text = $1 
          OR id IN (SELECT profile_id FROM public.students WHERE id::text = $1)
          OR id IN (SELECT profile_id FROM public.trainers WHERE id::text = $1)
       LIMIT 1`,
      [actualUserId]
    );

    if (!userRow) {
      return NextResponse.json(
        { success: false, error: 'Target user identity not found.' },
        { status: 404, headers: corsHeaders }
      );
    }

    await registerDeviceToken({
      userId: actualUserId,
      role: actualRole,
      token: actualToken,
      platform: actualPlatform,
      batchIds: actualBatchIds,
      environment: actualEnvironment,
    });

    return NextResponse.json(
      { success: true, message: 'Device token registered successfully.' },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error registering device token:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token') || searchParams.get('fcm_token');

    if (token) {
      await query(`DELETE FROM public.device_tokens WHERE fcm_token = $1;`, [token]);
    }

    return NextResponse.json(
      { success: true, message: 'Device token removed.' },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('Error deleting device token:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
