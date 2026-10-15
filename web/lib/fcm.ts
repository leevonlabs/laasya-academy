import { query, queryOne } from './db';

interface PushTarget {
  fcm_token: string;
  platform: string;
  user_id?: string;
}

let _cachedServiceAccount: any = null;

async function getFirebaseServiceAccount(): Promise<any> {
  if (_cachedServiceAccount) return _cachedServiceAccount;

  // 1. From environment variable (FIREBASE_SERVICE_ACCOUNT_KEY)
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      const parsed = typeof process.env.FIREBASE_SERVICE_ACCOUNT_KEY === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
      if (parsed?.project_id && parsed?.client_email) {
        _cachedServiceAccount = parsed;
        return _cachedServiceAccount;
      }
    } catch (_) {}
  }

  // 2. From individual environment variables
  if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    _cachedServiceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'laasya-academy',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
    return _cachedServiceAccount;
  }

  // 3. From local file on disk if present
  try {
    const fs = await import('fs');
    const path = await import('path');
    const p = path.join(process.cwd(), 'firebase-service-account.json');
    if (fs.existsSync(p)) {
      const sa = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (sa?.project_id && sa?.client_email) {
        _cachedServiceAccount = sa;
        return _cachedServiceAccount;
      }
    }
  } catch (_) {}

  // 4. From PostgreSQL database table public.app_config (Ensures Vercel production ALWAYS has credentials!)
  try {
    const row = await queryOne<{ config_value: any }>(
      `SELECT config_value FROM public.app_config WHERE config_key = 'firebase_service_account' LIMIT 1;`
    );
    if (row?.config_value) {
      const sa = typeof row.config_value === 'string'
        ? JSON.parse(row.config_value)
        : row.config_value;
      if (sa?.project_id && sa?.client_email) {
        _cachedServiceAccount = sa;
        return _cachedServiceAccount;
      }
    }
  } catch (dbErr) {
    console.warn('Could not query app_config for firebase credentials:', dbErr);
  }

  return null;
}

/**
 * Dispatches Push Notifications to Google Play Services (FCM) and Apple (APNs).
 */
export async function sendFcmMessages({
  tokens,
  title,
  body,
  data,
  androidChannelId = 'laasya_class_alerts_v5',
  androidSound = 'default',
  iosSound = 'default',
}: {
  tokens: string[];
  title: string;
  body: string;
  data: Record<string, string>;
  androidChannelId?: string;
  androidSound?: string;
  iosSound?: string;
}) {
  if (!tokens || tokens.length === 0) return { successCount: 0, failureCount: 0 };

  const uniqueTokens = Array.from(new Set(tokens.filter(t => Boolean(t && t.trim()))));
  if (uniqueTokens.length === 0) return { successCount: 0, failureCount: 0 };

  let successCount = 0;
  let failureCount = 0;

  const saData = await getFirebaseServiceAccount();

  if (saData) {
    try {
      const { getApps, initializeApp, cert } = await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');

      if (!getApps().length) {
        initializeApp({ credential: cert(saData) });
      }

      const messaging = getMessaging();
      const messagePayload = {
        notification: {
          title,
          body,
        },
        data: {
          ...data,
          title,
          body,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: androidChannelId,
            sound: androidSound,
            priority: 'max' as const,
            defaultVibrateTimings: true,
            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
          },
        },
        apns: {
          payload: {
            aps: {
              alert: { title, body },
              sound: iosSound,
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast({
        tokens: uniqueTokens,
        ...messagePayload,
      });

      successCount = response.successCount;
      failureCount = response.failureCount;

      console.log(`[FCM Multicast] Sent to ${uniqueTokens.length} devices -> Success: ${successCount}, Fail: ${failureCount}`);

      // Clean up stale or unregistered tokens
      if (response.responses.length > 0) {
        for (let i = 0; i < response.responses.length; i++) {
          const resp = response.responses[i];
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
              const badToken = uniqueTokens[i];
              await query(`DELETE FROM public.device_tokens WHERE fcm_token = $1`, [badToken]).catch(() => {});
            }
          }
        }
      }

      return { successCount, failureCount };
    } catch (adminErr) {
      console.warn('Firebase Admin send warning:', adminErr);
    }
  }

  console.log(`[FCM Push Log] Dispatch prepared for ${uniqueTokens.length} devices: "${title}" - Channel: ${androidChannelId}`);
  return { successCount, failureCount };
}

/**
 * Sends Class Completed Push Alert ONLY to enrolled Students.
 * Gurus NEVER receive student pickup ringtones or class-closed alerts.
 */
export async function sendClassCompletedPush({
  batchId,
  batchName,
  courseTitle,
  trainerName,
  message,
}: {
  batchId: string;
  batchName: string;
  courseTitle: string;
  trainerName: string;
  message?: string;
}) {
  try {
    const rows = await query<PushTarget>(`
      SELECT DISTINCT fcm_token, platform, user_id
      FROM public.device_tokens
      WHERE role = 'student'
        AND (
          batch_ids @> $1::jsonb
          OR batch_ids = '[]'::jsonb
          OR jsonb_array_length(batch_ids) = 0
          OR $2 = 'all'
          OR user_id IN (
            SELECT s.profile_id FROM public.students s
            WHERE s.batch_id::text = $2
               OR s.batch_id::text IN (SELECT id::text FROM public.batches WHERE name ILIKE '%' || $3 || '%')
          )
        );
    `, [JSON.stringify([batchId]), batchId, batchName || '']);

    if (!rows || rows.length === 0) {
      console.log(`[Class Completed Push] No student devices registered for batch ${batchId}.`);
      return { sent: 0 };
    }

    const tokens = rows.map(r => r.fcm_token).filter(Boolean);
    const title = `CLASS COMPLETED: ${courseTitle}`;
    const body = message || `The ${courseTitle} (${batchName}) session has concluded. Please come and pick up your child safely.`;

    const result = await sendFcmMessages({
      tokens,
      title,
      body,
      data: {
        alert_type: 'class_closed',
        batch_id: batchId,
        batch_name: batchName,
        course_title: courseTitle,
        trainer_name: trainerName || 'Assigned Guru',
        message: body,
        route: '/attendance',
      },
      androidChannelId: 'laasya_class_alerts_v5',
      androidSound: 'default',
      iosSound: 'default',
    });

    return { sent: tokens.length, ...result };
  } catch (err) {
    console.error('Error dispatching class completed push:', err);
    return { sent: 0, error: err };
  }
}

/**
 * Sends Announcements and Circulars to Gurus and/or Students with default alert sound.
 */
export async function sendAnnouncementPush({
  title,
  message,
  audience,
  targetBatchName,
  targetCourseTitle,
  senderRole,
  senderName,
}: {
  title: string;
  message: string;
  audience?: string;
  targetBatchName?: string;
  targetCourseTitle?: string;
  senderRole?: string;
  senderName?: string;
}) {
  try {
    const cleanAudience = (audience || 'all').toLowerCase();
    let roleFilter = "role IN ('trainer', 'student')";

    if (cleanAudience.includes('trainer') || cleanAudience.includes('guru') || cleanAudience.includes('faculty')) {
      roleFilter = "role = 'trainer'";
    } else if (cleanAudience.includes('student') || cleanAudience.includes('disciple')) {
      roleFilter = "role = 'student'";
    }

    const rows = await query<PushTarget>(`
      SELECT DISTINCT fcm_token, platform, user_id
      FROM public.device_tokens
      WHERE ${roleFilter};
    `);

    if (!rows || rows.length === 0) {
      return { sent: 0 };
    }

    const tokens = rows.map(r => r.fcm_token).filter(Boolean);
    const sender = senderName ? ` (${senderName})` : '';
    const notifTitle = `Academy Notice: ${title}`;
    const notifBody = `${message}${sender}`;

    const result = await sendFcmMessages({
      tokens,
      title: notifTitle,
      body: notifBody,
      data: {
        alert_type: 'announcement',
        title,
        message,
        sender_role: senderRole || 'admin',
        route: '/announcements',
      },
      androidChannelId: 'laasya_notices_channel_v5',
      androidSound: 'default',
      iosSound: 'default',
    });

    return { sent: tokens.length, ...result };
  } catch (err) {
    console.error('Error dispatching announcement push:', err);
    return { sent: 0, error: err };
  }
}

/**
 * Sends Live Attendance push alerts to relevant students.
 */
export async function sendAttendancePush({
  studentId,
  studentName,
  courseTitle,
  batchName,
  status,
  guruName,
}: {
  studentId: string;
  studentName: string;
  courseTitle: string;
  batchName: string;
  status: string;
  guruName: string;
}) {
  try {
    const rows = await query<PushTarget>(`
      SELECT DISTINCT dt.fcm_token, dt.platform, dt.user_id
      FROM public.device_tokens dt
      WHERE dt.role = 'student'
        AND (
          dt.user_id::text = $1
          OR dt.user_id IN (
            SELECT s.profile_id FROM public.students s 
            WHERE s.id::text = $1 OR s.profile_id::text = $1 OR LOWER(s.roll_number) = LOWER($1)
          )
        );
    `, [studentId]);

    if (!rows || rows.length === 0) return { sent: 0 };

    const statusUpper = status.toUpperCase();
    const isPresent = statusUpper === 'PRESENT';
    const tokens = rows.map(r => r.fcm_token).filter(Boolean);
    const title = isPresent ? 'Attendance Confirmed: PRESENT' : 'Attendance Alert: ABSENT';
    const body = `${studentName} was marked ${statusUpper} for ${courseTitle} (${batchName}) by Guru ${guruName}.`;

    const result = await sendFcmMessages({
      tokens,
      title,
      body,
      data: {
        alert_type: 'attendance_marked',
        student_id: studentId,
        student_name: studentName,
        course_title: courseTitle,
        batch_name: batchName,
        student_status: statusUpper,
        route: '/attendance',
      },
      androidChannelId: 'laasya_attendance_channel_v5',
      androidSound: 'default',
      iosSound: 'default',
    });

    return { sent: tokens.length, ...result };
  } catch (err) {
    console.error('Error dispatching attendance push:', err);
    return { sent: 0, error: err };
  }
}
