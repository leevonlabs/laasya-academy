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
