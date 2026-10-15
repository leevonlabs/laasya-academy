import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;

async function testSend() {
  const p = path.join(process.cwd(), 'firebase-service-account.json');
  const sa = JSON.parse(fs.readFileSync(p, 'utf8'));
  const app = initializeApp({ credential: cert(sa) });
  const messaging = getMessaging(app);

  const pool = new Pool({
    connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
    ssl: { rejectUnauthorized: false },
  });

  const res = await pool.query('SELECT * FROM public.device_tokens ORDER BY updated_at DESC LIMIT 5');
  console.log('Found tokens:', res.rows.map(r => ({ role: r.role, token: r.fcm_token.substring(0, 15) + '...', platform: r.platform })));

  const studentTokens = res.rows.filter(r => r.role === 'student').map(r => r.fcm_token);
  console.log('Testing send to student tokens:', studentTokens.length);

  for (const token of studentTokens) {
    try {
      console.log('Sending test message to token:', token.substring(0, 20) + '...');
      const response = await messaging.send({
        token,
        notification: {
          title: 'CLASS COMPLETED: Kuchipudi Dance',
          body: 'Today session has concluded. Please come and collect your child.',
        },
        data: {
          alert_type: 'class_closed',
          title: 'CLASS COMPLETED: Kuchipudi Dance',
          message: 'Today session has concluded. Please come and collect your child.',
          route: '/attendance',
        },
        android: {
          priority: 'high',
          notification: {
            channelId: 'laasya_class_alerts_v5',
            sound: 'default',
            priority: 'max',
            defaultVibrateTimings: true,
          },
        },
      });
      console.log('Successfully sent! Response ID:', response);
    } catch (err) {
      console.error('Error sending to token:', err);
    }
  }

  await pool.end();
}

testSend();
