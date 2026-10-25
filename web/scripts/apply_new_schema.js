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

async function applySchema() {
  console.log('--- Applying Live Schema to New Supabase Project ---');
  const ddlPath = path.join(__dirname, '../../backups/laasya_complete_live_schema.sql');
  const ddlContent = fs.readFileSync(ddlPath, 'utf8');

  try {
    console.log('Executing DDL script...');
    await pool.query(ddlContent);
    console.log('DDL applied successfully!');

    // Verify created tables
    const tablesRes = await pool.query(
      "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name"
    );
    console.log(`Created ${tablesRes.rows.length} public tables in new database.`);

    // Verify functions
    const funcsRes = await pool.query(
      "SELECT routine_name FROM information_schema.routines WHERE routine_schema = 'public' ORDER BY routine_name"
    );
    console.log(`Created ${funcsRes.rows.length} functions in public schema.`);

    // Verify triggers
    const trgRes = await pool.query(
      "SELECT trigger_name, event_object_table FROM information_schema.triggers WHERE trigger_schema = 'public' ORDER BY event_object_table"
    );
    console.log(`Created ${trgRes.rows.length} triggers in public schema.`);

    // Verify policies
    const polRes = await pool.query(
      "SELECT count(*)::int as count FROM pg_policies WHERE schemaname = 'public'"
    );
    console.log(`Created ${polRes.rows[0].count} RLS policies in public schema.`);

    // Verify realtime publications
    const pubRes = await pool.query(
      "SELECT tablename FROM pg_publication_tables WHERE pubname = 'supabase_realtime' ORDER BY tablename"
    );
    console.log('Tables in supabase_realtime publication:', pubRes.rows.map(r => r.tablename).join(', '));

    // Verify storage bucket
    const bucketRes = await pool.query("SELECT id, name, public FROM storage.buckets");
    console.log('Storage buckets:', bucketRes.rows);

  } catch (err) {
    console.error('Schema application error:', err);
  } finally {
    await pool.end();
  }
}

applySchema();
