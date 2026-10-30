// scripts/db-migrate.mjs
import { drizzle } from 'drizzle-orm/node-postgres';
import { migrate } from 'drizzle-orm/node-postgres/migrator';
import pg from 'pg';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const connectionString =
  process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/patchpilot';

async function main() {
  console.log('Connecting to database for migrations...');
  const isCloud =
    connectionString.includes('sslmode=') ||
    (!connectionString.includes('localhost') && !connectionString.includes('127.0.0.1'));

  const client = new pg.Client({
    connectionString,
    ssl: isCloud ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL successfully.');

    const db = drizzle(client);
    const migrationsFolder = path.resolve(__dirname, '../apps/api/src/db/migrations');

    console.log(`Applying migrations from: ${migrationsFolder}`);
    await migrate(db, { migrationsFolder });
    console.log('All migrations applied cleanly and successfully.');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
