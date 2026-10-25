const fs = require('fs');
const path = require('path');

const backupFiles = fs.readdirSync(path.join(__dirname, '../../backups'))
  .filter(f => f.startsWith('backup_full_') && f.endsWith('.json'))
  .sort()
  .reverse();

if (backupFiles.length === 0) {
  console.error('No full backup file found!');
  process.exit(1);
}

const backupPath = path.join(__dirname, '../../backups', backupFiles[0]);
console.log('Using backup file:', backupPath);
const backup = JSON.parse(fs.readFileSync(backupPath, 'utf8'));

let sql = `-- ==============================================================================
-- LAASYA CULTURAL ACADEMY (లాస్య సాంస్కృతిక అకాడమి)
-- COMPLETE DATABASE RESTORE SCRIPT (AUTH USERS + ALL 32 PUBLIC TABLES)
-- Generated: ${new Date().toISOString()}
-- Source Backup: ${backupFiles[0]}
-- Total Public Records: ${Object.values(backup.row_counts).reduce((a, b) => a + b, 0) - (backup.auth_users?.length || 0)}
-- Total Auth Users: ${backup.auth_users?.length || 0}
-- ==============================================================================

BEGIN;

-- Temporarily bypass triggers and foreign key checks during batch ingestion
SET session_replication_role = replica;

`;

function formatVal(v) {
  if (v === null || v === undefined) return 'NULL';
  if (typeof v === 'boolean') return v ? 'TRUE' : 'FALSE';
  if (typeof v === 'number') return String(v);
  if (v instanceof Date) return `'${v.toISOString()}'`;
  if (typeof v === 'object') {
    // Array or JSON object
    if (Array.isArray(v)) {
      // Postgres text[] array literal or jsonb array
      const escapedItems = v.map(item => {
        if (typeof item === 'string') return `"${item.replace(/"/g, '\\"')}"`;
        return String(item);
      });
      return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
    }
    return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
  }
  // String
  return `'${String(v).replace(/'/g, "''")}'`;
}

// 1. Auth Users
sql += `-- ==============================================================================\n`;
sql += `-- 1. AUTH USERS (Preserving existing passwords, hashes, metadata & UUIDs)\n`;
sql += `-- ==============================================================================\n\n`;

for (const u of backup.auth_users) {
  const cols = [
    'id', 'instance_id', 'aud', 'role', 'email', 'encrypted_password',
    'email_confirmed_at', 'invited_at', 'confirmation_token', 'confirmation_sent_at',
    'recovery_token', 'recovery_sent_at', 'email_change_token_new', 'email_change',
    'email_change_sent_at', 'last_sign_in_at', 'raw_app_meta_data', 'raw_user_meta_data',
    'is_super_admin', 'created_at', 'updated_at', 'phone', 'phone_confirmed_at',
    'phone_change', 'phone_change_token', 'phone_change_sent_at', 'email_change_token_current',
    'email_change_confirm_status', 'banned_until', 'reauthentication_token',
    'reauthentication_sent_at', 'is_sso_user', 'deleted_at', 'is_anonymous'
  ];

  const vals = cols.map(c => {
    let val = u[c];
    if (c === 'instance_id' && (val === null || val === undefined)) val = '00000000-0000-0000-0000-000000000000';
    if (c === 'aud' && !val) val = 'authenticated';
    if (c === 'role' && !val) val = 'authenticated';
    if (c === 'is_super_admin' && val === null) val = false;
    if (c === 'is_sso_user' && val === null) val = false;
    if (c === 'is_anonymous' && val === null) val = false;
    if ((c === 'raw_app_meta_data' || c === 'raw_user_meta_data') && typeof val === 'object' && val !== null) {
      return `'${JSON.stringify(val).replace(/'/g, "''")}'::jsonb`;
    }
    return formatVal(val);
  });

  sql += `INSERT INTO auth.users (${cols.map(c => `"${c}"`).join(', ')})\n`;
  sql += `VALUES (${vals.join(', ')})\n`;
  sql += `ON CONFLICT (id) DO UPDATE SET\n`;
  sql += `  email = EXCLUDED.email,\n`;
  sql += `  encrypted_password = EXCLUDED.encrypted_password,\n`;
  sql += `  raw_user_meta_data = EXCLUDED.raw_user_meta_data,\n`;
  sql += `  raw_app_meta_data = EXCLUDED.raw_app_meta_data,\n`;
  sql += `  updated_at = EXCLUDED.updated_at;\n\n`;
}

// 2. Public Tables Data
sql += `-- ==============================================================================\n`;
sql += `-- 2. PUBLIC TABLES DATA (All 32 tables)\n`;
sql += `-- ==============================================================================\n\n`;

// Table order prioritizing dependencies:
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

  console.log(`Generating SQL for table: ${t} (${rows.length} rows)...`);
  sql += `-- Table: public.${t} (${rows.length} rows)\n`;

  const sample = rows[0];
  const cols = Object.keys(sample);

  for (const row of rows) {
    const vals = cols.map(c => {
      let v = row[c];
      // Special column formatting
      if (Array.isArray(v)) {
        // Check if string array
        if (v.every(x => typeof x === 'string')) {
          const arrStr = '{' + v.map(x => `"${x.replace(/"/g, '\\"')}"`).join(',') + '}';
          return `'${arrStr.replace(/'/g, "''")}'`;
        }
        return `'${JSON.stringify(v).replace(/'/g, "''")}'::jsonb`;
      }
      return formatVal(v);
    });

    sql += `INSERT INTO public."${t}" (${cols.map(c => `"${c}"`).join(', ')}) VALUES (${vals.join(', ')}) ON CONFLICT DO NOTHING;\n`;
  }
  sql += `\n`;
}

// 3. Reset sequences
sql += `-- ==============================================================================\n`;
sql += `-- 3. RESET SEQUENCES & RE-ENABLE TRIGGERS\n`;
sql += `-- ==============================================================================\n\n`;
sql += `DO $$ DECLARE\n`;
sql += `  r RECORD;\n`;
sql += `BEGIN\n`;
sql += `  FOR r IN (SELECT sequence_name, table_name, column_name FROM information_schema.sequences\n`;
sql += `            JOIN information_schema.columns ON column_default LIKE '%' || sequence_name || '%'\n`;
sql += `            WHERE sequence_schema = 'public') LOOP\n`;
sql += `    EXECUTE 'SELECT setval(''' || r.sequence_name || ''', COALESCE(MAX(' || r.column_name || '), 1)) FROM public."' || r.table_name || '";';\n`;
sql += `  END LOOP;\n`;
sql += `END $$;\n\n`;

sql += `SET session_replication_role = DEFAULT;\n\n`;
sql += `COMMIT;\n`;

const outPath = path.join(__dirname, '../../backups/laasya_complete_data_restore.sql');
fs.writeFileSync(outPath, sql, 'utf8');
const stat = fs.statSync(outPath);
console.log(`Restore SQL file generated at: ${outPath} (${(stat.size / 1024 / 1024).toFixed(2)} MB)`);
