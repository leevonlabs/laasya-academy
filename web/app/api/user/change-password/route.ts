import { NextRequest, NextResponse } from 'next/server';
import { query, queryOne } from '@/lib/db';
import { getCurrentUser } from '@/lib/auth';
import { logSecurityAudit } from '@/lib/audit';

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

    // Prevent re-using weak or default academy passwords
    const trivialPasswords = ['123456', 'guru@123', 'student@123', 'password', 'admin123'];
    if (trivialPasswords.includes(trimmedNew.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: 'Please choose a strong, unique password. Default academy passwords are not permitted.' },
        { status: 400, headers: corsHeaders }
      );
    }

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

    // Invalidate active sessions on other devices so old tokens cannot be used
    await query(`
      UPDATE public.active_sessions
      SET is_active = false
      WHERE (user_id = $1 OR profile_id = $1);
    `, [user.userId]).catch(() => {});

    // Log security audit
    await logSecurityAudit({
      userId: user.userId,
      userName: user.fullName,
      role: user.role,
      action: 'USER_PASSWORD_CHANGED',
      targetType: 'profile',
      targetId: user.userId,
      req,
    });

    return NextResponse.json(
      { success: true, message: 'Your password has been securely updated. Other devices have been signed out.' },
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
