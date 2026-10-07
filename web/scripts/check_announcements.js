const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres' });

async function check() {
  const res = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'announcements' ORDER BY ordinal_position");
  console.log('Announcements columns:', res.rows);
  await pool.end();
}

check().catch(console.error);
