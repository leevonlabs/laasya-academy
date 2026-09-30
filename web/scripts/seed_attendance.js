const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function seedAttendance() {
  console.log('Seeding comprehensive attendance records across courses and batches...');

  // 1. Fetch all batches with course and trainer
  const { rows: batches } = await pool.query(`
    SELECT b.id, b.course_id, b.trainer_id, b.name, b.start_time, b.end_time
    FROM public.batches b;
  `);
  console.log(`Found ${batches.length} batches`);

  // 2. Fetch all students
  const { rows: students } = await pool.query(`
    SELECT s.id, s.roll_number, p.full_name
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id;
  `);
  console.log(`Found ${students.length} students`);

  // 3. Ensure students are enrolled across batches if not already
  for (let i = 0; i < students.length; i++) {
    const st = students[i];
    // enroll each student in 1 to 2 batches
    const b1 = batches[i % batches.length];
    const b2 = batches[(i + 3) % batches.length];
    
    await pool.query(`
      INSERT INTO public.batch_enrollments (batch_id, student_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (batch_id, student_id) DO NOTHING;
    `, [b1.id, st.id]);

    await pool.query(`
      INSERT INTO public.batch_enrollments (batch_id, student_id, status)
      VALUES ($1, $2, 'active')
      ON CONFLICT (batch_id, student_id) DO NOTHING;
    `, [b2.id, st.id]);
  }

  // 4. Seed sessions for the last 14 days up to today ('2026-09-30')
  const dates = [
    '2026-09-30', // TODAY!
    '2026-09-29',
    '2026-09-28',
    '2026-09-26',
    '2026-09-25',
    '2026-09-24',
    '2026-09-22',
    '2026-09-21',
    '2026-09-19',
    '2026-09-18'
  ];

  let sessionCount = 0;
  let attendanceCount = 0;

  for (const b of batches) {
    // For each date, create a session
    for (const d of dates) {
      // Check if session exists
      let sessionRow = (await pool.query(`
        SELECT id FROM public.class_sessions
        WHERE batch_id = $1 AND session_date = $2;
      `, [b.id, d])).rows[0];

      let sessionId = sessionRow?.id;
      if (!sessionId) {
        const insRes = await pool.query(`
          INSERT INTO public.class_sessions (
            batch_id, trainer_id, session_date, start_time, end_time, status, check_in_code, session_topic_notes
          ) VALUES ($1, $2, $3, $4, $5, 'completed', $6, $7)
          RETURNING id;
        `, [
          b.id,
          b.trainer_id,
          d,
          b.start_time,
          b.end_time,
          Math.floor(100000 + Math.random() * 900000).toString(),
          `Session topic: Core technique & practice drills for ${d}`
        ]);
        sessionId = insRes.rows[0].id;
        sessionCount++;
      }

      // Fetch students enrolled in this batch
      const { rows: enrolledStudents } = await pool.query(`
        SELECT student_id FROM public.batch_enrollments WHERE batch_id = $1 AND status = 'active';
      `, [b.id]);

      // For each enrolled student, insert attendance record if not exists
      for (let sIdx = 0; sIdx < enrolledStudents.length; sIdx++) {
        const stId = enrolledStudents[sIdx].student_id;
        const existingAtt = (await pool.query(`
          SELECT id FROM public.attendance WHERE session_id = $1 AND student_id = $2;
        `, [sessionId, stId])).rows[0];

        if (!existingAtt) {
          // Deterministic distribution: 85% present, 10% absent, 5% late
          const hash = (sIdx * 17 + dates.indexOf(d) * 31) % 100;
          let status = 'present';
          let method = hash % 2 === 0 ? 'student_code' : 'trainer_manual';
          let checkInTime = `${d}T17:${(10 + (hash % 15)).toString().padStart(2, '0')}:00Z`;
          let remarks = 'Verified by Guru desk';

          if (hash > 88) {
            status = 'absent';
            checkInTime = null;
            method = 'trainer_manual';
            remarks = 'Unexcused absence';
          } else if (hash > 78) {
            status = 'late';
            checkInTime = `${d}T17:${(25 + (hash % 10)).toString().padStart(2, '0')}:00Z`;
            method = 'student_qr';
            remarks = 'Arrived 15 mins late due to school commute';
          }

          await pool.query(`
            INSERT INTO public.attendance (
              session_id, student_id, status, check_in_time, check_in_method, remarks
            ) VALUES ($1, $2, $3, $4, $5, $6);
          `, [sessionId, stId, status, checkInTime, method, remarks]);
          attendanceCount++;
        }
      }
    }
  }

  console.log(`Created ${sessionCount} new class sessions and ${attendanceCount} new attendance records!`);
  
  // Total count in DB
  const totalAtt = (await pool.query(`SELECT COUNT(*) as count FROM public.attendance;`)).rows[0].count;
  console.log(`Total attendance records now in database: ${totalAtt}`);

  await pool.end();
}

seedAttendance().catch(console.error);
