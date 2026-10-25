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
  await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS gender text;`);
  await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS age int;`);

  await pool.query(`ALTER TABLE public.students ADD COLUMN IF NOT EXISTS gender text;`);
  await pool.query(`ALTER TABLE public.students ADD COLUMN IF NOT EXISTS age int;`);

  await pool.query(`ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS gender text;`);
  await pool.query(`ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS age int;`);

  console.log('Added age and gender columns to profiles, students, and trainers tables successfully!');
  await pool.end();
}

run().catch(console.error);
