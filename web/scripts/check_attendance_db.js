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

new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const { rows: countRows } = await pool.query(`SELECT COUNT(*) as count FROM public.attendance;`);
  console.log('Total attendance rows in db:', countRows[0].count);

  const { rows: sampleRows } = await pool.query(`
    SELECT a.id, a.session_id, s.session_date, b.name as batch_name, c.title as course_title,
           st.roll_number, p.full_name as student_name, a.status, a.check_in_time
    FROM public.attendance a
    JOIN public.class_sessions s ON s.id = a.session_id
    JOIN public.batches b ON b.id = s.batch_id
    JOIN public.courses c ON c.id = b.course_id
    JOIN public.students st ON st.id = a.student_id
    JOIN public.profiles p ON p.id = st.profile_id
    LIMIT 5;
  `);
  console.log('Sample attendance rows:', sampleRows);

  const { rows: sessionRows } = await pool.query(`SELECT COUNT(*) as count, MIN(session_date), MAX(session_date) FROM public.class_sessions;`);
  console.log('Class sessions range:', sessionRows[0]);

  await pool.end();
}

main().catch(console.error);
