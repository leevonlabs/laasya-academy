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

async function checkSampleIdentities() {
  const probeId = await pool.query("SELECT * FROM auth.identities WHERE email = 'test_probe@laasyaacademy.com'");
  console.log('Probe identity:', probeId.rows[0]);

  const existingId = await pool.query("SELECT * FROM auth.identities WHERE email != 'test_probe@laasyaacademy.com' LIMIT 1");
  console.log('Migrated identity:', existingId.rows[0]);

  await pool.end();
}

checkSampleIdentities();
