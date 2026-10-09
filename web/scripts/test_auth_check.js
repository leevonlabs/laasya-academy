const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
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
