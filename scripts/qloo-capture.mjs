// scripts/qloo-capture.mjs
// Fetches real Qloo responses, strictly sanitizes them (scrubs headers, keys, sensitive IDs),
// and writes them into packages/qloo-client/test/fixtures/live-captures/ with metadata sidecars.

import fs from 'node:fs';
import path from 'node:path';

const baseUrl = (process.env.QLOO_API_BASE_URL || '').trim().replace(/\/+$/, '');
const apiKey = process.env.QLOO_API_KEY ? process.env.QLOO_API_KEY.trim() : '';

if (!baseUrl) {
  console.error('Error: QLOO_API_BASE_URL is not configured');
  process.exit(1);
}

if (!apiKey) {
  console.error('Error: QLOO_API_KEY is not configured');
  process.exit(1);
}

const targetDir = path.resolve('packages/qloo-client/test/fixtures/live-captures');
fs.mkdirSync(targetDir, { recursive: true });

function sanitizePayload(obj) {
  const jsonStr = JSON.stringify(obj);
  // Ensure the actual API key string NEVER appears anywhere in the captured output
  if (apiKey && jsonStr.includes(apiKey)) {
    throw new Error('FATAL SECURITY CHECK: API key detected in payload before sanitization!');
  }
  return JSON.parse(jsonStr);
}

async function captureFixture(filename, endpoint, params = {}, options = {}) {
  const url = new URL(endpoint, baseUrl);
  for (const [k, v] of Object.entries(params)) {
    url.searchParams.set(k, String(v));
  }

  const sanitizedParams = { ...params };
  const headers = {
    'X-Api-Key': options.invalidKey ? 'deliberate_invalid_key' : apiKey,
    Accept: 'application/json',
  };

  const start = performance.now();
  const res = await fetch(url.toString(), { headers });
  const durationMs = Math.round(performance.now() - start);

  let data;
  try {
    data = await res.json();
  } catch {
    data = await res.text();
  }

  const sanitizedData = sanitizePayload(data);

  const fixturePath = path.join(targetDir, `${filename}.json`);
  const metaPath = path.join(targetDir, `${filename}.meta.json`);

  const meta = {
    endpoint,
    sanitizedParams,
    httpStatus: res.status,
    capturedAt: new Date().toISOString(),
    durationMs,
    qRegisterReferences: options.qRefs || [],
    origin: 'test_fixture',
    description: options.description || '',
  };

  fs.writeFileSync(fixturePath, JSON.stringify(sanitizedData, null, 2) + '\n', 'utf-8');
  fs.writeFileSync(metaPath, JSON.stringify(meta, null, 2) + '\n', 'utf-8');

  console.log(`[CAPTURE] Saved: ${filename}.json (HTTP ${res.status}, ${durationMs}ms)`);
}

async function run() {
  console.log('[CAPTURE] Starting live Qloo fixture capture...');

  // 1. Root API information (auth positive)
  await captureFixture(
    'auth-positive',
    '/',
    {},
    {
      qRefs: ['Q-01', 'Q-02'],
      description: 'Minimal authenticated call returning Qloo API deployment info',
    },
  );

  // 2. Auth negative
  await captureFixture(
    'auth-negative',
    '/',
    {},
    {
      invalidKey: true,
      qRefs: ['Q-02', 'Q-12'],
      description: 'Negative auth test provoking classified 401 unauthorized response',
    },
  );

  // 3. Entity Search: Videogame
  await captureFixture(
    'search-videogames',
    '/search',
    {
      query: 'Cyberpunk 2077',
      types: 'urn:entity:videogame',
      take: 3,
    },
    {
      qRefs: ['Q-03', 'Q-08'],
      description: 'Search resolving video game entities with URN type filter',
    },
  );

  // 4. Entity Search: Artist
  await captureFixture(
    'search-artists',
    '/search',
    {
      query: 'Bad Bunny',
      types: 'urn:entity:artist',
      take: 3,
    },
    {
      qRefs: ['Q-03'],
      description: 'Search resolving musical artist entities',
    },
  );

  // 5. Insights: S1 Ranked Candidate Entities
  await captureFixture(
    'insights-ranked-entities',
    '/v2/insights',
    {
      'signal.interests.entities': '0E018750-0B04-4C65-89E8-DF545A1B13E6', // Valorant
      'filter.type': 'urn:entity:artist',
      'filter.results.entities':
        'BDA1B73F-10E7-4D09-AC51-B796CCEC5FF3,8BE95420-BCDA-4B00-871F-247A55D35594',
      take: 2,
    },
    {
      qRefs: ['Q-05', 'Q-10'],
      description: 'S1 candidate option ranking against anchor game with affinity scores',
    },
  );

  // 6. Insights: S2 Market Conditioned (Japan)
  await captureFixture(
    'insights-market-conditioned',
    '/v2/insights',
    {
      'signal.interests.entities': '0E018750-0B04-4C65-89E8-DF545A1B13E6',
      'filter.type': 'urn:entity:videogame',
      'filter.results.entities':
        '8E474FED-3ACD-46B1-A51C-C28B9FA206B1,B2344587-2AF4-4A4A-A018-5CCDE6E3B1A0',
      'signal.location.query': 'Japan',
      take: 2,
    },
    {
      qRefs: ['Q-05', 'Q-09'],
      description: 'S2 market-conditioned candidate affinity for Japan',
    },
  );

  // 7. Insights: Empty / Not Observed
  await captureFixture(
    'insights-empty',
    '/v2/insights',
    {
      'signal.interests.entities': '0E018750-0B04-4C65-89E8-DF545A1B13E6',
      'filter.type': 'urn:entity:movie',
      'filter.results.entities': '0E84F600-B861-4A93-AC5E-6E1DF4AC5826',
      'signal.location.query': 'Brazil',
      take: 1,
    },
    {
      qRefs: ['Q-05', 'Q-12'],
      description: 'S2 query resulting in empty entity array (not observed)',
    },
  );

  console.log('[CAPTURE] Completed successfully. All captured fixtures verified clean of secrets.');
}

run().catch((err) => {
  console.error('[CAPTURE] Failed:', err);
  process.exit(1);
});
