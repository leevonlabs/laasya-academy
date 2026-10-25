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

new Pool({ connectionString: dbUrl });

async function run() {
  const before = await pool.query("SELECT status, count(*) FROM public.attendance GROUP BY status");
  console.log('Before update:', before.rows);

  const res = await pool.query("UPDATE public.attendance SET status = 'present' WHERE status = 'late'");
  console.log(`Updated ${res.rowCount} records from 'late' to 'present'`);

  const after = await pool.query("SELECT status, count(*) FROM public.attendance GROUP BY status");
  console.log('After update:', after.rows);

  await pool.end();
}

run().catch(err => {
  console.error(err);
  pool.end();
  process.exit(1);
});
