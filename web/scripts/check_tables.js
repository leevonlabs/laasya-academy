const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres' });

async function run() {
  const vl = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'video_library' ORDER BY ordinal_position");
  console.log('VIDEO LIBRARY COLS:', vl.rows);
  const sample = await pool.query("SELECT id, title, drive_url, category, access_level, target_course_title FROM video_library LIMIT 5");
  console.log('SAMPLE VIDEO ROWS:', sample.rows);
  await pool.end();
}

run().catch(console.error);
