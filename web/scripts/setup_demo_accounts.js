const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('=== SETTING UP / VERIFYING DEMO CREDENTIALS ===');

  // 1. ADMIN / OWNER: admin@laasyaacademy.com / Admin@123
  const adminEmail = 'admin@laasyaacademy.com';
  const adminPass = 'Admin@123';
  let adminUser = await pool.query('SELECT id FROM auth.users WHERE email = $1', [adminEmail]);
  if (adminUser.rows.length === 0) {
    console.log('Creating admin user...');
    const res = await pool.query(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        $1, crypt($2, gen_salt('bf')), now(),
        jsonb_build_object('full_name', 'Academy Administrator', 'role', 'owner'),
        now(), now()
      ) RETURNING id;
    `, [adminEmail, adminPass]);
    const adminId = res.rows[0].id;
    await pool.query(`
      INSERT INTO public.profiles (id, full_name, email, phone, role)
      VALUES ($1, 'Academy Administrator', $2, '+91 8151 998 899', 'owner')
      ON CONFLICT (id) DO UPDATE SET role = 'owner', full_name = 'Academy Administrator';
    `, [adminId, adminEmail]);
    console.log('Admin user created:', adminId);
  } else {
    const adminId = adminUser.rows[0].id;
    await pool.query(`
      UPDATE auth.users SET encrypted_password = crypt($2, gen_salt('bf')), updated_at = now()
      WHERE id = $1
    `, [adminId, adminPass]);
    await pool.query(`
      INSERT INTO public.profiles (id, full_name, email, phone, role)
      VALUES ($1, 'Academy Administrator', $2, '+91 8151 998 899', 'owner')
      ON CONFLICT (id) DO UPDATE SET role = 'owner';
    `, [adminId, adminEmail]);
    console.log('Admin password updated to Admin@123');
  }

  // Also ensure director@laasyaacademy.com has Director@123
  let dirUser = await pool.query("SELECT id FROM auth.users WHERE email = 'director@laasyaacademy.com'");
  if (dirUser.rows.length > 0) {
    await pool.query(`
      UPDATE auth.users SET encrypted_password = crypt('Director@123', gen_salt('bf')), updated_at = now()
      WHERE id = $1
    `, [dirUser.rows[0].id]);
    await pool.query(`
      UPDATE public.profiles SET role = 'owner' WHERE id = $1
    `, [dirUser.rows[0].id]);
    console.log('Director password updated to Director@123');
  }

  // 2. DEMO GURU: Smt. Anusha Sumesh (anusha@laasyaacademy.com / Guru@123, phone: +91 98765 00004)
  const guruEmail = 'anusha@laasyaacademy.com';
  const guruPass = 'Guru@123';
  let guruUser = await pool.query('SELECT id FROM auth.users WHERE email = $1', [guruEmail]);
  let guruId;
  if (guruUser.rows.length === 0) {
    const res = await pool.query(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        $1, crypt($2, gen_salt('bf')), now(),
        jsonb_build_object('full_name', 'Smt. Anusha Sumesh', 'role', 'trainer', 'phone', '+91 98765 00004'),
        now(), now()
      ) RETURNING id;
    `, [guruEmail, guruPass]);
    guruId = res.rows[0].id;
    await pool.query(`
      INSERT INTO public.profiles (id, full_name, email, phone, role, age, gender)
      VALUES ($1, 'Smt. Anusha Sumesh', $2, '+91 98765 00004', 'trainer', 36, 'female')
      ON CONFLICT (id) DO UPDATE SET role = 'trainer';
    `, [guruId, guruEmail]);
  } else {
    guruId = guruUser.rows[0].id;
    await pool.query(`
      UPDATE auth.users SET encrypted_password = crypt($2, gen_salt('bf')), updated_at = now()
      WHERE id = $1
    `, [guruId, guruPass]);
    await pool.query(`
      INSERT INTO public.profiles (id, full_name, email, phone, role, age, gender)
      VALUES ($1, 'Smt. Anusha Sumesh', $2, '+91 98765 00004', 'trainer', 36, 'female')
      ON CONFLICT (id) DO UPDATE SET role = 'trainer', full_name = 'Smt. Anusha Sumesh';
    `, [guruId, guruEmail]);
    console.log('Guru Anusha password updated to Guru@123');
  }

  // Ensure trainer row exists
  let trainerRow = await pool.query('SELECT id FROM public.trainers WHERE profile_id = $1', [guruId]);
  let trainerId;
  if (trainerRow.rows.length === 0) {
    const res = await pool.query(`
      INSERT INTO public.trainers (profile_id, specializations, display_title, bio, is_active, monthly_salary, age, gender)
      VALUES ($1, ARRAY['Bharatanatyam', 'Kuchipudi', 'Carnatic Vocal'], 'Head of Classical Dance & Senior Guru', 'Founder and Head Guru with 15+ years experience in Bharatanatyam and Carnatic music.', true, 45000, 36, 'female')
      RETURNING id;
    `, [guruId]);
    trainerId = res.rows[0].id;
  } else {
    trainerId = trainerRow.rows[0].id;
    await pool.query(`
      UPDATE public.trainers 
      SET specializations = ARRAY['Bharatanatyam', 'Kuchipudi', 'Carnatic Vocal'],
          display_title = 'Head of Classical Dance & Senior Guru',
          is_active = true
      WHERE id = $1
    `, [trainerId]);
  }
  console.log('Trainer row confirmed:', trainerId);

  // 3. DEMO STUDENT: Ananya Rao (roll: LCA-1, email: ananya.rao@example.com / Student@123, phone: +91 99123 45678)
  const stuEmail = 'ananya.rao@example.com';
  const stuPass = 'Student@123';
  let stuUser = await pool.query('SELECT id FROM auth.users WHERE email = $1', [stuEmail]);
  let stuProfileId;
  if (stuUser.rows.length === 0) {
    const res = await pool.query(`
      INSERT INTO auth.users (
        instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
        raw_user_meta_data, created_at, updated_at
      ) VALUES (
        '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated',
        $1, crypt($2, gen_salt('bf')), now(),
        jsonb_build_object('full_name', 'Ananya Rao', 'role', 'student', 'phone', '+91 99123 45678'),
        now(), now()
      ) RETURNING id;
    `, [stuEmail, stuPass]);
    stuProfileId = res.rows[0].id;
    await pool.query(`
      INSERT INTO public.profiles (id, full_name, email, phone, role, age, gender)
      VALUES ($1, 'Ananya Rao', $2, '+91 99123 45678', 'student', 16, 'female')
      ON CONFLICT (id) DO UPDATE SET role = 'student';
    `, [stuProfileId, stuEmail]);
  } else {
    stuProfileId = stuUser.rows[0].id;
    await pool.query(`
      UPDATE auth.users SET encrypted_password = crypt($2, gen_salt('bf')), updated_at = now()
      WHERE id = $1
    `, [stuProfileId, stuPass]);
    await pool.query(`
      INSERT INTO public.profiles (id, full_name, email, phone, role, age, gender)
      VALUES ($1, 'Ananya Rao', $2, '+91 99123 45678', 'student', 16, 'female')
      ON CONFLICT (id) DO UPDATE SET role = 'student', full_name = 'Ananya Rao';
    `, [stuProfileId, stuEmail]);
    console.log('Student Ananya password updated to Student@123');
  }

  // Ensure public.students row exists with roll_number = 'LCA-1'
  let stuRow = await pool.query("SELECT id FROM public.students WHERE roll_number = 'LCA-1'");
  let studentId;
  if (stuRow.rows.length === 0) {
    const res = await pool.query(`
      INSERT INTO public.students (
        profile_id, roll_number, parent_name, parent_relation, parent_contact,
        address, status, enrollment_date, advance_paid
      ) VALUES (
        $1, 'LCA-1', 'Sri Ramesh Rao', 'Father', '+91 99123 00001',
        'No. 204, Gachibowli, Hyderabad', 'active', '2026-01-15', 2000
      ) RETURNING id;
    `, [stuProfileId]);
    studentId = res.rows[0].id;
  } else {
    studentId = stuRow.rows[0].id;
    await pool.query(`
      UPDATE public.students
      SET profile_id = $1, parent_name = 'Sri Ramesh Rao', parent_contact = '+91 99123 00001', status = 'active'
      WHERE id = $2
    `, [stuProfileId, studentId]);
  }
  console.log('Student LCA-1 confirmed:', studentId);

  console.log('=== DEMO CREDENTIALS READY ===');
  console.log('1. Admin Login: admin@laasyaacademy.com / Admin@123 (or director@laasyaacademy.com / Director@123)');
  console.log('2. Guru Login: anusha@laasyaacademy.com / Guru@123 (or phone 9876500004 / Guru@123)');
  console.log('3. Student Login: ananya.rao@example.com / Student@123 (or roll LCA-1 / phone 9912345678 / Student@123)');

  await pool.end();
}

run().catch(console.error);
