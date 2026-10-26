// vitest.setup.ts
import fs from 'node:fs';
import path from 'node:path';
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';

const envPath = path.resolve(process.cwd(), '.env');
if (fs.existsSync(envPath) && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile(envPath);
  } catch {
    // ignore
  }
}

// Ensure resilient test environment defaults if running offline or in stripped CI
process.env.DATABASE_URL =
  process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/patchpilot';
process.env.SESSION_SECRET =
  process.env.SESSION_SECRET || 'test-github-actions-ci-secret-32-chars-long!';
process.env.QLOO_API_BASE_URL = process.env.QLOO_API_BASE_URL || 'https://hackathon.api.qloo.com';
process.env.QLOO_API_KEY = process.env.QLOO_API_KEY || 'test-ci-offline-qloo-key';

// Automatically ensure migrations are applied before running tests
const dbUrl = process.env.DATABASE_URL;
if (dbUrl) {
  try {
    const client = new pg.Client({ connectionString: dbUrl });
    await client.connect();
    const db = drizzle(client);
    const migrationsFolder = path.resolve(process.cwd(), 'apps/api/src/db/migrations');
    if (fs.existsSync(migrationsFolder)) {
      await migrate(db, { migrationsFolder });
    }
    await client.end();
  } catch {
    // If DB is offline or unavailable, integration tests handle connection failures
  }
}
