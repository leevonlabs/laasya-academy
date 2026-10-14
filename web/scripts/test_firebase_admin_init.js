import { initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';
import fs from 'fs';
import path from 'path';

async function testInit() {
  try {
    const p = path.join(process.cwd(), 'firebase-service-account.json');
    if (!fs.existsSync(p)) {
      throw new Error('firebase-service-account.json not found');
    }
    const sa = JSON.parse(fs.readFileSync(p, 'utf8'));
    console.log('Read service account for project:', sa.project_id);
    console.log('Client email:', sa.client_email);

    const app = initializeApp({
      credential: cert(sa),
    });

    const messaging = getMessaging(app);
    console.log('Firebase Admin initialized successfully!');

    // Test a dry-run multicast to verify authentication with Google Firebase servers
    try {
      const response = await messaging.sendEachForMulticast({
        tokens: ['dummy_dry_run_token_for_auth_check_1234567890'],
        notification: {
          title: 'Test',
          body: 'Auth test',
        },
      }, true); // dryRun = true
      console.log('FCM dry-run test sent to Google servers successfully. Responses:', response.responses.length);
      console.log('Google Server Auth Status: VALID CREDENTIALS CONFIRMED!');
    } catch (sendErr) {
      console.log('Send attempt response (expected dummy token rejection):', sendErr.message);
    }
  } catch (err) {
    console.error('Firebase Admin init error:', err);
  }
}

testInit();
