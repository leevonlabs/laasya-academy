const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('Running students table migration...');

  // 1. Add advance_paid column if not exists
  await pool.query(`
    ALTER TABLE public.students 
    ADD COLUMN IF NOT EXISTS advance_paid numeric DEFAULT 0;
  `);
  console.log('Added advance_paid column.');

  // 2. Fetch all students ordered by created_at
  const { rows: students } = await pool.query(`
    SELECT s.id, s.roll_number, s.created_at, p.full_name
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    ORDER BY s.created_at ASC;
  `);

  console.log(`Renaming ${students.length} student roll numbers to sequential LCA-1, LCA-2, ...`);
  for (let i = 0; i < students.length; i++) {
    const seqId = `LCA-${i + 1}`;
    await pool.query(`
      UPDATE public.students 
      SET roll_number = $1 
      WHERE id = $2;
    `, [seqId, students[i].id]);
  }

  // 3. Verify
  const { rows: updated } = await pool.query(`
    SELECT roll_number, p.full_name, s.advance_paid, s.enrollment_date, s.status
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    ORDER BY s.created_at ASC
    LIMIT 10;
  `);
  console.log('Updated students sample:');
  console.table(updated);

  await pool.end();
}

run().catch(console.error);
