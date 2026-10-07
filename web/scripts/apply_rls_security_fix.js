const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function applyRLS() {
  const sqlFile = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20261007000001_enable_rls_all_tables.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Connecting to Supabase PostgreSQL database...');
  const client = await pool.connect();

  try {
    console.log('Executing RLS migration script...');
    await client.query(sql);
    console.log('Successfully enabled RLS and applied security policies!\n');

    // Verify all tables in public schema
    const checkRes = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE schemaname = 'public'
      ORDER BY tablename;
    `);

    console.log('=== VERIFICATION OF ALL PUBLIC TABLES ===');
    let allEnabled = true;
    for (const r of checkRes.rows) {
      const status = r.rowsecurity ? 'ENABLED (SECURE)' : '*** STILL DISABLED ***';
      if (!r.rowsecurity) allEnabled = false;
      console.log(`  ${r.tablename.padEnd(25)} : ${status}`);
    }

    if (allEnabled) {
      console.log('\n[SUCCESS] 100% of public tables have Row-Level Security (RLS) ENABLED!');
      console.log('[SUCCESS] The "rls_disabled_in_public" critical security issue is fully resolved!');
    } else {
      console.error('\n[WARNING] Some tables still have RLS disabled.');
    }

    // Count policies
    const polRes = await client.query(`
      SELECT COUNT(*) as count
      FROM pg_policies
      WHERE schemaname = 'public';
    `);
    console.log(`Total active RLS policies in public schema: ${polRes.rows[0].count}`);

  } finally {
    client.release();
    await pool.end();
  }
}

applyRLS().catch(err => {
  console.error('Error applying RLS migration:', err);
  process.exit(1);
});
