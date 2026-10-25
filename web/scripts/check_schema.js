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

new Pool({ connectionString: dbUrl });

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
