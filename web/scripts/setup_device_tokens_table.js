import pg from 'pg';
const { Pool } = pg;

const connectionString = process.env.DATABASE_URL || dbUrl;

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

new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function run() {
  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL. Creating device_tokens table...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.device_tokens (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID,
        role TEXT NOT NULL,
        fcm_token TEXT UNIQUE NOT NULL,
        platform TEXT NOT NULL DEFAULT 'android',
        batch_ids JSONB DEFAULT '[]'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE INDEX IF NOT EXISTS idx_device_tokens_role ON public.device_tokens(role);
      CREATE INDEX IF NOT EXISTS idx_device_tokens_user_id ON public.device_tokens(user_id);
      CREATE INDEX IF NOT EXISTS idx_device_tokens_fcm ON public.device_tokens(fcm_token);
    `);

    console.log('device_tokens table created / verified successfully.');

    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'device_tokens';
    `);
    console.log('Columns:', res.rows);
  } catch (err) {
    console.error('Error creating device_tokens table:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
