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

const p = new Pool({
  connectionString: dbUrl.replace(':6543/', ':5432/'),
  ssl: { rejectUnauthorized: false }
});

async function inspectNewDb() {
  try {
    const tables = await p.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    console.log('Public tables in new DB (' + tables.rows.length + '):', tables.rows.map(r => r.table_name));

    const authUsers = await p.query('SELECT count(*)::int as count FROM auth.users');
    console.log('Auth users count in new DB:', authUsers.rows[0].count);
  } catch (e) {
    console.error('Inspection error:', e.message);
  } finally {
    await p.end();
  }
}

inspectNewDb();
