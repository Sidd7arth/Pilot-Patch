// scripts/qloo-verify/resolve.mjs
// Non-negotiable: Never log or print the actual API key.

const baseUrl = (process.env.QLOO_API_BASE_URL || 'https://hackathon.api.qloo.com')
  .trim()
  .replace(/\/+$/, '');
const apiKey = process.env.QLOO_API_KEY ? process.env.QLOO_API_KEY.trim() : '';

if (!apiKey) {
  console.error(JSON.stringify({ ok: false, error: 'QLOO_API_KEY is missing' }));
  process.exit(1);
}

const testCandidates = [
  // Video games (>= 10 candidate game/franchise titles for Q-08)
  { query: 'Valorant', typeHint: 'videogame' },
  { query: 'Genshin Impact', typeHint: 'videogame' },
  { query: 'Overwatch', typeHint: 'videogame' },
  { query: 'Cyberpunk 2077', typeHint: 'videogame' },
  { query: 'League of Legends', typeHint: 'videogame' },
  { query: 'Apex Legends', typeHint: 'videogame' },
  { query: 'Elden Ring', typeHint: 'videogame' },
  { query: 'Fortnite', typeHint: 'videogame' },
  { query: 'Final Fantasy VII', typeHint: 'videogame' },
  { query: 'Street Fighter', typeHint: 'videogame' },
  { query: 'Minecraft', typeHint: 'videogame' },
  // Cultural theme references matching Appendix A proposals
  { query: 'Studio Ghibli', typeHint: 'brand' },
  { query: 'Blade Runner', typeHint: 'movie' },
  { query: 'Akira', typeHint: 'movie' },
  { query: 'Bad Bunny', typeHint: 'artist' },
  { query: 'Rosalia', typeHint: 'artist' },
  { query: 'Daft Punk', typeHint: 'artist' },
  // Edge cases: ambiguous, obscure, unsupported
  { query: 'Avatar', typeHint: null }, // ambiguous: movie vs anime vs artist
  { query: 'XyzzyNonExistentEntity999FooBar', typeHint: null }, // unresolved
];

async function searchEntity(item) {
  const url = new URL('/search', baseUrl);
  url.searchParams.set('query', item.query);
  url.searchParams.set('take', '5');
  if (item.typeHint) {
    const urn = item.typeHint.startsWith('urn:') ? item.typeHint : `urn:entity:${item.typeHint}`;
    url.searchParams.set('types', urn);
  }

  const start = performance.now();
  try {
    const res = await fetch(url.toString(), {
      headers: {
        'X-Api-Key': apiKey,
        Accept: 'application/json',
      },
    });
    const durationMs = Math.round(performance.now() - start);
    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return {
        query: item.query,
        typeHint: item.typeHint,
        status: res.status === 400 ? 'unsupported' : 'failed',
        httpStatus: res.status,
        durationMs,
        error: errBody.message || res.statusText,
        candidates: [],
      };
    }
    const data = await res.json();
    const entities = data.results || data.entities || data.data || [];

    let resolutionStatus = 'unresolved';
    if (entities.length === 1) {
      resolutionStatus = 'resolved';
    } else if (entities.length > 1) {
      const exact = entities.filter(
        (e) => (e.name || '').toLowerCase() === item.query.toLowerCase(),
      );
      resolutionStatus = exact.length === 1 ? 'resolved (exact in list)' : 'ambiguous';
    }

    return {
      query: item.query,
      typeHint: item.typeHint,
      status: resolutionStatus,
      httpStatus: res.status,
      durationMs,
      candidateCount: entities.length,
      topCandidates: entities.slice(0, 3).map((e) => ({
        id: e.entity_id || e.id,
        name: e.name,
        type: e.type || e.subtype,
        popularity: e.popularity,
      })),
      rawSample: entities[0] || null,
    };
  } catch (err) {
    return {
      query: item.query,
      typeHint: item.typeHint,
      status: 'failed',
      httpStatus: null,
      error: err.message,
      candidates: [],
    };
  }
}

async function main() {
  console.log(
    `[RESOLVE-PROBE] Probing ${testCandidates.length} candidate references across types...`,
  );
  const results = [];

  for (const item of testCandidates) {
    const result = await searchEntity(item);
    results.push(result);
    console.log(
      ` - "${item.query}" (${item.typeHint || 'any'}): ${result.status} (found: ${result.candidateCount ?? 0}, ${result.durationMs}ms)`,
    );
    if (result.topCandidates && result.topCandidates.length > 0) {
      console.log(
        `   Top match: [${result.topCandidates[0].type}] ${result.topCandidates[0].name} (ID: ${result.topCandidates[0].id})`,
      );
    }
  }

  // Check sample response structure
  const sampleWithData = results.find((r) => r.rawSample);
  if (sampleWithData) {
    console.log(`\n[RESOLVE-PROBE] Sample entity structure from /search:`);
    console.log(JSON.stringify(sampleWithData.rawSample, null, 2));
  }

  // Summary statistics
  const resolved = results.filter((r) => r.status.startsWith('resolved')).length;
  const ambiguous = results.filter((r) => r.status === 'ambiguous').length;
  const unresolved = results.filter((r) => r.status === 'unresolved').length;
  const failed = results.filter((r) => r.status === 'failed').length;

  console.log(
    `\n[RESOLVE-PROBE] Summary: ${resolved} resolved, ${ambiguous} ambiguous, ${unresolved} unresolved, ${failed} failed`,
  );
}

main();
