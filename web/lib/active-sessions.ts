import { query, queryOne } from '@/lib/db';
import { getClientIp } from '@/lib/rate-limit';
import crypto from 'crypto';

export interface DeviceInfo {
  deviceName: string;
  browser: string;
  os: string;
  ip: string;
}

export function parseDeviceDetails(userAgentRaw: string, ip: string): DeviceInfo {
  const ua = userAgentRaw || '';
  let os = 'Unknown OS';
  let browser = 'Unknown Browser';
  let deviceName = 'Web Client';

  // Detect OS
  if (/windows/i.test(ua)) os = 'Windows';
  else if (/android/i.test(ua)) os = 'Android';
  else if (/iphone|ipad|ipod/i.test(ua)) os = 'iOS';
  else if (/macintosh|mac os x/i.test(ua)) os = 'macOS';
  else if (/linux/i.test(ua)) os = 'Linux';

  // Detect Browser / Platform
  if (/dart|flutter/i.test(ua)) {
    browser = 'Mobile App';
    deviceName = os === 'Android' ? 'Android App' : os === 'iOS' ? 'iOS App' : 'Laasya Mobile App';
  } else if (/edg/i.test(ua)) {
    browser = 'Microsoft Edge';
    deviceName = `Edge on ${os}`;
  } else if (/chrome|crios/i.test(ua)) {
    browser = 'Google Chrome';
    deviceName = `Chrome on ${os}`;
  } else if (/safari/i.test(ua) && !/chrome/i.test(ua)) {
    browser = 'Apple Safari';
    deviceName = `Safari on ${os}`;
  } else if (/firefox|fxios/i.test(ua)) {
    browser = 'Mozilla Firefox';
    deviceName = `Firefox on ${os}`;
  } else {
    deviceName = `${os} Device`;
  }

  // Mobile device specifics
  if (/mobile/i.test(ua) && os === 'Android' && browser !== 'Mobile App') {
    deviceName = `Chrome Mobile (${os})`;
  } else if (/mobile/i.test(ua) && os === 'iOS' && browser !== 'Mobile App') {
    deviceName = `Safari Mobile (${os})`;
  }

  return { deviceName, browser, os, ip: ip || '127.0.0.1' };
}

export function hashToken(token: string): string {
  if (!token) return '';
  return crypto.createHash('sha256').update(token).digest('hex').substring(0, 32);
}

export async function recordActiveSession(params: {
  userId: string;
  profileId?: string | null;
  userName?: string | null;
  identifier?: string | null;
  role: string;
  req: Request;
  token?: string | null;
}): Promise<string | null> {
  try {
    const ip = getClientIp(params.req);
    const userAgent = params.req.headers.get('user-agent') || '';
    const device = parseDeviceDetails(userAgent, ip);
    const tokenHash = params.token ? hashToken(params.token) : null;

    // Concurrent session cap per role to prevent credential sharing and DB bloat
    const maxAllowedSessions = ['owner', 'admin'].includes(params.role?.toLowerCase()) ? 3 : 2;

    // Automatically deactivate older active sessions exceeding the device limit
    await query(`
      UPDATE public.active_sessions
      SET is_active = false
      WHERE (user_id = $1 OR profile_id = $1)
        AND is_active = true
        AND id NOT IN (
          SELECT id FROM public.active_sessions
          WHERE (user_id = $1 OR profile_id = $1) AND is_active = true
          ORDER BY last_active_at DESC
          LIMIT $2
        );
    `, [params.userId, maxAllowedSessions - 1]).catch(() => {});

    // Opportunistic cleanup: purge stale inactive sessions older than 30 days
    await query(`
      DELETE FROM public.active_sessions
      WHERE is_active = false AND last_active_at < NOW() - INTERVAL '30 days';
    `).catch(() => {});

    const row = await queryOne<{ id: string }>(
      `INSERT INTO public.active_sessions (
        user_id, profile_id, user_name, identifier, role,
        device_name, browser, os, ip_address, user_agent,
        token_hash, is_active, last_active_at, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, true, NOW(), NOW())
      RETURNING id;`,
      [
        params.userId,
        params.profileId || params.userId,
        params.userName || 'Academy User',
        params.identifier || '',
        params.role,
        device.deviceName,
        device.browser,
        device.os,
        device.ip,
        userAgent.substring(0, 255),
        tokenHash,
      ]
    );

    return row?.id || null;
  } catch (err) {
    console.error('[ActiveSessions] Failed to record session:', err);
    return null;
  }
}
