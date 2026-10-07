const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres' });

async function addAltPhone() {
  await pool.query("ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS alternate_phone text;");
  await pool.query("ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS alternate_phone text;");
  console.log('Successfully added alternate_phone column to trainers and profiles');
  await pool.end();
}

addAltPhone().catch(console.error);
