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

async function migrate() {
  console.log('Running migrations...');
  
  // 1. video_library: allow drive_url to be null, add youtube_url and guru tracking columns
  await pool.query(`
    ALTER TABLE public.video_library ALTER COLUMN drive_url DROP NOT NULL;
    ALTER TABLE public.video_library ADD COLUMN IF NOT EXISTS youtube_url text;
    ALTER TABLE public.video_library ADD COLUMN IF NOT EXISTS shared_by_type text DEFAULT 'admin';
    ALTER TABLE public.video_library ADD COLUMN IF NOT EXISTS trainer_id uuid;
    ALTER TABLE public.video_library ADD COLUMN IF NOT EXISTS trainer_name text;
  `);
  console.log('✅ video_library altered successfully');

  // 2. announcements: add sender_role, trainer_id, trainer_name
  await pool.query(`
    ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS sender_role text DEFAULT 'admin';
    ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS trainer_id uuid;
    ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS trainer_name text;
  `);
  console.log('✅ announcements altered successfully');

  // Verify
  const colsVL = await pool.query("SELECT column_name, is_nullable FROM information_schema.columns WHERE table_name = 'video_library' AND column_name IN ('drive_url', 'youtube_url', 'shared_by_type', 'trainer_id', 'trainer_name');");
  console.log('VL verified cols:', colsVL.rows);

  const colsAnn = await pool.query("SELECT column_name FROM information_schema.columns WHERE table_name = 'announcements' AND column_name IN ('sender_role', 'trainer_id', 'trainer_name');");
  console.log('Ann verified cols:', colsAnn.rows);

  await pool.end();
}

migrate().catch(console.error);
