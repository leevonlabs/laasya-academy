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

async function checkAuthLogs() {
  try {
    const res = await pool.query(`
      SELECT query, calls, total_exec_time, min_exec_time, max_exec_time 
      FROM pg_stat_statements 
      WHERE query LIKE '%auth.users%' OR query LIKE '%identities%'
      ORDER BY total_exec_time DESC 
      LIMIT 10;
    `);
    console.log('Recent auth queries in pg_stat_statements:');
    for (const r of res.rows) {
      console.log('---');
      console.log(r.query);
    }
  } catch (e) {
    console.error('Error:', e.message);
  } finally {
    await pool.end();
  }
}

checkAuthLogs();
