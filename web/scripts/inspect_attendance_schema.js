const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres',
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const { rows: csCols } = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'class_sessions'
    ORDER BY ordinal_position;
  `);
  console.log('class_sessions columns:', csCols);

  const { rows: attCols } = await pool.query(`
    SELECT column_name, data_type 
    FROM information_schema.columns 
    WHERE table_name = 'attendance'
    ORDER BY ordinal_position;
  `);
  console.log('attendance columns:', attCols);

  await pool.end();
}

main().catch(console.error);
