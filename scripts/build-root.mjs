// scripts/build-root.mjs
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

console.log('[build-root] Building apps/web...');
execSync('pnpm --filter web build', { stdio: 'inherit' });

const srcNext = path.resolve('apps/web/.next');
const destNext = path.resolve('.next');

if (fs.existsSync(srcNext) && srcNext !== destNext) {
  console.log('[build-root] Copying apps/web/.next to .next for root deployment...');
  fs.cpSync(srcNext, destNext, { recursive: true });
}

console.log('[build-root] Completed successfully.');
