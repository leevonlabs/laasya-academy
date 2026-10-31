import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      );
    }

    const body = await req.json();
    const current_password = body.current_password || body.currentPassword;
    const new_password = body.new_password || body.newPassword;

    if (!current_password || typeof current_password !== 'string' || !current_password.trim()) {
      return NextResponse.json(
        { success: false, error: 'Current password is required.' },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!new_password || typeof new_password !== 'string' || new_password.trim().length < 6) {
      return NextResponse.json(
        { success: false, error: 'New password must be at least 6 characters long.' },
        { status: 400, headers: corsHeaders }
      );
    }

    const trimmedCurrent = current_password.trim();
    const trimmedNew = new_password.trim();

    // Verify current password against auth.users
    const passCheck = await queryOne<{ match: boolean }>(`
      SELECT (encrypted_password = crypt($1, encrypted_password)) as match
      FROM auth.users
      WHERE id = $2
      LIMIT 1;
    `, [trimmedCurrent, user.userId]);

    if (!passCheck || !passCheck.match) {
      return NextResponse.json(
        { success: false, error: 'Current password is incorrect. Please verify your existing password.' },
        { status: 400, headers: corsHeaders }
      );
    }

    // Update password in auth.users
    await query(`
      UPDATE auth.users
      SET 
        encrypted_password = crypt($1, gen_salt('bf')),
        updated_at = NOW()
      WHERE id = $2;
    `, [trimmedNew, user.userId]);

    return NextResponse.json(
      { success: true, message: 'Your password has been securely updated.' },
      { headers: corsHeaders }
    );
  } catch (error: any) {
    console.error('POST /api/user/change-password error:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Failed to update password' },
      { status: 500, headers: corsHeaders }
    );
  }
}
