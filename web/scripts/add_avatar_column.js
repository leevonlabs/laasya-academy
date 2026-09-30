const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;`);
  await pool.query(`ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url text;`);
  await pool.query(`ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS avatar_url text;`);
  console.log('Columns added successfully if not existed!');
  await pool.end();
}

run().catch(console.error);
