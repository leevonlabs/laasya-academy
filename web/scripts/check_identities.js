const fs = require('fs');
const path = require('path');
const { Pool } = require('../node_modules/pg');

let dbUrl = '';
const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
for (const line of env.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
}

const poolOld = new Pool({ connectionString: dbUrl, ssl: { rejectUnauthorized: false } });

async function checkOldIdentities() {
  const count = await poolOld.query('SELECT count(*)::int as count FROM auth.identities');
  console.log('Old auth.identities count:', count.rows[0].count);
  const sample = await poolOld.query('SELECT * FROM auth.identities LIMIT 2');
  console.log('Old identities sample:', sample.rows);
  await poolOld.end();
}

checkOldIdentities();
