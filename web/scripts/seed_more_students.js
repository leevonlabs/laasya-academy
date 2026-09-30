const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

const NEW_STUDENTS = [
  { name: 'Aditi Sundaram', phone: '+91 98450 11001', parent: 'Sundaram Ramaswamy', course: 'Bharathanatyam', roll: 'LCA-10021' },
  { name: 'Rohan Mehra', phone: '+91 98450 11002', parent: 'Vikram Mehra', course: 'Violin', roll: 'LCA-10022' },
  { name: 'Ananya Deshmukh', phone: '+91 98450 11003', parent: 'Sanjay Deshmukh', course: 'Carnatic Music', roll: 'LCA-10023' },
  { name: 'Pranav Bhat', phone: '+91 98450 11004', parent: 'Kishore Bhat', course: 'Karatte', roll: 'LCA-10024' },
  { name: 'Meera Nambiar', phone: '+91 98450 11005', parent: 'Gopinath Nambiar', course: 'Mohiniyatam', roll: 'LCA-10025' },
  { name: 'Tanvi Hegde', phone: '+91 98450 11006', parent: 'Raghavendra Hegde', course: 'Kuchupudi', roll: 'LCA-10026' },
  { name: 'Dhruv Kulkarni', phone: '+91 98450 11007', parent: 'Mahesh Kulkarni', course: 'Keyboard', roll: 'LCA-10027' },
  { name: 'Saanvi Iyer', phone: '+91 98450 11008', parent: 'Narayanan Iyer', course: 'Drawing', roll: 'LCA-10028' },
  { name: 'Aryan Sharma', phone: '+91 98450 11009', parent: 'Ramesh Sharma', course: 'Guitar', roll: 'LCA-10029' },
  { name: 'Diya Krishnakumar', phone: '+91 98450 11010', parent: 'Krishnakumar P', course: 'Semi Classical', roll: 'LCA-10030' },
  { name: 'Kavya Pillai', phone: '+91 98450 11011', parent: 'Suresh Pillai', course: 'Kalari', roll: 'LCA-10031' },
  { name: 'Siddharth Varma', phone: '+91 98450 11012', parent: 'Arun Varma', course: 'Chess', roll: 'LCA-10032' },
  { name: 'Pooja Venkatesh', phone: '+91 98450 11013', parent: 'Venkatesh Rao', course: 'Yoga', roll: 'LCA-10033' },
  { name: 'Nikhil Gowda', phone: '+91 98450 11014', parent: 'Basavaraj Gowda', course: 'Western Dance', roll: 'LCA-10034' },
  { name: 'Ishaan Nair', phone: '+91 98450 11015', parent: 'Manoj Nair', course: 'Art and Craft', roll: 'LCA-10035' }
];

async function run() {
  console.log('Seeding 15 additional academy students...');
  const batches = (await pool.query('SELECT b.id, b.course_id, c.title FROM public.batches b JOIN public.courses c ON c.id = b.course_id')).rows;

  for (let i = 0; i < NEW_STUDENTS.length; i++) {
    const s = NEW_STUDENTS[i];
    const email = `${s.name.toLowerCase().replace(/\s+/g, '.')}@laasyastudent.com`;

    // Check if user already exists
    let userRow = (await pool.query('SELECT id FROM auth.users WHERE email = $1', [email])).rows[0];
    let uid = userRow?.id;

    if (!uid) {
      const authRes = await pool.query(`
        INSERT INTO auth.users (
          instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
          raw_user_meta_data, created_at, updated_at
        ) VALUES (
          '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
          $1, crypt('student123', gen_salt('bf')), now(),
          jsonb_build_object('full_name', $2::text, 'role', 'student', 'phone', $3::text),
          now(), now()
        )
        RETURNING id;
      `, [email, s.name, s.phone]);
      uid = authRes.rows[0].id;
    }

    // 2. Insert into profiles
    await pool.query(`
      INSERT INTO public.profiles (id, role, full_name, email, phone)
      VALUES ($1, 'student', $2, $3, $4)
      ON CONFLICT (id) DO UPDATE SET full_name = EXCLUDED.full_name, phone = EXCLUDED.phone;
    `, [uid, s.name, email, s.phone]);

    // 3. Check if student record exists
    let stuRow = (await pool.query('SELECT id FROM public.students WHERE profile_id = $1', [uid])).rows[0];
    let studentId = stuRow?.id;

    if (!studentId) {
      const stuRes = await pool.query(`
        INSERT INTO public.students (profile_id, roll_number, parent_name, emergency_contact, status, enrollment_date)
        VALUES ($1, $2, $3, $4, 'active', '2026-01-10')
        RETURNING id;
      `, [uid, s.roll, s.parent, s.phone]);
      studentId = stuRes.rows[0].id;
    }

    // 4. Enroll in matching or rotating batch
    const matchedBatch = batches.find(b => b.title.toLowerCase().includes(s.course.toLowerCase())) || batches[i % batches.length];
    if (matchedBatch) {
      await pool.query(`
        INSERT INTO public.batch_enrollments (batch_id, student_id, status)
        VALUES ($1, $2, 'active')
        ON CONFLICT DO NOTHING;
      `, [matchedBatch.id, studentId]);
    }
  }

  console.log('Successfully seeded 15 students and batch enrollments.');
  await pool.end();
}

run().catch(err => {
  console.error('Error:', err);
  pool.end();
  process.exit(1);
});
