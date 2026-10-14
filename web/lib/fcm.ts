import { query } from './db';

interface PushTarget {
  fcm_token: string;
  platform: string;
  user_id?: string;
}

/**
 * Dispatches Push Notifications to Google Play Services (FCM) and Apple (APNs).
 * Supports standard HTTP v1 / REST delivery.
 */
export async function sendFcmMessages({
  tokens,
  title,
  body,
  data,
  androidChannelId,
  androidSound,
  iosSound,
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

  const fcmServerKey = process.env.FCM_SERVER_KEY || process.env.FIREBASE_SERVER_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID || 'laasya-academy';

  let successCount = 0;
  let failureCount = 0;

  // 1. If FCM Legacy Server Key is configured in environment:
  if (fcmServerKey) {
    try {
      const payload = {
        registration_ids: tokens,
        priority: 'high',
        notification: {
          title,
          body,
          sound: androidSound || 'default',
          android_channel_id: androidChannelId || 'laasya_notices_channel_v4',
        },
        data: {
          ...data,
          title,
          body,
        },
      };

      const res = await fetch('https://fcm.googleapis.com/fcm/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `key=${fcmServerKey}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      successCount = json.success || 0;
      failureCount = json.failure || 0;

      // Clean up stale/invalid tokens
      if (Array.isArray(json.results)) {
        for (let i = 0; i < json.results.length; i++) {
          const err = json.results[i]?.error;
          if (err === 'NotRegistered' || err === 'InvalidRegistration') {
            const badToken = tokens[i];
            await query(`DELETE FROM public.device_tokens WHERE fcm_token = $1`, [badToken]).catch(() => {});
          }
        }
      }
      return { successCount, failureCount };
    } catch (err) {
      console.error('Error sending legacy FCM push:', err);
    }
  }

  // 2. If Firebase Admin Service Account credentials are provided:
  let saData: any = null;
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    try {
      saData = typeof process.env.FIREBASE_SERVICE_ACCOUNT_KEY === 'string'
        ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
        : process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    } catch (_) {}
  }

  if (!saData && process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
    saData = {
      projectId: process.env.FIREBASE_PROJECT_ID || 'laasya-academy',
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  }

  if (!saData) {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const p = path.join(process.cwd(), 'firebase-service-account.json');
      if (fs.existsSync(p)) {
        saData = JSON.parse(fs.readFileSync(p, 'utf8'));
      }
    } catch (_) {}
  }

  if (saData) {
    try {
      const { getApps, initializeApp, cert } = await import('firebase-admin/app');
      const { getMessaging } = await import('firebase-admin/messaging');

      if (!getApps().length) {
        initializeApp({ credential: cert(saData) });
      }

      const messaging = getMessaging();
      const messagePayload = {
        notification: { title, body },
        data: {
          ...data,
          click_action: 'FLUTTER_NOTIFICATION_CLICK',
        },
        android: {
          priority: 'high' as const,
          notification: {
            channelId: androidChannelId || 'laasya_notices_channel_v4',
            sound: androidSound || 'default',
            priority: 'max' as const,
            defaultVibrateTimings: true,
          },
        },
        apns: {
          payload: {
            aps: {
              sound: iosSound || 'default',
              badge: 1,
              contentAvailable: true,
            },
          },
        },
      };

      const response = await messaging.sendEachForMulticast({
        tokens,
        ...messagePayload,
      });

      successCount = response.successCount;
      failureCount = response.failureCount;

      // Clean up stale tokens
      if (response.responses.length > 0) {
        for (let i = 0; i < response.responses.length; i++) {
          const resp = response.responses[i];
          if (!resp.success && resp.error) {
            const code = resp.error.code;
            if (code === 'messaging/registration-token-not-registered' || code === 'messaging/invalid-registration-token') {
              const badToken = tokens[i];
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

  console.log(`[FCM Push Log] Dispatch prepared for ${tokens.length} devices: "${title}" - Channel: ${androidChannelId || 'default'}`);
  return { successCount, failureCount };
}

/**
 * Sends Class Completed Push Alert ONLY to enrolled Students.
 * Gurus NEVER receive the student pickup ringtone or class-closed alert.
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
    // 1. Query device tokens strictly for STUDENTS enrolled in this batch (or all students if batch is 'all')
    const rows = await query<PushTarget>(`
      SELECT fcm_token, platform, user_id
      FROM public.device_tokens
      WHERE role = 'student'
        AND (
          batch_ids @> $1::jsonb
          OR batch_ids = '[]'::jsonb
          OR jsonb_array_length(batch_ids) = 0
          OR $2 = 'all'
        );
    `, [JSON.stringify([batchId]), batchId]);

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
      androidChannelId: 'laasya_class_completed_chime_v4',
      androidSound: 'class_completed',
      iosSound: 'class_completed.caf',
    });

    console.log(`[Class Completed Push] Dispatched to ${tokens.length} students (Success: ${result.successCount}).`);
    return { sent: tokens.length, ...result };
  } catch (err) {
    console.error('Error dispatching class completed push:', err);
    return { sent: 0, error: err };
  }
}

/**
 * Sends Announcements and Circulars to Gurus and/or Students with standard tone.
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
      SELECT fcm_token, platform, user_id
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
      androidChannelId: 'laasya_notices_channel_v4',
      androidSound: 'default',
      iosSound: 'default',
    });

    return { sent: tokens.length, ...result };
  } catch (err) {
    console.error('Error dispatching announcement push:', err);
    return { sent: 0, error: err };
  }
}
