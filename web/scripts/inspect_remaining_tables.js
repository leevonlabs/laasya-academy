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
  connectionString: dbUrl
});

async function inspect() {
  const res = await pool.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('session_alerts', 'system_settings')
    ORDER BY table_name, ordinal_position;
  `);

  console.log('Columns:');
  for (const r of res.rows) {
    console.log(`${r.table_name.padEnd(18)} | ${r.column_name.padEnd(20)} | ${r.data_type.padEnd(15)} | null:${r.is_nullable}`);
  }

  await pool.end();
}

inspect().catch(console.error);
