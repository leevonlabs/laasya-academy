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
  await pool.query(`ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;`);
  await pool.query(`ALTER TABLE public.students ADD COLUMN IF NOT EXISTS avatar_url text;`);
  await pool.query(`ALTER TABLE public.trainers ADD COLUMN IF NOT EXISTS avatar_url text;`);
  console.log('Columns added successfully if not existed!');
  await pool.end();
}

run().catch(console.error);
