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

async function populateIdentities() {
  console.log('Populating auth.identities from auth.users...');
  try {
    const res = await pool.query(`
      INSERT INTO auth.identities (provider_id, user_id, identity_data, provider, created_at, updated_at)
      SELECT 
        u.id::text as provider_id,
        u.id as user_id,
        jsonb_build_object('sub', u.id::text, 'email', u.email) as identity_data,
        'email' as provider,
        COALESCE(u.created_at, now()) as created_at,
        COALESCE(u.updated_at, now()) as updated_at
      FROM auth.users u
      ON CONFLICT (provider, provider_id) DO NOTHING;
    `);
    console.log('Inserted identities count:', res.rowCount);

    const totalRes = await pool.query('SELECT count(*)::int as count FROM auth.identities');
    console.log('Total auth.identities now:', totalRes.rows[0].count);

  } catch (err) {
    console.error('Error populating identities:', err);
  } finally {
    await pool.end();
  }
}

populateIdentities();
