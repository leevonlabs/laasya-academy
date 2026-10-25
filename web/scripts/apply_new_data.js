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
  ssl: { rejectUnauthorized: false },
  max: 10
});

async function migrateData() {
  console.log('--- Starting Data Migration to New Supabase Database ---');
  const backupFiles = fs.readdirSync(path.join(__dirname, '../../backups'))
    .filter(f => f.startsWith('backup_full_') && f.endsWith('.json'))
    .sort()
    .reverse();

  if (backupFiles.length === 0) {
    throw new Error('No full backup file found!');
  }

  const backupPath = path.join(__dirname, '../../backups', backupFiles[0]);
  console.log('Loading backup data from:', backupPath);
  const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

  const client = await pool.connect();

  try {
    await client.query('BEGIN');
    await client.query('SET session_replication_role = replica;');

    // 1. Migrate auth.users
    console.log(`Migrating ${backup.auth_users.length} auth.users...`);
    const authCols = [
      'id', 'instance_id', 'aud', 'role', 'email', 'encrypted_password',
      'email_confirmed_at', 'invited_at', 'confirmation_token', 'confirmation_sent_at',
      'recovery_token', 'recovery_sent_at', 'email_change_token_new', 'email_change',
      'email_change_sent_at', 'last_sign_in_at', 'raw_app_meta_data', 'raw_user_meta_data',
      'is_super_admin', 'created_at', 'updated_at', 'phone', 'phone_confirmed_at',
      'phone_change', 'phone_change_token', 'phone_change_sent_at', 'email_change_token_current',
      'email_change_confirm_status', 'banned_until', 'reauthentication_token',
      'reauthentication_sent_at', 'is_sso_user', 'deleted_at', 'is_anonymous'
    ];

    for (const u of backup.auth_users) {
      const vals = authCols.map(c => {
        let v = u[c];
        if (c === 'instance_id' && (v === null || v === undefined)) return '00000000-0000-0000-0000-000000000000';
        if (c === 'aud' && !v) return 'authenticated';
        if (c === 'role' && !v) return 'authenticated';
        if (c === 'is_super_admin' && v === null) return false;
        if (c === 'is_sso_user' && v === null) return false;
        if (c === 'is_anonymous' && v === null) return false;
        if ((c === 'raw_app_meta_data' || c === 'raw_user_meta_data') && typeof v === 'object' && v !== null) {
          return JSON.stringify(v);
        }
        return v;
      });

      const placeholders = vals.map((_, i) => `$${i + 1}`).join(', ');
      const queryText = `
        INSERT INTO auth.users (${authCols.map(c => `"${c}"`).join(', ')})
        VALUES (${placeholders})
        ON CONFLICT (id) DO UPDATE SET
          email = EXCLUDED.email,
          encrypted_password = EXCLUDED.encrypted_password,
          raw_user_meta_data = EXCLUDED.raw_user_meta_data,
          raw_app_meta_data = EXCLUDED.raw_app_meta_data,
          updated_at = EXCLUDED.updated_at;
      `;
      await client.query(queryText, vals);
    }
    console.log('auth.users migrated successfully!');

    // 2. Migrate Public Tables in Dependency Order
    const tableOrder = [
      'profiles',
      'system_settings',
      'app_config',
      'course_categories',
      'courses',
      'trainers',
      'students',
      'rooms',
      'schemes',
      'batches',
      'batch_enrollments',
      'class_sessions',
      'attendance',
      'session_alerts',
      'holiday_alerts',
      'announcements',
      'advertisement_views',
      'device_tokens',
      'expense_categories',
      'expenses',
      'expense_audit_logs',
      'guru_salary_records',
      'guru_absences',
      'guru_salary_advances',
      'receptionists',
      'receptionist_salaries',
      'student_fee_invoices',
      'student_fee_payments',
      'fee_reminders',
      'tally_classes',
      'video_library',
      'media_assets'
    ];

    for (const t of tableOrder) {
      const rows = backup.public_data[t];
      if (!rows || rows.length === 0) {
        console.log(`Skipping empty table: ${t}`);
        continue;
      }

      console.log(`Migrating public.${t} (${rows.length} rows)...`);
      const cols = Object.keys(rows[0]);

      // Batch insert in chunks of 100
      const chunkSize = 100;
      for (let i = 0; i < rows.length; i += chunkSize) {
        const chunk = rows.slice(i, i + chunkSize);
        for (const row of chunk) {
          const vals = cols.map(c => {
            let v = row[c];
            if ((t === 'batches' && c === 'days_of_week') || (t === 'trainers' && c === 'specializations')) {
              return Array.isArray(v) ? v : (v ? [v] : []);
            }
            if (typeof v === 'object' && v !== null) {
              return JSON.stringify(v);
            }
            return v;
          });

          const placeholders = vals.map((_, idx) => `$${idx + 1}`).join(', ');
          const sql = `INSERT INTO public."${t}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${placeholders}) ON CONFLICT DO NOTHING;`;
          await client.query(sql, vals);
        }
      }
    }

    // 3. Reset Sequences
    console.log('Resetting database sequences...');
    const seqSql = `
      DO $$ DECLARE
        r RECORD;
      BEGIN
        FOR r IN (SELECT sequence_name, table_name, column_name FROM information_schema.sequences
                  JOIN information_schema.columns ON column_default LIKE '%' || sequence_name || '%'
                  WHERE sequence_schema = 'public') LOOP
          EXECUTE 'SELECT setval(''' || r.sequence_name || ''', COALESCE(MAX(' || r.column_name || '), 1)) FROM public."' || r.table_name || '";';
        END LOOP;
      END $$;
    `;
    await client.query(seqSql);

    await client.query('SET session_replication_role = DEFAULT;');
    await client.query('COMMIT');
    console.log('Transaction committed successfully!');

  } catch (err) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Data migration error:', err);
    throw err;
  } finally {
    client.release();
  }

  // 4. Verification: Check Row Counts
  console.log('\n--- VERIFYING ROW COUNTS (NEW DATABASE VS BASELINE) ---');
  const auditPath = path.join(__dirname, '../../backups/database_audit_report.json');
  const baseline = JSON.parse(fs.readFileSync(auditPath, 'utf8'));

  const results = [];
  let allMatched = true;

  // Verify auth.users
  const authCountRes = await pool.query('SELECT count(*)::int as count FROM auth.users');
  const authNew = authCountRes.rows[0].count;
  const authOld = baseline.auth_users_count;
  results.push({
    table: 'auth.users',
    old_count: authOld,
    new_count: authNew,
    status: authNew === authOld ? 'MATCH' : 'MISMATCH'
  });
  if (authNew !== authOld) allMatched = false;

  // Verify each public table
  for (const t of Object.keys(baseline.row_counts)) {
    try {
      const res = await pool.query(`SELECT count(*)::int as count FROM public."${t}"`);
      const newCount = res.rows[0].count;
      const oldCount = baseline.row_counts[t];
      const match = newCount === oldCount;
      results.push({
        table: t,
        old_count: oldCount,
        new_count: newCount,
        status: match ? 'MATCH' : 'MISMATCH'
      });
      if (!match) allMatched = false;
    } catch (e) {
      results.push({
        table: t,
        old_count: baseline.row_counts[t],
        new_count: `Error: ${e.message}`,
        status: 'ERROR'
      });
      allMatched = false;
    }
  }

  console.table(results);
  console.log('Overall Reconciliation Status:', allMatched ? 'ALL TABLES 100% MATCH' : 'DISCREPANCY DETECTED');

  await pool.end();
}

migrateData().catch(err => {
  console.error('Migration aborted:', err);
  process.exit(1);
});
