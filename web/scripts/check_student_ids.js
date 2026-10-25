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
  const { rows } = await pool.query(`
    SELECT s.id, s.roll_number, p.full_name, s.status, s.enrollment_date
    FROM public.students s
    JOIN public.profiles p ON p.id = s.profile_id
    ORDER BY s.created_at ASC;
  `);
  console.log(`Found ${rows.length} students:`);
  rows.slice(0, 10).forEach((r, i) => console.log(`${i + 1}: ${r.roll_number} - ${r.full_name} (${r.status})`));
  await pool.end();
}

run().catch(console.error);
