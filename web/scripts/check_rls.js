const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function checkRLS() {
  const tables = await pool.query(`
    SELECT tablename, rowsecurity 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename;
  `);

  console.log('Tables in public schema and their RLS status:');
  const disabled = [];
  const enabled = [];
  for (const row of tables.rows) {
    if (row.rowsecurity) {
      enabled.push(row.tablename);
    } else {
      disabled.push(row.tablename);
    }
  }

  console.log('\n--- RLS ENABLED (' + enabled.length + ') ---');
  console.log(enabled.join(', '));

  console.log('\n--- RLS DISABLED (' + disabled.length + ') ---');
  console.log(disabled.join(', '));

  // Also check existing policies
  const policies = await pool.query(`
    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
    FROM pg_policies
    WHERE schemaname = 'public'
    ORDER BY tablename, policyname;
  `);

  console.log('\n--- EXISTING POLICIES (' + policies.rows.length + ') ---');
  for (const r of policies.rows) {
    console.log(`${r.tablename.padEnd(22)} | ${r.cmd.padEnd(6)} | ${r.policyname}`);
  }

  await pool.end();
}

checkRLS().catch(console.error);
