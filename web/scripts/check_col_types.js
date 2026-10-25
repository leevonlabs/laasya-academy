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

async function checkColTypes() {
  const res = await pool.query(
    "SELECT table_name, column_name, data_type, udt_name FROM information_schema.columns WHERE table_schema = 'public' AND (data_type = 'ARRAY' OR data_type LIKE '%json%') ORDER BY table_name, column_name"
  );
  console.log('Columns with ARRAY or JSON:');
  console.table(res.rows);
  await pool.end();
}

checkColTypes();
