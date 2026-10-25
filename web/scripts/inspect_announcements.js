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
  connectionString: process.env.DATABASE_URL || dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const colRes = await pool.query(`
    SELECT column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'students'
    ORDER BY ordinal_position
  `);
  console.log('Columns:');
  console.table(colRes.rows);

  const constrRes = await pool.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'public.announcements'::regclass
  `);
  console.log('Constraints:');
  console.table(constrRes.rows);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
