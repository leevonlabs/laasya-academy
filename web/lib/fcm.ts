import crypto from 'crypto';
import { query, queryOne } from '@/lib/db';

// Service account config with environment variable support or fallback
function getServiceAccount() {
  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    try {
      const parsed = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      if (parsed.private_key && parsed.client_email) return parsed;
    } catch (_) {
      try {
        const decoded = Buffer.from(process.env.FIREBASE_SERVICE_ACCOUNT, 'base64').toString('utf8');
        return JSON.parse(decoded);
      } catch (e) {
        console.warn('Failed to parse FIREBASE_SERVICE_ACCOUNT env var:', e);
      }
    }
  }

  const rawKey = process.env.FIREBASE_PRIVATE_KEY;
  const privateKey = rawKey ? rawKey.replace(/\\n/g, '\n') : null;

  return {
    type: "service_account",
    project_id: process.env.FIREBASE_PROJECT_ID || "laasya-academy",
    private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "",
    private_key: privateKey,
    client_email: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@laasya-academy.iam.gserviceaccount.com"
  };
}

let cachedAccessToken: { token: string; expiresAt: number } | null = null;

async function getGoogleAccessToken(): Promise<string> {
  const now = Math.floor(Date.now() / 1000);
  if (cachedAccessToken && cachedAccessToken.expiresAt > now + 60) {
    return cachedAccessToken.token;
  }

  const sa = getServiceAccount();
  if (!sa.private_key || !sa.client_email) {
    throw new Error('FCM push notification service requires FIREBASE_PRIVATE_KEY or FIREBASE_SERVICE_ACCOUNT to be configured in server environment.');
  }

  const header = { alg: 'RS256', typ: 'JWT' };
  const payload = {
    iss: sa.client_email,
    scope: 'https://www.googleapis.com/auth/firebase.messaging',
    aud: 'https://oauth2.googleapis.com/token',
    exp: now + 3600,
    iat: now
  };

  const b64 = (obj: any) => Buffer.from(JSON.stringify(obj)).toString('base64url');
  const signInput = `${b64(header)}.${b64(payload)}`;
  const signer = crypto.createSign('RSA-SHA256');
  signer.update(signInput);
  const sig = signer.sign(sa.private_key, 'base64url');
  const jwt = `${signInput}.${sig}`;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
      assertion: jwt
    })
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Failed to fetch Google OAuth token: ${res.status} ${errorText}`);
  }

  const data = await res.json();
  cachedAccessToken = {
    token: data.access_token,
    expiresAt: now + (data.expires_in || 3600)
  };

  return cachedAccessToken.token;
}

export interface FcmNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  sound?: string;
  channelId?: string;
  route?: string;
}

/**
 * Sends a single FCM message using the HTTP v1 API.
 * Automatically cleans up invalid/unregistered device tokens.
 */
export async function sendFcmMessage(token: string, payload: FcmNotificationPayload): Promise<boolean> {
  try {
    const sa = getServiceAccount();
    if (!sa.private_key || !sa.client_email) {
      if (getCurrentAppEnv() === 'development') {
        console.log(`[FCM] [Dev Mode] Skipping FCM push dispatch: Firebase credentials not configured in local environment.`);
        return false;
      }
    }

    const accessToken = await getGoogleAccessToken();
    const projectId = sa.project_id || 'laasya-academy';

    const channelId = payload.channelId || (
      payload.data?.type === 'class_closed' || payload.data?.type === 'attendance_marked' 
        ? 'laasya_classes' 
        : 'laasya_announcements'
    );

    const targetRoute = payload.route || payload.data?.route || '/announcements';

    const message = {
      token,
      notification: {
        title: payload.title,
        body: payload.body
      },
      data: {
        ...(payload.data || {}),
        title: payload.title,
        body: payload.body,
        route: targetRoute,
        click_action: 'FLUTTER_NOTIFICATION_CLICK'
      },
      android: {
        priority: 'HIGH' as const,
        notification: {
          channel_id: channelId,
          sound: payload.sound || 'default',
          default_sound: true,
          default_vibrate_timings: true,
          notification_priority: 'PRIORITY_HIGH' as const,
          visibility: 'PUBLIC' as const,
          icon: 'ic_launcher',
          click_action: 'FLUTTER_NOTIFICATION_CLICK'
        }
      },
      apns: {
        headers: {
          'apns-priority': '10'
        },
        payload: {
          aps: {
            alert: {
              title: payload.title,
              body: payload.body
            },
            sound: payload.sound || 'default',
            badge: 1
          }
        }
      }
    };

    const res = await fetch(`https://fcm.googleapis.com/v1/projects/${projectId}/messages:send`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ message })
    });

    if (res.ok) {
      const respData = await res.json().catch(() => ({}));
      console.log(`[FCM] Push dispatched successfully to token ${token.substring(0, 12)}... (FCM ID: ${respData?.name || 'ok'})`);
      return true;
    }

    const errData = await res.json().catch(() => ({}));
    const errCode = errData?.error?.details?.[0]?.errorCode || errData?.error?.status;
    
    // Clean up ONLY when token is confirmed unregistered or not found
    if (errCode === 'UNREGISTERED' || res.status === 404) {
      console.warn(`[FCM] Deleting unregistered/expired token: ${token.substring(0, 16)}...`);
      await query(`DELETE FROM public.device_tokens WHERE fcm_token = $1;`, [token]);
    } else {
      console.error(`[FCM] Delivery failed with HTTP ${res.status}:`, errData?.error?.message || errData);
    }
    return false;
  } catch (err) {
    console.error('[FCM] Exception while sending message:', err);
    return false;
  }
}

export type AppEnvironment = 'development' | 'production';

/**
 * Returns the current application environment.
 * In local development, defaults to 'development'.
 * On Vercel production or when APP_ENV/NODE_ENV is production, returns 'production'.
 */
export function getCurrentAppEnv(): AppEnvironment {
  const env = (process.env.APP_ENV || process.env.NODE_ENV || 'development').toLowerCase().trim();
  if (env === 'production' || env === 'prod') {
    return 'production';
  }
  return 'development';
}

/**
 * Register or update a device token for a student or trainer
 */
export async function registerDeviceToken(params: {
  userId: string;
  role: string;
  token: string;
  platform?: string;
  batchIds?: string[];
  environment?: string;
}): Promise<void> {
  const { userId, role, token, platform = 'android', batchIds = [], environment } = params;
  if (!token || !userId) return;

  // Safe server-side validation:
  // Legacy production APKs omit the 'environment' parameter.
  // We NEVER default unknown devices to 'development'.
  // Any device that does not explicitly pass environment === 'development' is safely treated as 'production'.
  const targetEnv: AppEnvironment = (environment === 'development') ? 'development' : 'production';

  let resolvedBatchIds = [...batchIds];

  // If no batchIds provided by client, auto-resolve user's enrolled or assigned batches
  if (resolvedBatchIds.length === 0) {
    try {
      if (role === 'trainer') {
        const tb = await query<{ id: string }>(`
          SELECT id FROM public.batches 
          WHERE trainer_id::text = $1 
             OR trainer_id IN (SELECT id FROM public.trainers WHERE profile_id::text = $1);
        `, [userId]);
        resolvedBatchIds = tb.map(b => b.id);
      } else {
        const be = await query<{ batch_id: string }>(`
          SELECT be.batch_id FROM public.batch_enrollments be
          LEFT JOIN public.students s ON s.id = be.student_id
          WHERE be.student_id::text = $1 
             OR s.profile_id::text = $1 
             OR s.id::text = $1;
        `, [userId]);
        resolvedBatchIds = be.map(b => b.batch_id);
      }
    } catch (resolveErr) {
      console.warn('[FCM] Error auto-resolving batches for token:', resolveErr);
    }
  }

  await query(`
    INSERT INTO public.device_tokens (user_id, role, fcm_token, platform, batch_ids, environment, updated_at)
    VALUES ($1, $2, $3, $4, $5, $6, NOW())
    ON CONFLICT (fcm_token) 
    DO UPDATE SET 
      user_id = EXCLUDED.user_id,
      role = EXCLUDED.role,
      platform = EXCLUDED.platform,
      environment = EXCLUDED.environment,
      batch_ids = CASE 
        WHEN jsonb_array_length(EXCLUDED.batch_ids) > 0 THEN EXCLUDED.batch_ids 
        ELSE public.device_tokens.batch_ids 
      END,
      updated_at = NOW();
  `, [userId, role, token, platform, JSON.stringify(resolvedBatchIds), targetEnv]);
}

/**
 * Send notification to all devices enrolled in a batch (strictly filtered by environment)
 */
export async function sendFcmToBatch(
  batchId: string, 
  payload: FcmNotificationPayload,
  envOverride?: AppEnvironment
): Promise<number> {
  if (!batchId) return 0;

  const currentEnv = envOverride || getCurrentAppEnv();
  const batchIds = batchId.split(',').map(b => b.trim()).filter(Boolean);
  if (batchIds.length === 0) return 0;

  console.log(`[FCM] sendFcmToBatch in environment [${currentEnv}] for batches:`, batchIds);

  // Explicit environment filtering:
  // Development queries strictly select explicitly valid development tokens ('development').
  // Production queries strictly select explicitly valid production tokens ('production').
  const envFilterSql = currentEnv === 'development'
    ? `dt.environment = 'development'`
    : `dt.environment = 'production'`;

  const rows = await query<{ fcm_token: string }>(`
    SELECT DISTINCT dt.fcm_token 
    FROM public.device_tokens dt
    LEFT JOIN public.students s ON (s.profile_id = dt.user_id OR s.id = dt.user_id)
    LEFT JOIN public.batch_enrollments be ON (be.student_id = s.id OR be.student_id = dt.user_id)
    LEFT JOIN public.trainers t ON (t.profile_id = dt.user_id OR t.id = dt.user_id)
    LEFT JOIN public.batches tb ON (tb.trainer_id = t.id OR tb.trainer_id = dt.user_id)
    WHERE ${envFilterSql}
      AND (
        dt.batch_ids ?| $1::text[]
        OR be.batch_id::text = ANY($1::text[])
        OR tb.id::text = ANY($1::text[])
        OR dt.role = 'admin'
      );
  `, [batchIds]);

  console.log(`[FCM] Target tokens found in [${currentEnv}]: ${rows.length}`);

  let sent = 0;
  for (const r of rows) {
    if (r.fcm_token) {
      const ok = await sendFcmMessage(r.fcm_token, payload);
      if (ok) sent++;
    }
  }
  return sent;
}

/**
 * Send notification to all devices enrolled in batches belonging to a specific course (strictly filtered by environment)
 */
export async function sendFcmToCourse(
  courseId: string, 
  payload: FcmNotificationPayload,
  envOverride?: AppEnvironment
): Promise<number> {
  if (!courseId) return 0;

  const currentEnv = envOverride || getCurrentAppEnv();
  const courseIds = courseId.split(',').map(c => c.trim()).filter(Boolean);
  if (courseIds.length === 0) return 0;

  console.log(`[FCM] sendFcmToCourse in environment [${currentEnv}] for courses:`, courseIds);

  const envFilterSql = currentEnv === 'development'
    ? `dt.environment = 'development'`
    : `dt.environment = 'production'`;

  const rows = await query<{ fcm_token: string }>(`
    SELECT DISTINCT dt.fcm_token 
    FROM public.device_tokens dt
    LEFT JOIN public.students s ON (s.profile_id = dt.user_id OR s.id = dt.user_id)
    LEFT JOIN public.batch_enrollments be ON (be.student_id = s.id OR be.student_id = dt.user_id)
    LEFT JOIN public.batches b ON b.id = be.batch_id
    LEFT JOIN public.trainers t ON (t.profile_id = dt.user_id OR t.id = dt.user_id)
    LEFT JOIN public.batches tb ON (tb.trainer_id = t.id OR tb.trainer_id = dt.user_id)
    WHERE ${envFilterSql}
      AND (
        b.course_id::text = ANY($1::text[])
        OR tb.course_id::text = ANY($1::text[])
        OR dt.role = 'admin'
      );
  `, [courseIds]);

  console.log(`[FCM] Target tokens found in [${currentEnv}]: ${rows.length}`);

  let sent = 0;
  for (const r of rows) {
    if (r.fcm_token) {
      const ok = await sendFcmMessage(r.fcm_token, payload);
      if (ok) sent++;
    }
  }
  return sent;
}

/**
 * Send notification to all devices belonging to a specific role ('student', 'trainer', 'all') (strictly filtered by environment)
 */
export async function sendFcmToRole(
  role: 'student' | 'trainer' | 'all', 
  payload: FcmNotificationPayload,
  envOverride?: AppEnvironment
): Promise<number> {
  const currentEnv = envOverride || getCurrentAppEnv();
  console.log(`[FCM] sendFcmToRole in environment [${currentEnv}] for role [${role}]`);

  const envFilterSql = currentEnv === 'development'
    ? `environment = 'development'`
    : `environment = 'production'`;

  let sql = `SELECT DISTINCT fcm_token FROM public.device_tokens WHERE ${envFilterSql}`;
  const params: any[] = [];
  if (role !== 'all') {
    sql += ` AND role = $1`;
    params.push(role);
  }

  const rows = await query<{ fcm_token: string }>(sql, params);
  console.log(`[FCM] Target tokens found in [${currentEnv}]: ${rows.length}`);

  let sent = 0;
  for (const r of rows) {
    if (r.fcm_token) {
      const ok = await sendFcmMessage(r.fcm_token, payload);
      if (ok) sent++;
    }
  }
  return sent;
}

/**
 * Send notification to a specific user (handles student_id, trainer_id, or profile_id) (strictly filtered by environment)
 */
export async function sendFcmToUser(
  userId: string, 
  payload: FcmNotificationPayload,
  envOverride?: AppEnvironment
): Promise<number> {
  if (!userId) return 0;
  const currentEnv = envOverride || getCurrentAppEnv();
  console.log(`[FCM] sendFcmToUser in environment [${currentEnv}] for user [${userId}]`);

  const envFilterSql = currentEnv === 'development'
    ? `dt.environment = 'development'`
    : `dt.environment = 'production'`;

  const rows = await query<{ fcm_token: string }>(`
    SELECT DISTINCT dt.fcm_token 
    FROM public.device_tokens dt
    LEFT JOIN public.students s ON (s.profile_id = dt.user_id OR s.id = dt.user_id)
    LEFT JOIN public.trainers t ON (t.profile_id = dt.user_id OR t.id = dt.user_id)
    WHERE ${envFilterSql}
      AND (
        dt.user_id::text = $1
        OR s.id::text = $1
        OR s.profile_id::text = $1
        OR t.id::text = $1
        OR t.profile_id::text = $1
      );
  `, [userId]);

  console.log(`[FCM] Target tokens found in [${currentEnv}]: ${rows.length}`);

  let sent = 0;
  for (const r of rows) {
    if (r.fcm_token) {
      const ok = await sendFcmMessage(r.fcm_token, payload);
      if (ok) sent++;
    }
  }
  return sent;
}
