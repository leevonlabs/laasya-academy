const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function applyFinalRLS() {
  const sqlFile = path.join(__dirname, '..', '..', 'supabase', 'migrations', '20261014000001_enable_rls_session_alerts_system_settings.sql');
  const sql = fs.readFileSync(sqlFile, 'utf8');

  console.log('Connecting to Supabase PostgreSQL database...');
  const client = await pool.connect();

  try {
    console.log('Executing RLS migration on session_alerts & system_settings...');
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
    const enabledTables = [];
    const disabledTables = [];

    for (const r of checkRes.rows) {
      if (r.rowsecurity) {
        enabledTables.push(r.tablename);
      } else {
        disabledTables.push(r.tablename);
        allEnabled = false;
      }
    }

    console.log(`RLS Enabled count: ${enabledTables.length}`);
    console.log(`RLS Disabled count: ${disabledTables.length}`);

    if (disabledTables.length > 0) {
      console.error('Tables still disabled:', disabledTables);
    }

    if (allEnabled && disabledTables.length === 0) {
      console.log('\n[SUCCESS] ALL ' + enabledTables.length + ' public tables have Row-Level Security (RLS) ENABLED!');
      console.log('[SUCCESS] ZERO tables publicly exposed without RLS!');
      console.log('[SUCCESS] The "rls_disabled_in_public" critical security issue is 100% RESOLVED!');
    }

    // Check policies on system_settings and session_alerts
    const polRes = await client.query(`
      SELECT tablename, policyname, cmd, roles
      FROM pg_policies
      WHERE schemaname = 'public' AND tablename IN ('system_settings', 'session_alerts')
      ORDER BY tablename, policyname;
    `);

    console.log('\n=== POLICIES CONFIGURED ===');
    for (const p of polRes.rows) {
      console.log(`Table: ${p.tablename.padEnd(16)} | Action: ${p.cmd.padEnd(6)} | Policy: ${p.policyname}`);
    }

  } finally {
    client.release();
    await pool.end();
  }
}

applyFinalRLS().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
