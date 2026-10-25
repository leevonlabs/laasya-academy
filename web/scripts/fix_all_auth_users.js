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

async function fixAllAuthUsers() {
  console.log('Harmonizing auth tokens for all auth users...');
  
  // 1. Delete test probe user
  await pool.query("DELETE FROM auth.users WHERE email = 'test_probe@laasyaacademy.com'");
  console.log('Removed test probe user.');

  // 2. Harmonize null token strings to empty string as required by GoTrue
  const updateRes = await pool.query(`
    UPDATE auth.users
    SET 
      confirmation_token = COALESCE(confirmation_token, ''),
      recovery_token = COALESCE(recovery_token, ''),
      email_change_token_new = COALESCE(email_change_token_new, ''),
      email_change = COALESCE(email_change, ''),
      reauthentication_token = COALESCE(reauthentication_token, ''),
      email_change_token_current = COALESCE(email_change_token_current, ''),
      phone_change = COALESCE(phone_change, ''),
      phone_change_token = COALESCE(phone_change_token, '')
    WHERE 
      confirmation_token IS NULL OR
      recovery_token IS NULL OR
      email_change_token_new IS NULL OR
      email_change IS NULL OR
      reauthentication_token IS NULL OR
      email_change_token_current IS NULL OR
      phone_change IS NULL OR
      phone_change_token IS NULL;
  `);
  console.log(`Harmonized tokens for ${updateRes.rowCount} users.`);

  // 3. Verify total users count
  const countRes = await pool.query('SELECT count(*)::int as count FROM auth.users');
  console.log('Total auth users count in new DB:', countRes.rows[0].count);

  await pool.end();
}

fixAllAuthUsers();
