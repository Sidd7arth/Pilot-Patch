// scripts/qloo-verify/auth.mjs
// Non-negotiable: Never log or print the actual API key.

const baseUrl = (process.env.QLOO_API_BASE_URL || 'https://hackathon.api.qloo.com')
  .trim()
  .replace(/\/+$/, '');
const apiKey = process.env.QLOO_API_KEY ? process.env.QLOO_API_KEY.trim() : '';

if (!apiKey) {
  console.error(
    JSON.stringify({
      ok: false,
      step: 'auth',
      error: 'QLOO_API_KEY is not configured in environment or .env',
    }),
  );
  process.exit(1);
}

async function testPositiveAuth() {
  const start = performance.now();
  const url = `${baseUrl}/`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
    });
    const durationMs = Math.round(performance.now() - start);
    const contentType = res.headers.get('content-type') || '';
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }

    return {
      status: res.status,
      ok: res.ok,
      durationMs,
      contentType,
      body,
    };
  } catch (err) {
    return {
      status: null,
      ok: false,
      error: err.message,
    };
  }
}

async function testNegativeAuth() {
  const start = performance.now();
  const url = `${baseUrl}/`;

  try {
    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'X-Api-Key': 'deliberately_invalid_test_sentinel_key_patchpilot',
        Accept: 'application/json',
      },
    });
    const durationMs = Math.round(performance.now() - start);
    let body = null;
    try {
      body = await res.json();
    } catch {
      body = await res.text();
    }

    return {
      status: res.status,
      ok: res.ok,
      durationMs,
      classifiedAsAuthFailure: res.status === 401 || res.status === 403,
      body,
    };
  } catch (err) {
    return {
      status: null,
      ok: false,
      error: err.message,
    };
  }
}

async function main() {
  console.log(`[AUTH-PROBE] Target Base URL: ${baseUrl}`);
  console.log(`[AUTH-PROBE] Testing positive authentication on GET / ...`);
  const positive = await testPositiveAuth();
  console.log(
    `[AUTH-PROBE] Positive auth result: HTTP ${positive.status} (${positive.durationMs}ms)`,
  );
  console.log(`[AUTH-PROBE] Positive response shape:`, JSON.stringify(positive.body, null, 2));

  console.log(`[AUTH-PROBE] Testing negative authentication with invalid key on GET / ...`);
  const negative = await testNegativeAuth();
  console.log(
    `[AUTH-PROBE] Negative auth result: HTTP ${negative.status} (${negative.durationMs}ms)`,
  );
  console.log(`[AUTH-PROBE] Classified as auth failure: ${negative.classifiedAsAuthFailure}`);
  console.log(`[AUTH-PROBE] Negative response shape:`, JSON.stringify(negative.body, null, 2));

  const success = positive.ok && negative.classifiedAsAuthFailure;
  if (!success) {
    console.error(
      `[AUTH-PROBE] FAILED: Positive auth ok=${positive.ok}, Negative auth classified=${negative.classifiedAsAuthFailure}`,
    );
    process.exit(1);
  }
  console.log(`[AUTH-PROBE] PASSED: Real Qloo authentication verified successfully.`);
}

main();
