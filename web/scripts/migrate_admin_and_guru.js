const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  console.log('--- Running Schema & Data Updates ---');

  // 1. Announcements column updates
  await pool.query(`
    ALTER TABLE public.announcements 
    ALTER COLUMN trainer_id TYPE text;
  `);
  console.log('Updated announcements.trainer_id to text');

  await pool.query(`
    ALTER TABLE public.announcements 
    ADD COLUMN IF NOT EXISTS target_students jsonb,
    ADD COLUMN IF NOT EXISTS target_student_names text;
  `);
  console.log('Added target_students and target_student_names to announcements');

  // 2. Video library column updates
  await pool.query(`
    ALTER TABLE public.video_library 
    ALTER COLUMN trainer_id TYPE text;
  `);
  console.log('Updated video_library.trainer_id to text');

  await pool.query(`
    ALTER TABLE public.video_library 
    ADD COLUMN IF NOT EXISTS target_students jsonb,
    ADD COLUMN IF NOT EXISTS target_student_names text;
  `);
  console.log('Added target_students and target_student_names to video_library');

  // 3. Update Admin user Satya (Phone: 7780763121, Pass: 123456789)
  // Check if admin profile exists or update existing admin@laasyaacademy.com
  await pool.query(`
    UPDATE public.profiles
    SET full_name = 'Satya',
        phone = '7780763121',
        role = 'owner',
        updated_at = NOW()
    WHERE email = 'admin@laasyaacademy.com' OR email = 'director@laasyaacademy.com';
  `);
  console.log('Updated admin profile to Satya, phone: 7780763121');

  // Update password in auth.users for admin accounts
  await pool.query(`
    UPDATE auth.users
    SET encrypted_password = crypt('123456789', gen_salt('bf')),
        updated_at = NOW()
    WHERE email = 'admin@laasyaacademy.com' OR email = 'director@laasyaacademy.com';
  `);
  console.log('Updated auth.users password to 123456789 for admin');

  // Verify
  const verify = await pool.query(`
    SELECT u.id, u.email, p.full_name, p.phone, p.role
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id
    WHERE p.role = 'owner'
  `);
  console.table(verify.rows);

  process.exit(0);
}

run().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
