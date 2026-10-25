const { Pool } = require('pg');
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

new Pool({ connectionString: dbUrl });

async function run() {
  const vl = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'video_library' ORDER BY ordinal_position");
  console.log('VIDEO LIBRARY COLS:', vl.rows);
  const sample = await pool.query("SELECT id, title, drive_url, category, access_level, target_course_title FROM video_library LIMIT 5");
  console.log('SAMPLE VIDEO ROWS:', sample.rows);
  await pool.end();
}

run().catch(console.error);
