const fs = require('fs');
const path = require('path');
const { Pool } = require('../node_modules/pg');

let dbUrl = '';
try {
  const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
  for (const line of env.split('\n')) {
    if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
  }
} catch (_) {}
if (!dbUrl) dbUrl = process.env.DATABASE_URL || '';
const pool = new Pool({
  connectionString: dbUrl.replace(':6543/', ':5432/'),
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const res = await pool.query(
    "SELECT column_name, data_type, is_nullable, column_default FROM information_schema.columns WHERE table_schema = 'auth' AND table_name = 'identities' ORDER BY ordinal_position"
  );
  console.log('auth.identities columns:');
  console.table(res.rows);
  await pool.end();
}

run();
