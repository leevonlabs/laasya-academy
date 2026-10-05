const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres' });

async function run() {
  const before = await pool.query("SELECT status, count(*) FROM public.attendance GROUP BY status");
  console.log('Before update:', before.rows);

  const res = await pool.query("UPDATE public.attendance SET status = 'present' WHERE status = 'late'");
  console.log(`Updated ${res.rowCount} records from 'late' to 'present'`);

  const after = await pool.query("SELECT status, count(*) FROM public.attendance GROUP BY status");
  console.log('After update:', after.rows);

  await pool.end();
}

run().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
