const fs = require('fs');
const path = require('path');
const { Pool } = require('../node_modules/pg');

let dbUrl = '';
const env = fs.readFileSync(path.join(__dirname, '../.env.local'), 'utf8');
for (const line of env.split('\n')) {
  if (line.startsWith('DATABASE_URL=')) dbUrl = line.substring(13).trim();
}

const pool = new Pool({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false }
});

async function runAudit() {
  const audit = {};

  try {
    // 1. Schemas
    const schemasRes = await pool.query(`
      SELECT schema_name 
      FROM information_schema.schemata 
      WHERE schema_name NOT IN ('information_schema', 'pg_catalog', 'pg_toast')
      ORDER BY schema_name;
    `);
    audit.schemas = schemasRes.rows.map(r => r.schema_name);

    // 2. Tables in public
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);
    audit.public_tables = tables;

    // 3. Row counts for each public table
    audit.row_counts = {};
    for (const t of tables) {
      try {
        const countRes = await pool.query(`SELECT COUNT(*)::int as count FROM public."${t}"`);
        audit.row_counts[t] = countRes.rows[0].count;
      } catch (e) {
        audit.row_counts[t] = `Error: ${e.message}`;
      }
    }

    // Auth users count
    try {
      const authCountRes = await pool.query(`SELECT COUNT(*)::int as count FROM auth.users`);
      audit.auth_users_count = authCountRes.rows[0].count;
    } catch (e) {
      audit.auth_users_count = `Error: ${e.message}`;
    }

    // 4. Views
    const viewsRes = await pool.query(`
      SELECT table_name, view_definition 
      FROM information_schema.views 
      WHERE table_schema = 'public'
      ORDER BY table_name;
    `);
    audit.views = viewsRes.rows.map(r => r.table_name);

    // 5. Extensions
    const extRes = await pool.query(`
      SELECT extname, extversion 
      FROM pg_extension 
      ORDER BY extname;
    `);
    audit.extensions = extRes.rows;

    // 6. RLS status & Policies
    const rlsRes = await pool.query(`
      SELECT 
        c.relname as table_name,
        c.relrowsecurity as rls_enabled,
        c.relforcerowsecurity as rls_forced
      FROM pg_class c
      JOIN pg_namespace n ON n.oid = c.relnamespace
      WHERE n.nspname = 'public' AND c.relkind = 'r'
      ORDER BY c.relname;
    `);
    audit.rls_status = rlsRes.rows;

    const policiesRes = await pool.query(`
      SELECT 
        schemaname,
        tablename,
        policyname,
        permissive,
        roles,
        cmd,
        qual,
        with_check
      FROM pg_policies
      WHERE schemaname = 'public'
      ORDER BY tablename, policyname;
    `);
    audit.policies = policiesRes.rows;

    // 7. Foreign keys
    const fkRes = await pool.query(`
      SELECT
        tc.table_name, 
        kcu.column_name, 
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name,
        rc.update_rule,
        rc.delete_rule
      FROM information_schema.table_constraints AS tc 
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
        AND tc.table_schema = kcu.table_schema
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
        AND ccu.table_schema = tc.table_schema
      JOIN information_schema.referential_constraints AS rc
        ON rc.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_schema='public'
      ORDER BY tc.table_name, kcu.column_name;
    `);
    audit.foreign_keys = fkRes.rows;

    // 8. Triggers
    const triggersRes = await pool.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        event_object_table,
        action_statement,
        action_timing
      FROM information_schema.triggers
      WHERE trigger_schema = 'public'
      ORDER BY event_object_table, trigger_name;
    `);
    audit.triggers = triggersRes.rows;

    // 9. Functions in public schema
    const funcRes = await pool.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
      ORDER BY routine_name;
    `);
    audit.functions = funcRes.rows;

    // 10. Realtime Publications
    const pubRes = await pool.query(`
      SELECT pubname, schemaname, tablename 
      FROM pg_publication_tables
      ORDER BY pubname, tablename;
    `);
    audit.realtime_publications = pubRes.rows;

    // 11. Storage buckets & objects
    try {
      const bucketsRes = await pool.query(`SELECT id, name, public, created_at FROM storage.buckets;`);
      audit.storage_buckets = bucketsRes.rows;
      const objCountRes = await pool.query(`SELECT COUNT(*)::int as count FROM storage.objects;`);
      audit.storage_objects_count = objCountRes.rows[0].count;
    } catch (e) {
      audit.storage_buckets = [];
      audit.storage_objects_count = `Not available: ${e.message}`;
    }

    // 12. Check cron jobs if pg_cron is enabled
    try {
      const cronRes = await pool.query(`SELECT * FROM cron.job;`);
      audit.cron_jobs = cronRes.rows;
    } catch (e) {
      audit.cron_jobs = 'None / pg_cron not active';
    }

    // Write audit report JSON
    const reportPath = path.join(__dirname, '../../backups/database_audit_report.json');
    fs.writeFileSync(reportPath, JSON.stringify(audit, null, 2));
    console.log('Audit complete. Results saved to:', reportPath);
    console.log('\n--- PUBLIC TABLES & ROW COUNTS ---');
    console.table(Object.entries(audit.row_counts).map(([table, count]) => ({ table, count })));
    console.log('Auth Users Count:', audit.auth_users_count);
    console.log('Realtime Publication Tables:', audit.realtime_publications.filter(p => p.pubname === 'supabase_realtime').map(p => p.tablename).join(', '));
    console.log('Storage Buckets:', audit.storage_buckets);
    console.log('Storage Objects Count:', audit.storage_objects_count);

  } catch (err) {
    console.error('Audit failed:', err);
  } finally {
    await pool.end();
  }
}

runAudit();
