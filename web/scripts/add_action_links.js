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

async function addActionLinks() {
  await pool.query("ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS action_links JSONB DEFAULT '[]'::jsonb;");
  console.log('Successfully added action_links column to announcements table');
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'action_links'");
  console.log(res.rows);
  await pool.end();
}

addActionLinks().catch(console.error);
