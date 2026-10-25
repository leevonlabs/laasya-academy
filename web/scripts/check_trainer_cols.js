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
  const tCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'trainers'");
  console.log('profiles cols:', pCols.rows.map(r => r.column_name + ' (' + r.data_type + ')').join(', '));
  console.log('trainers cols:', tCols.rows.map(r => r.column_name + ' (' + r.data_type + ')').join(', '));
  await pool.end();
}
check().catch(console.error);
