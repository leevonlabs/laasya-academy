const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const { rows: allBatches } = await pool.query(`
    SELECT b.id, b.trainer_id, b.name, b.start_time, b.end_time, c.title as course_title
    FROM public.batches b
    JOIN public.courses c ON c.id = b.course_id;
  `);

  const { rows: students } = await pool.query(`
    SELECT s.id, p.full_name
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    LIMIT 6;
  `);

  const dates = ['2026-09-30', '2026-09-29', '2026-09-28', '2026-09-26', '2026-09-25'];

  for (const b of allBatches) {
    // Check if batch has any sessions
    const { rows: sess } = await pool.query(`SELECT id FROM public.class_sessions WHERE batch_id = $1;`, [b.id]);
    if (sess.length === 0) {
      console.log(`Seeding batch for ${b.course_title} (${b.name})...`);
      for (const st of students) {
        await pool.query(`
          INSERT INTO public.batch_enrollments (batch_id, student_id, status)
          VALUES ($1, $2, 'active')
          ON CONFLICT (batch_id, student_id) DO NOTHING;
        `, [b.id, st.id]);
      }

      for (const d of dates) {
        const sRes = await pool.query(`
          INSERT INTO public.class_sessions (
            batch_id, trainer_id, session_date, start_time, end_time, status, check_in_code, session_topic_notes
          ) VALUES ($1, $2, $3, $4, $5, 'completed', '123456', 'Session practice')
          RETURNING id;
        `, [b.id, b.trainer_id, d, b.start_time, b.end_time]);
        const sId = sRes.rows[0].id;

        for (let i = 0; i < students.length; i++) {
          const st = students[i];
          const status = i === 5 ? 'absent' : i === 4 ? 'late' : 'present';
          const time = status === 'absent' ? null : `${d}T17:15:00Z`;
          await pool.query(`
            INSERT INTO public.attendance (
              session_id, student_id, status, check_in_time, check_in_method, remarks
            ) VALUES ($1, $2, $3, $4, 'trainer_manual', 'Verified by Guru')
            ON CONFLICT (session_id, student_id) DO NOTHING;
          `, [sId, st.id, status, time]);
        }
      }
    }
  }

  const { rows: total } = await pool.query(`SELECT COUNT(*) as c FROM public.attendance;`);
  console.log(`Total attendance records now: ${total[0].c}`);
  await pool.end();
}

run().catch(console.error);
