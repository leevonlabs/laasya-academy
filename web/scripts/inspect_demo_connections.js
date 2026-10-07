const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('--- GURU ANUSHA ---');
  const trainers = await pool.query(`
    SELECT t.id, t.profile_id, p.full_name, p.email, p.phone
    FROM public.trainers t
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE p.full_name ILIKE '%Anusha%'
  `);
  console.log(trainers.rows);

  console.log('--- BATCHES OF ANUSHA ---');
  const batches = await pool.query(`
    SELECT b.id, b.name, b.start_time, b.end_time, b.days_of_week, c.title as course_title, p.full_name as trainer_name
    FROM public.batches b
    JOIN public.courses c ON c.id = b.course_id
    JOIN public.trainers t ON t.id = b.trainer_id
    JOIN public.profiles p ON p.id = t.profile_id
    WHERE p.full_name ILIKE '%Anusha%'
  `);
  console.log(batches.rows);

  console.log('--- STUDENT LCA-1 ENROLLMENTS ---');
  const student = await pool.query(`
    SELECT s.id, s.roll_number, p.full_name, p.email, p.phone
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    WHERE s.roll_number = 'LCA-1'
  `);
  console.log(student.rows);

  if (student.rows.length > 0) {
    const enrollments = await pool.query(`
      SELECT be.id, b.name as batch_name, c.title as course_title, p.full_name as trainer_name
      FROM public.batch_enrollments be
      JOIN public.batches b ON b.id = be.batch_id
      JOIN public.courses c ON c.id = b.course_id
      JOIN public.trainers t ON t.id = b.trainer_id
      JOIN public.profiles p ON p.id = t.profile_id
      WHERE be.student_id = $1
    `, [student.rows[0].id]);
    console.log('Enrollments of LCA-1:', enrollments.rows);
  }

  await pool.end();
}

run().catch(console.error);
