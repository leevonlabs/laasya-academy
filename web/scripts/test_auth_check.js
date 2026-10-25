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

async function main() {
  const r = await pool.query(`
    SELECT count(*) FROM auth.users WHERE encrypted_password = crypt('123456', encrypted_password)
  `);
  console.log('Users with 123456 password:', r.rows[0].count);

  const adminUsers = await pool.query(`
    SELECT u.id, u.email, p.full_name, p.phone, p.role
    FROM auth.users u
    JOIN public.profiles p ON u.id = p.id
    WHERE p.role = 'owner'
  `);
  console.log('Admin users:');
  console.table(adminUsers.rows);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
