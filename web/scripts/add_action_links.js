const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres' });

async function addActionLinks() {
  await pool.query("ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS action_links JSONB DEFAULT '[]'::jsonb;");
  console.log('Successfully added action_links column to announcements table');
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'announcements' AND column_name = 'action_links'");
  console.log(res.rows);
  await pool.end();
}

addActionLinks().catch(console.error);
