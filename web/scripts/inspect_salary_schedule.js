const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.kumbtvmjpmjtmoefddux:Laasya%4024530@aws-0-ap-south-1.pooler.supabase.com:6543/postgres'
});

async function checkCols() {
  const cols = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'guru_salary_records'
    ORDER BY ordinal_position
  `);
  console.log('Columns in guru_salary_records:');
  console.table(cols.rows);

  await pool.end();
}

checkCols().catch(console.error);
