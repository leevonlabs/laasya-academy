import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { queryOne } from '@/lib/db';
import { hashToken } from '@/lib/active-sessions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  const user = await getCurrentUser(req);
  if (!user) {
    return NextResponse.json(
      { authenticated: false, user: null },
      { status: 401, headers: corsHeaders }
    );
  }

  try {
    // 1. Check if token was revoked via active_sessions
    const authHeader = req.headers.get('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const rawToken = authHeader.slice(7).trim();
      const tokenHash = hashToken(rawToken);
      if (tokenHash) {
        const sessionRecord = await queryOne<{ is_active: boolean }>(
          `SELECT is_active FROM public.active_sessions WHERE token_hash = $1 LIMIT 1`,
          [tokenHash]
        );
        if (sessionRecord && sessionRecord.is_active === false) {
          return NextResponse.json(
            { authenticated: false, error: 'Session has been revoked or signed out from another device.' },
            { status: 401, headers: corsHeaders }
          );
        }
      }
    }

    // 2. Role-specific active account check
    if (user.role === 'trainer') {
      const trainer = await queryOne<{ is_active: boolean }>(
        `SELECT is_active FROM public.trainers WHERE (id::text = $1 OR profile_id::text = $1) LIMIT 1`,
        [user.userId]
      );
      if (!trainer || trainer.is_active === false) {
        return NextResponse.json(
          { authenticated: false, error: 'Faculty account has been deactivated. Please contact administration.' },
          { status: 401, headers: corsHeaders }
        );
      }
    } else if (user.role === 'student') {
      const student = await queryOne<{ status: string }>(
        `SELECT status FROM public.students WHERE (id::text = $1 OR profile_id::text = $1) LIMIT 1`,
        [user.userId]
      );
      if (!student || student.status === 'inactive') {
        return NextResponse.json(
          { authenticated: false, error: 'Student enrollment is currently inactive. Please contact administration.' },
          { status: 401, headers: corsHeaders }
        );
      }
    } else if (user.role === 'receptionist') {
      const staff = await queryOne<{ is_active: boolean }>(
        `SELECT is_active FROM public.receptionists WHERE id::text = $1 LIMIT 1`,
        [user.userId]
      );
      if (!staff || staff.is_active === false) {
        return NextResponse.json(
          { authenticated: false, error: 'Staff account has been deactivated. Please contact administration.' },
          { status: 401, headers: corsHeaders }
        );
      }
    }
  } catch (err) {
    console.warn('Session verification fallback warning:', err);
  }

  return NextResponse.json(
    { authenticated: true, user },
    { headers: corsHeaders }
  );
}
