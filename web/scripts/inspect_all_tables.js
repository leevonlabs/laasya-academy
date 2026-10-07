const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function checkAll() {
  const tables = await pool.query(`
    SELECT table_name, table_type 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    ORDER BY table_name;
  `);
  console.log(tables.rows);

  const rlsCheck = await pool.query(`
    SELECT tablename, rowsecurity
    FROM pg_tables
    WHERE schemaname = 'public'
    ORDER BY tablename;
  `);
  console.log('Total pg_tables in public:', rlsCheck.rows.length);
  const targetTables = [
    'announcements', 'course_categories', 'expense_audit_logs', 'expense_categories',
    'expenses', 'fee_reminders', 'guru_salary_advances', 'guru_salary_records',
    'rooms', 'student_fee_invoices', 'student_fee_payments'
  ];

  console.log('\n--- COLUMN DEFINITIONS FOR UNPROTECTED TABLES ---');
  for (const t of targetTables) {
    const cols = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position;
    `, [t]);
    console.log(t + ':\n  ' + cols.rows.map(r => r.column_name + ' (' + r.data_type + ')').join(', '));
  }

  const funcs = await pool.query(`
    SELECT routine_name 
    FROM information_schema.routines 
    WHERE routine_schema = 'public';
  `);
  console.log('\n--- FUNCTIONS IN PUBLIC SCHEMA ---');
  console.log(funcs.rows.map(r => r.routine_name).join(', '));

  await pool.end();
}

checkAll().catch(console.error);
