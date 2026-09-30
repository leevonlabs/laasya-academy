const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const { rows } = await pool.query(`
    SELECT s.id, s.roll_number, p.full_name, s.status, s.enrollment_date
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    ORDER BY s.created_at ASC;
  `);
  console.log(`Found ${rows.length} students:`);
  rows.slice(0, 10).forEach((r, i) => console.log(`${i + 1}: ${r.roll_number} - ${r.full_name} (${r.status})`));
  await pool.end();
}

run().catch(console.error);
