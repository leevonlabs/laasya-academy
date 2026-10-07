const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres' });
async function check() {
  const pCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
  const tCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'trainers'");
  console.log('profiles cols:', pCols.rows.map(r => r.column_name + ' (' + r.data_type + ')').join(', '));
  console.log('trainers cols:', tCols.rows.map(r => r.column_name + ' (' + r.data_type + ')').join(', '));
  await pool.end();
}
check().catch(console.error);
