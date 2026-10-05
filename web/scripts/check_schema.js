const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres' });

async function check() {
  const pCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'profiles'");
  console.log('Profiles cols:', pCols.rows.map(r => r.column_name));

  const sCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'students'");
  console.log('Students cols:', sCols.rows.map(r => r.column_name));

  const bCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'batch_enrollments'");
  console.log('Batch enrollment cols:', bCols.rows.map(r => r.column_name));

  const invCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'student_fee_invoices'");
  console.log('Invoice cols:', invCols.rows.map(r => r.column_name));

  const attCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'attendance'");
  console.log('Attendance cols:', attCols.rows.map(r => r.column_name));

  await pool.end();
}

check().catch(console.error);
