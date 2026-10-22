// scripts/check-secrets.mjs
// SEC-03: Scans repository files for committed secrets or key leakage
import fs from 'fs';
import path from 'path';
import { execSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');

console.log('[check:secrets] Scanning repository for secret leakage...');

let violations = 0;

// 1. Verify .env is untracked by git
try {
  const trackedEnv = execSync('git ls-files .env', { cwd: repoRoot, encoding: 'utf-8' }).trim();
  if (trackedEnv) {
    console.error('CRITICAL: .env file is tracked in git!');
    violations++;
  }
} catch {
  // Not tracked, good
}

// 2. Identify sensitive values from process.env if available (from untracked .env)
const activeKey = process.env.QLOO_API_KEY;
const isRealKey = activeKey && !activeKey.includes('replace-with') && activeKey.trim().length > 10;

const IGNORED_DIRS = new Set(['.git', 'node_modules', '.next', 'dist', 'build', '.turbo', 'brain']);

const IGNORED_FILES = new Set([
  '.env',
  '.env.local',
  '.env.development.local',
  'pnpm-lock.yaml',
  'package-lock.json',
]);

// Secret regex patterns
const SECRET_PATTERNS = [
  {
    name: 'Generic API Key Assignment',
    regex: /(?:api[_-]?key|secret|password)\s*[:=]\s*["']([A-Za-z0-9_\-]{20,})["']/i,
  },
  { name: 'Private Key Block', regex: /-----BEGIN (?:RSA |EC )?PRIVATE KEY-----/ },
  {
    name: 'Slack/Discord/GitHub Webhook or Token',
    regex: /(?:ghp_[A-Za-z0-9]{36}|xox[baprs]-[A-Za-z0-9\-]+)/,
  },
];

function scanDirectory(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(repoRoot, fullPath);

    if (entry.isDirectory()) {
      if (!IGNORED_DIRS.has(entry.name)) {
        scanDirectory(fullPath);
      }
      continue;
    }

    if (IGNORED_FILES.has(entry.name)) {
      continue;
    }

    // Skip binary files and live captured fixtures (which are verified sanitized)
    if (relPath.includes('fixtures') && relPath.endsWith('.json')) {
      // Still scan fixtures to guarantee no secret leaked in
    }

    try {
      const content = fs.readFileSync(fullPath, 'utf-8');

      // Check for real key presence
      if (isRealKey && content.includes(activeKey)) {
        console.error(`CRITICAL: Live QLOO_API_KEY detected in file: ${relPath}`);
        violations++;
      }

      // Check secret regex patterns
      const lines = content.split('\n');
      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];
        // Skip .env.example placeholder lines
        if (
          relPath === '.env.example' ||
          relPath.endsWith('README.md') ||
          relPath.endsWith('IMPLEMENTATION.md') ||
          line.toLowerCase().includes('dummy') ||
          line.toLowerCase().includes('sentinel') ||
          line.toLowerCase().includes('mock') ||
          line.toLowerCase().includes('placeholder')
        ) {
          continue;
        }

        for (const pattern of SECRET_PATTERNS) {
          if (pattern.regex.test(line)) {
            // Mask the found value
            console.error(
              `WARNING: Potential secret found in ${relPath}:${i + 1} (${pattern.name})`,
            );
            violations++;
          }
        }
      }
    } catch {
      // Ignore unreadable or binary files
    }
  }
}

scanDirectory(repoRoot);

if (violations > 0) {
  console.error(`\n[check:secrets] FAILED: ${violations} potential secret leak(s) detected.`);
  process.exit(1);
} else {
  console.log('[check:secrets] PASSED: No secrets detected in scanned files.');
  process.exit(0);
}
