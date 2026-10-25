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
