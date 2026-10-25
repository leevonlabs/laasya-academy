import { Pool } from 'pg';

interface CacheEntry<T = any> {
  data: T[];
  expiresAt: number;
}

declare global {
  var _pgPool: Pool | undefined;
  var _queryCache: Map<string, CacheEntry> | undefined;
}

const queryCache = globalThis._queryCache || new Map<string, CacheEntry>();
globalThis._queryCache = queryCache;

export function clearDbCache() {
  queryCache.clear();
}

export function getDbPool(): Pool {
  if (!globalThis._pgPool) {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
      throw new Error('DATABASE_URL environment variable is missing. Please configure DATABASE_URL in your server environment.');
    }
    globalThis._pgPool = new Pool({
      connectionString,
      ssl: {
        rejectUnauthorized: false
      },
      max: 20,
      idleTimeoutMillis: 60000,
      connectionTimeoutMillis: 10000,
      keepAlive: true,
      keepAliveInitialDelayMillis: 10000
    });

    globalThis._pgPool.on('error', (err) => {
      console.error('Unexpected idle client error in PostgreSQL pool:', err);
    });
  }
  return globalThis._pgPool;
}

export interface QueryOptions {
  noCache?: boolean;
  ttlMs?: number;
}

export async function query<T = any>(
  text: string, 
  params?: any[], 
  options?: QueryOptions
): Promise<T[]> {
  const trimmed = text.trim();
  const isSelect = trimmed.toUpperCase().startsWith('SELECT');

  // Any write invalidates the cache immediately
  if (!isSelect) {
    clearDbCache();
    const p = getDbPool();
    const res = await p.query(text, params);
    return res.rows as T[];
  }

  // Check cache for SELECT queries
  const shouldCache = !options?.noCache;
  const ttl = options?.ttlMs ?? 12000; // 12 seconds default cache
  const cacheKey = shouldCache ? `${trimmed}::${JSON.stringify(params || [])}` : null;

  if (cacheKey && queryCache.has(cacheKey)) {
    const entry = queryCache.get(cacheKey)!;
    if (Date.now() < entry.expiresAt) {
      return entry.data as T[];
    }
    queryCache.delete(cacheKey);
  }

  const p = getDbPool();
  const res = await p.query(text, params);
  const rows = res.rows as T[];

  if (cacheKey && ttl > 0) {
    queryCache.set(cacheKey, {
      data: rows,
      expiresAt: Date.now() + ttl,
    });
  }

  return rows;
}

export async function queryOne<T = any>(
  text: string, 
  params?: any[], 
  options?: QueryOptions
): Promise<T | null> {
  const rows = await query<T>(text, params, options);
  return rows.length > 0 ? rows[0] : null;
}
