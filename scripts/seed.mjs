// scripts/seed.mjs
import pg from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../apps/api/dist/db/schema.js';
import { seedDemoWorkspace } from '../apps/api/dist/services/seed-service.js';

const connectionString =
  process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/patchpilot';

async function main() {
  console.log('[seed] Connecting to database...');
  const client = new pg.Client({ connectionString });
  await client.connect();

  try {
    const db = drizzle(client, { schema });
    console.log('[seed] Seeding Appendix A demo data (synthetic_demo only)...');
    const result = await seedDemoWorkspace(db);
    console.log(`[seed] SUCCESS: Seeded workspace ${result.workspaceId}`);
    console.log(`  - Game: ${result.game.name}`);
    console.log(`  - Markets: ${result.markets.map((m) => m.name).join(', ')}`);
    console.log(`  - Proposals: ${result.proposals.length} proposals created`);
  } catch (err) {
    console.error('[seed] FAILED:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
