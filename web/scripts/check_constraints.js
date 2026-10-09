const { Pool } = require('pg');
const pool = new Pool({ connectionString: 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres' });

async function check() {
  const constraints = await pool.query(`
    SELECT column_name, is_nullable 
    FROM information_schema.columns 
    WHERE table_name = 'video_library' AND column_name IN ('drive_url', 'title');
  `);
  console.log('CONSTRAINTS:', constraints.rows);
  await pool.end();
}

check().catch(console.error);
