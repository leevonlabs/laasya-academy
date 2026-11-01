import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';
import { query, queryOne } from '@/lib/db';
import { getClientIp } from '@/lib/rate-limit';
import { parseDeviceDetails } from '@/lib/active-sessions';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET(req: NextRequest) {
  try {
    const user = await getCurrentUser(req);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401, headers: corsHeaders }
      );
    }

    const { searchParams } = new URL(req.url);
    const viewAll = searchParams.get('all') === 'true';
    const roleFilter = searchParams.get('role');
    const search = searchParams.get('q')?.trim() || '';

    const currentIp = getClientIp(req);
    const currentUserAgent = req.headers.get('user-agent') || '';
    const currentDevice = parseDeviceDetails(currentUserAgent, currentIp);

    // If Admin/Owner requests all sessions
    const isAdmin = ['owner', 'admin', 'developer'].includes(user.role?.toLowerCase());

    if (viewAll && isAdmin) {
      let sql = `
        SELECT
          s.id,
          s.user_id,
          s.profile_id,
          s.user_name,
          s.identifier,
          s.role,
          s.device_name,
          s.browser,
          s.os,
          s.ip_address,
          s.is_active,
          s.last_active_at,
          s.created_at
        FROM public.active_sessions s
        WHERE s.is_active = true
      `;
      const params: any[] = [];

      if (roleFilter && roleFilter !== 'all') {
        params.push(roleFilter.toLowerCase());
        sql += ` AND LOWER(s.role) = $${params.length}`;
      }

      if (search) {
        params.push(`%${search}%`);
        sql += ` AND (s.user_name ILIKE $${params.length} OR s.identifier ILIKE $${params.length} OR s.ip_address ILIKE $${params.length})`;
      }

      sql += ` ORDER BY s.last_active_at DESC LIMIT 100;`;

      const rows = await query<any>(sql, params);

      const sessions = rows.map((row: any) => ({
        ...row,
        is_current: row.user_id === user.userId && row.ip_address === currentIp && row.browser === currentDevice.browser,
      }));

      return NextResponse.json({ success: true, sessions }, { headers: corsHeaders });
    }

    // Normal User / Guru / Student - return their active sessions
    const userSql = `
      SELECT
        s.id,
        s.user_id,
        s.profile_id,
        s.user_name,
        s.identifier,
        s.role,
        s.device_name,
        s.browser,
        s.os,
        s.ip_address,
        s.is_active,
        s.last_active_at,
        s.created_at
      FROM public.active_sessions s
      WHERE (s.user_id = $1 OR s.profile_id = $1)
        AND s.is_active = true
      ORDER BY s.last_active_at DESC;
    `;

    const userRows = await query<any>(userSql, [user.userId]);

    let hasMatchedCurrent = false;
    const sessions = userRows.map((row: any) => {
      const isMatch = !hasMatchedCurrent && (
        (row.ip_address === currentIp && row.browser === currentDevice.browser) ||
        (userRows.length === 1)
      );
      if (isMatch) hasMatchedCurrent = true;

      return {
        ...row,
        is_current: isMatch,
      };
    });

    // If no session is marked current, mark the first one as current
    if (!hasMatchedCurrent && sessions.length > 0) {
      sessions[0].is_current = true;
    }

    return NextResponse.json({ success: true, sessions }, { headers: corsHeaders });
  } catch (err: any) {
    console.error('[ActiveSessions] GET error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
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

    const body = await req.json().catch(() => ({}));
    const { action, sessionId } = body;
    const isAdmin = ['owner', 'admin', 'developer'].includes(user.role?.toLowerCase());

    if (action === 'revoke_others') {
      // Deactivate all sessions for this user EXCEPT current sessionId
      if (sessionId) {
        await query(
          `UPDATE public.active_sessions
           SET is_active = false
           WHERE (user_id = $1 OR profile_id = $1) AND id != $2;`,
          [user.userId, sessionId]
        );
      } else {
        // If no sessionId specified, keep the latest session
        await query(
          `UPDATE public.active_sessions
           SET is_active = false
           WHERE (user_id = $1 OR profile_id = $1)
             AND id NOT IN (
               SELECT id FROM public.active_sessions
               WHERE (user_id = $1 OR profile_id = $1) AND is_active = true
               ORDER BY last_active_at DESC LIMIT 1
             );`,
          [user.userId]
        );
      }
      return NextResponse.json({ success: true, message: 'All other sessions revoked successfully' }, { headers: corsHeaders });
    }

    if (action === 'revoke' || !action) {
      if (!sessionId) {
        return NextResponse.json(
          { success: false, error: 'Session ID is required to revoke' },
          { status: 400, headers: corsHeaders }
        );
      }

      if (isAdmin) {
        // Admin can revoke any session
        await query(`UPDATE public.active_sessions SET is_active = false WHERE id = $1;`, [sessionId]);
      } else {
        // User can only revoke their own session
        await query(
          `UPDATE public.active_sessions
           SET is_active = false
           WHERE id = $1 AND (user_id = $2 OR profile_id = $2);`,
          [sessionId, user.userId]
        );
      }

      return NextResponse.json({ success: true, message: 'Session revoked successfully' }, { headers: corsHeaders });
    }

    return NextResponse.json(
      { success: false, error: 'Unknown action' },
      { status: 400, headers: corsHeaders }
    );
  } catch (err: any) {
    console.error('[ActiveSessions] POST error:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500, headers: corsHeaders }
    );
  }
}
