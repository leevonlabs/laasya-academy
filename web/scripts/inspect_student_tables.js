const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function run() {
  const { rows: invCols } = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='student_fee_invoices';`);
  console.log('Invoices columns:', invCols.map(c => `${c.column_name} (${c.data_type})`));

  const { rows: payCols } = await pool.query(`SELECT column_name, data_type FROM information_schema.columns WHERE table_name='student_fee_payments';`);
  console.log('Payments columns:', payCols.map(c => `${c.column_name} (${c.data_type})`));

  // Check if advance_paid column exists in students table or if we can add advance_paid column!
  const { rows: advCol } = await pool.query(`SELECT column_name FROM information_schema.columns WHERE table_name='students' AND column_name='advance_paid';`);
  console.log('Advance paid in students exists:', advCol.length > 0);

  await pool.end();
}

run().catch(console.error);
