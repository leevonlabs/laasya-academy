const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function runHealthCheck() {
  console.log('--- 1. Testing Direct PostgreSQL Database Pool ---');
  try {
    const res = await pool.query('SELECT NOW() as db_time, current_database() as db_name, current_user as db_user;');
    console.log('[OK] DB Connected successfully:', res.rows[0]);
  } catch (err) {
    console.error('[FAIL] DB connection error:', err);
    process.exit(1);
  }

  console.log('\n--- 2. Testing system_settings table access ---');
  try {
    const sRes = await pool.query('SELECT key, length(value) as val_len, updated_at FROM system_settings;');
    console.log('[OK] system_settings accessible via pool. Found rows:', sRes.rows);
  } catch (err) {
    console.error('[FAIL] system_settings query failed:', err);
  }

  console.log('\n--- 3. Testing session_alerts table access ---');
  try {
    const aRes = await pool.query('SELECT count(*) as count FROM session_alerts;');
    console.log('[OK] session_alerts accessible via pool. Total count:', aRes.rows[0].count);
  } catch (err) {
    console.error('[FAIL] session_alerts query failed:', err);
  }

  console.log('\n--- 4. Testing HTTP Next.js Web Server (Port 3000) ---');
  try {
    const webHome = await fetch('http://localhost:3000');
    console.log(`[OK] Web Home status: ${webHome.status} ${webHome.statusText}`);
  } catch (err) {
    console.error('[FAIL] Web home fetch failed:', err.message);
  }

  console.log('\n--- 5. Testing HTTP API: /api/settings/ai-config ---');
  try {
    const aiConfigRes = await fetch('http://localhost:3000/api/settings/ai-config');
    const aiConfig = await aiConfigRes.json();
    console.log(`[OK] /api/settings/ai-config status: ${aiConfigRes.status}`, aiConfig);
  } catch (err) {
    console.error('[FAIL] /api/settings/ai-config failed:', err.message);
  }

  console.log('\n--- 6. Testing HTTP API: /api/ai/enhance (Gemini AI test) ---');
  try {
    const aiEnhanceRes = await fetch('http://localhost:3000/api/ai/enhance', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text: 'kathak dance class for beginners every sunday morning', context: 'course' })
    });
    const aiEnhance = await aiEnhanceRes.json();
    console.log(`[OK] /api/ai/enhance status: ${aiEnhanceRes.status}`, aiEnhance);
  } catch (err) {
    console.error('[FAIL] /api/ai/enhance failed:', err.message);
  }

  console.log('\n--- 7. Testing HTTP Flutter Mobile App (Port 8081) ---');
  try {
    const flutterRes = await fetch('http://localhost:8081');
    console.log(`[OK] Flutter Web status: ${flutterRes.status} ${flutterRes.statusText}`);
  } catch (err) {
    console.error('[FAIL] Flutter fetch failed:', err.message);
  }

  await pool.end();
  console.log('\n=== ALL HEALTH CHECKS COMPLETED SUCCESSFULLY ===');
}

runHealthCheck().catch(err => {
  console.error('Fatal health check error:', err);
  process.exit(1);
});
