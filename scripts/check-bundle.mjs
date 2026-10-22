// scripts/check-bundle.mjs
// SEC-04: Scans built frontend bundle for Qloo API key or secret leakage
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const nextDir = path.join(repoRoot, 'apps', 'web', '.next');

console.log('[check:bundle] Scanning client bundles for sensitive tokens...');

if (!fs.existsSync(nextDir)) {
  console.log('[check:bundle] Note: apps/web/.next does not exist yet. Run after `pnpm build`.');
  process.exit(0);
}

const activeKey = process.env.QLOO_API_KEY;
const isRealKey = activeKey && !activeKey.includes('replace-with') && activeKey.trim().length > 10;

const FORBIDDEN_CLIENT_PATTERNS = [/QLOO_API_KEY/, /X-Api-Key/i, /SESSION_SECRET/, /DATABASE_URL/];

let violations = 0;

function scanBundle(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(repoRoot, fullPath);

    if (entry.isDirectory()) {
      scanBundle(fullPath);
      continue;
    }

    if (
      entry.name.endsWith('.js') ||
      entry.name.endsWith('.html') ||
      entry.name.endsWith('.json')
    ) {
      try {
        const content = fs.readFileSync(fullPath, 'utf-8');

        // Check 1: Real key presence
        if (isRealKey && content.includes(activeKey)) {
          console.error(`CRITICAL: Live QLOO_API_KEY leaked in client bundle: ${relPath}`);
          violations++;
        }

        // Check 2: Secret variable names in static browser assets
        if (relPath.includes('static')) {
          for (const pattern of FORBIDDEN_CLIENT_PATTERNS) {
            if (pattern.test(content)) {
              console.error(
                `CRITICAL: Sensitive token pattern ${pattern} found in public bundle: ${relPath}`,
              );
              violations++;
            }
          }
        }
      } catch {
        // Ignore unreadable files
      }
    }
  }
}

scanBundle(nextDir);

if (violations > 0) {
  console.error(`\n[check:bundle] FAILED: ${violations} secret leak(s) detected in bundle output.`);
  process.exit(1);
} else {
  console.log('[check:bundle] PASSED: Bundle clean. No secrets detected in frontend artifacts.');
  process.exit(0);
}
