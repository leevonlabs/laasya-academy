import { Pool } from 'pg';

declare global {
  var _pgPool: Pool | undefined;
}

export function getDbPool(): Pool {
  if (!globalThis._pgPool) {
    const connectionString = process.env.DATABASE_URL || 'postgresql://postgres.bhpqzrcohjigkkpmcdsy:Satya%4024530@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres';
    globalThis._pgPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 10,
      idleTimeoutMillis: 5000,
      connectionTimeoutMillis: 5000
    });

    globalThis._pgPool.on('error', (err) => {
      console.error('Unexpected idle client error in PostgreSQL pool:', err);
    });
  }
  return globalThis._pgPool;
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const p = getDbPool();
  const res = await p.query(text, params);
  return res.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const rows = await query<T>(text, params);
  return rows.length > 0 ? rows[0] : null;
}
