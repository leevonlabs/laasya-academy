const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const t = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'trainers'");
  console.log('trainers columns:', t.rows);
  const p = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
  console.log('profiles columns:', p.rows);
  await pool.end();
}

main().catch(console.error);
