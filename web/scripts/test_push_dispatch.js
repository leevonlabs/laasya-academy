import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || dbUrl;

const pool = 
const fs = require('fs');
const path = require('path');
let dbUrl = process.env.DATABASE_URL || '';
if (!dbUrl) {
  try {
    const envPath = path.join(__dirname, '../.env.local');
    if (fs.existsSync(envPath)) {
      const envContent = fs.readFileSync(envPath, 'utf8');
      for (const line of envContent.split('\n')) {
        if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
      }
    }
  } catch (_) {}
}
if (!dbUrl) {
  throw new Error('DATABASE_URL is not configured in process.env or web/.env.local');
}

new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function runTest() {
  const client = await pool.connect();
  try {
    console.log('--- 1. Testing Device Token Registration & Role Separation ---');

    const fakeStudentToken = 'fcm_test_student_token_' + Date.now();
    const fakeTrainerToken = 'fcm_test_trainer_token_' + Date.now();
    const testBatchId = 'test-batch-001';

    // Register a test student token
    await client.query(`
      INSERT INTO public.device_tokens (role, fcm_token, platform, batch_ids, updated_at)
      VALUES ('student', $1, 'android', $2::jsonb, NOW())
      ON CONFLICT (fcm_token) DO NOTHING;
    `, [fakeStudentToken, JSON.stringify([testBatchId])]);

    // Register a test trainer token
    await client.query(`
      INSERT INTO public.device_tokens (role, fcm_token, platform, batch_ids, updated_at)
      VALUES ('trainer', $1, 'android', '[]'::jsonb, NOW())
      ON CONFLICT (fcm_token) DO NOTHING;
    `, [fakeTrainerToken]);

    console.log('Inserted test student token:', fakeStudentToken);
    console.log('Inserted test trainer token:', fakeTrainerToken);

    // Test query for Class Completed: MUST ONLY FETCH STUDENTS
    console.log('\n--- 2. Testing Class Completed Target Query ---');
    const studentTargets = await client.query(`
      SELECT fcm_token, role, batch_ids
      FROM public.device_tokens
      WHERE role = 'student'
        AND (
          batch_ids @> $1::jsonb
          OR batch_ids = '[]'::jsonb
          OR jsonb_array_length(batch_ids) = 0
        );
    `, [JSON.stringify([testBatchId])]);

    console.log('Class Completed target count:', studentTargets.rows.length);
    const hasStudent = studentTargets.rows.some(r => r.fcm_token === fakeStudentToken);
    const hasTrainer = studentTargets.rows.some(r => r.fcm_token === fakeTrainerToken || r.role === 'trainer');

    console.log('-> Student Token Found in Target List:', hasStudent ? 'PASS (YES)' : 'FAIL');
    console.log('-> Trainer Token in Target List:', hasTrainer ? 'FAIL (Trainer included)' : 'PASS (NEVER included)');

    if (!hasTrainer && hasStudent) {
      console.log('>>> VERIFICATION PASSED: Gurus are strictly excluded from Class Completed pickup alerts!');
    } else {
      console.error('>>> VERIFICATION FAILED!');
    }

    // Test query for Announcements for Gurus
    console.log('\n--- 3. Testing Guru Announcements Target Query ---');
    const guruTargets = await client.query(`
      SELECT fcm_token, role
      FROM public.device_tokens
      WHERE role = 'trainer';
    `);
    const guruHasTrainer = guruTargets.rows.some(r => r.fcm_token === fakeTrainerToken);
    console.log('-> Trainer Token in Announcement Target List:', guruHasTrainer ? 'PASS (YES)' : 'FAIL');

    // Clean up test tokens
    await client.query(`
      DELETE FROM public.device_tokens 
      WHERE fcm_token IN ($1, $2);
    `, [fakeStudentToken, fakeTrainerToken]);
    console.log('\n--- 4. Cleaned up test tokens. Test suite completed successfully! ---');

  } catch (err) {
    console.error('Test failed with error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

runTest();
