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

async function exportFullBackup() {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupDir = path.join(__dirname, '../../backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  console.log('--- Starting Full Database Backup ---');

  const backup = {
    metadata: {
      timestamp: new Date().toISOString(),
      source_project: 'bhpqzrcohjigkkpmcdsy',
      version: 'PostgreSQL 17.6'
    },
    schema: {},
    auth_users: [],
    auth_identities: [],
    public_data: {},
    row_counts: {}
  };

  try {
    // 1. Fetch public tables
    const tablesRes = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' AND table_type = 'BASE TABLE'
      ORDER BY table_name;
    `);
    const tables = tablesRes.rows.map(r => r.table_name);

    // 2. Export table data
    for (const t of tables) {
      console.log(`Exporting table: ${t}...`);
      const rowsRes = await pool.query(`SELECT * FROM public."${t}"`);
      backup.public_data[t] = rowsRes.rows;
      backup.row_counts[t] = rowsRes.rows.length;
    }

    // 3. Export auth users
    console.log('Exporting auth.users...');
    try {
      const authUsersRes = await pool.query(`
        SELECT 
          id, instance_id, aud, role, email, encrypted_password, 
          email_confirmed_at, invited_at, confirmation_token, confirmation_sent_at, 
          recovery_token, recovery_sent_at, email_change_token_new, email_change, 
          email_change_sent_at, last_sign_in_at, raw_app_meta_data, raw_user_meta_data, 
          is_super_admin, created_at, updated_at, phone, phone_confirmed_at, 
          phone_change, phone_change_token, phone_change_sent_at, email_change_token_current, 
          email_change_confirm_status, banned_until, reauthentication_token, 
          reauthentication_sent_at, is_sso_user, deleted_at, is_anonymous
        FROM auth.users
        ORDER BY created_at;
      `);
      backup.auth_users = authUsersRes.rows;
      backup.row_counts['auth.users'] = authUsersRes.rows.length;
      console.log(`Exported ${authUsersRes.rows.length} auth.users`);
    } catch (authErr) {
      console.error('Error exporting auth.users:', authErr.message);
    }

    // 4. Export auth identities
    console.log('Exporting auth.identities...');
    try {
      const authIdentitiesRes = await pool.query(`
        SELECT 
          id, user_id, identity_data, provider, last_sign_in_at, 
          created_at, updated_at, provider_id
        FROM auth.identities
        ORDER BY created_at;
      `);
      backup.auth_identities = authIdentitiesRes.rows;
      backup.row_counts['auth.identities'] = authIdentitiesRes.rows.length;
      console.log(`Exported ${authIdentitiesRes.rows.length} auth.identities`);
    } catch (idErr) {
      console.error('Error exporting auth.identities:', idErr.message);
    }

    // 5. Export Storage Buckets
    try {
      const bucketsRes = await pool.query(`SELECT * FROM storage.buckets`);
      backup.storage_buckets = bucketsRes.rows;
    } catch (_) {
      backup.storage_buckets = [];
    }

    // 6. Write JSON backup
    const jsonFilename = `backup_full_${timestamp}.json`;
    const jsonPath = path.join(backupDir, jsonFilename);
    fs.writeFileSync(jsonPath, JSON.stringify(backup, null, 2), 'utf8');
    const jsonStats = fs.statSync(jsonPath);
    console.log(`Full JSON backup created: ${jsonPath} (${(jsonStats.size / 1024 / 1024).toFixed(2)} MB)`);

    // 7. Verify backup integrity
    console.log('Verifying backup file integrity...');
    const parsed = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
    let totalRows = 0;
    for (const t of tables) {
      if (!parsed.public_data[t] || parsed.public_data[t].length !== backup.row_counts[t]) {
        throw new Error(`Integrity check failed for table ${t}!`);
      }
      totalRows += parsed.public_data[t].length;
    }
    if (parsed.auth_users.length !== backup.auth_users.length) {
      throw new Error('Integrity check failed for auth.users!');
    }

    console.log(`Integrity verified successfully!`);
    console.log(`Total public tables: ${tables.length}`);
    console.log(`Total public records: ${totalRows}`);
    console.log(`Total auth users: ${parsed.auth_users.length}`);
    console.log(`Total auth identities: ${parsed.auth_identities.length}`);

  } catch (err) {
    console.error('Backup failed:', err);
  } finally {
    await pool.end();
  }
}

exportFullBackup();
