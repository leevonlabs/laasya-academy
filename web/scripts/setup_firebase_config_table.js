import pg from 'pg';
import fs from 'fs';
import path from 'path';

const { Pool } = pg;
const connectionString = 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';

async function run() {
  const pool = new Pool({
    connectionString,
    ssl: { rejectUnauthorized: false },
  });

  const client = await pool.connect();
  try {
    console.log('Connected to PostgreSQL...');

    await client.query(`
      CREATE TABLE IF NOT EXISTS public.app_config (
        config_key TEXT PRIMARY KEY,
        config_value JSONB NOT NULL,
        description TEXT,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    const p = path.join(process.cwd(), 'firebase-service-account.json');
    const sa = JSON.parse(fs.readFileSync(p, 'utf8'));

    await client.query(`
      INSERT INTO public.app_config (config_key, config_value, description, updated_at)
      VALUES ('firebase_service_account', $1::jsonb, 'Firebase Admin Service Account credentials for push delivery', NOW())
      ON CONFLICT (config_key)
      DO UPDATE SET
        config_value = EXCLUDED.config_value,
        updated_at = NOW();
    `, [JSON.stringify(sa)]);

    console.log('Successfully saved firebase_service_account to public.app_config table in database!');

    const res = await client.query(`SELECT config_key, updated_at FROM public.app_config WHERE config_key = 'firebase_service_account'`);
    console.log('Verified config in DB:', res.rows[0]);
  } catch (err) {
    console.error('Error saving config to DB:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

run();
