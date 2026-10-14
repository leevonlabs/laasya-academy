const { Pool } = require('pg');
const pool = new Pool({
  connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres'
});

async function inspect() {
  const res = await pool.query(`
    SELECT table_name, column_name, data_type, is_nullable
    FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name IN ('session_alerts', 'system_settings')
    ORDER BY table_name, ordinal_position;
  `);

  console.log('Columns:');
  for (const r of res.rows) {
    console.log(`${r.table_name.padEnd(18)} | ${r.column_name.padEnd(20)} | ${r.data_type.padEnd(15)} | null:${r.is_nullable}`);
  }

  await pool.end();
}

inspect().catch(console.error);
