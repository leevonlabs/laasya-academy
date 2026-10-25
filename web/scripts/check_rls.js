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
  connectionString: dbUrl
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
