// scripts/qloo-verify.mjs
// Entrypoint for `pnpm qloo:verify`
import { spawnSync } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const stepArg = args.find((a) => a.startsWith('--step='));
const step = stepArg ? stepArg.split('=')[1] : 'all';

console.log(`[qloo:verify] Running Qloo verification step: ${step}`);

const key = process.env.QLOO_API_KEY;

if (step === 'config') {
  const isConfigured = Boolean(key && key.trim().length > 0 && !key.includes('replace-with'));
  console.log(`configured: ${isConfigured}`);
  process.exit(isConfigured ? 0 : 1);
}

function runScript(relPath) {
  const fullPath = path.join(__dirname, relPath);
  console.log(`\n--- Running ${relPath} ---`);
  const result = spawnSync('node', [fullPath], {
    stdio: 'inherit',
    env: process.env,
  });
  if (result.status !== 0) {
    console.error(`Script ${relPath} failed with code ${result.status}`);
    process.exit(result.status ?? 1);
  }
}

if (step === 'auth' || step === 'all') {
  runScript('qloo-verify/auth.mjs');
}

if (step === 'resolve' || step === 'all') {
  runScript('qloo-verify/resolve.mjs');
}

if (step === 'insights' || step === 'markets' || step === 'all') {
  runScript('qloo-verify/insights.mjs');
}

console.log('\n[qloo:verify] All requested verification steps passed.');
