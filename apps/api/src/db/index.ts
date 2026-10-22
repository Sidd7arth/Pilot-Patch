import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';

export * from './schema.js';

let pool: pg.Pool | null = null;

export function getDbPool(connectionString?: string): pg.Pool {
  if (!pool) {
    pool = new pg.Pool({
      connectionString:
        connectionString ||
        process.env.DATABASE_URL ||
        'postgres://user:password@localhost:5432/patchpilot',
      max: 10,
    });
  }
  return pool;
}

export function getDb(connectionString?: string): NodePgDatabase<typeof schema> {
  const p = getDbPool(connectionString);
  return drizzle(p, { schema });
}

export async function closeDbPool(): Promise<void> {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export type Database = NodePgDatabase<typeof schema>;
