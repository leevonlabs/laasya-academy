const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const colRes = await pool.query(`
    SELECT column_name, data_type, udt_name, is_nullable
    FROM information_schema.columns
    WHERE table_name = 'students'
    ORDER BY ordinal_position
  `);
  console.log('Columns:');
  console.table(colRes.rows);

  const constrRes = await pool.query(`
    SELECT conname, pg_get_constraintdef(c.oid)
    FROM pg_constraint c
    JOIN pg_namespace n ON n.oid = c.connamespace
    WHERE conrelid = 'public.announcements'::regclass
  `);
  console.log('Constraints:');
  console.table(constrRes.rows);

  process.exit(0);
}

main().catch(e => { console.error(e); process.exit(1); });
