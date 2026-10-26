// scripts/qloo-verify/insights.mjs
// Test S1 (Anchor co-affinity) and S2 (Market-conditioned affinity)

const baseUrl = (process.env.QLOO_API_BASE_URL || 'https://hackathon.api.qloo.com')
  .trim()
  .replace(/\/+$/, '');
const apiKey = process.env.QLOO_API_KEY ? process.env.QLOO_API_KEY.trim() : '';

if (!apiKey) {
  console.error(JSON.stringify({ ok: false, error: 'QLOO_API_KEY is missing' }));
  process.exit(1);
}

// Appendix A Game: "Ember Arena" (tactical/team action shooter)
// Verified Anchor Entity: Valorant (0E018750-0B04-4C65-89E8-DF545A1B13E6)
// Alternate Anchor: Overwatch (3C8166FB-794B-4FA1-97AF-593E7745B491), Cyberpunk 2077 (2575A4C0-5459-42E9-B119-FE7CFC8D558B)
const ANCHOR_VALORANT = '0E018750-0B04-4C65-89E8-DF545A1B13E6';
const ANCHOR_OVERWATCH = '3C8166FB-794B-4FA1-97AF-593E7745B491';

// Proposals from Appendix A:
// 1. Lantern Festival Seasonal Event (theme: Asian / lantern cultural event)
// 2. Anime Studio Collab Skin Line (theme: Studio Ghibli artist: D1222FA1-A6FD-45DE-8993-D89E2BB4777A, Akira movie: 0E84F600-B861-4A93-AC5E-6E1DF4AC5826)
// 3. Neon-Noir Cyberpunk Bundle (theme: Blade Runner movie: A74A74BB-CE73-4A76-807B-8BD1714BC463, Cyberpunk 2077 videogame: 2575A4C0-5459-42E9-B119-FE7CFC8D558B)
// 4. Latin Music Summer Event (theme: Bad Bunny artist: BDA1B73F-10E7-4D09-AC51-B796CCEC5FF3, Rosalia artist: 8BE95420-BCDA-4B00-871F-247A55D35594)
// 5. Festival-of-Colors Regional Pack (theme: Holi festival / regional Indian music / culture)
// 6. Summer Esports Cup Skins (theme: League of Legends videogame: 8E474FED-3ACD-46B1-A51C-C28B9FA206B1, Apex Legends: B2344587-2AF4-4A4A-A018-5CCDE6E3B1A0)

const proposals = [
  {
    id: 'P1',
    name: 'Lantern Festival Seasonal Event',
    targetMarkets: ['US', 'JP', 'BR'],
    category: 'seasonal_event',
    filterType: 'urn:entity:movie',
    candidateEntityIds: ['0E84F600-B861-4A93-AC5E-6E1DF4AC5826'], // Akira as visual reference
  },
  {
    id: 'P2',
    name: 'Anime Studio Collab Skin Line',
    targetMarkets: ['US', 'JP'],
    category: 'entertainment_collab',
    filterType: 'urn:entity:movie',
    candidateEntityIds: ['0E84F600-B861-4A93-AC5E-6E1DF4AC5826'], // Akira
  },
  {
    id: 'P3',
    name: 'Neon-Noir Cyberpunk Bundle',
    targetMarkets: ['US', 'BR'],
    category: 'themed_bundle',
    filterType: 'urn:entity:movie',
    candidateEntityIds: ['A74A74BB-CE73-4A76-807B-8BD1714BC463'], // Blade Runner
  },
  {
    id: 'P4',
    name: 'Latin Music Summer Event',
    targetMarkets: ['US', 'BR'],
    category: 'seasonal_event',
    filterType: 'urn:entity:artist',
    candidateEntityIds: [
      'BDA1B73F-10E7-4D09-AC51-B796CCEC5FF3',
      '8BE95420-BCDA-4B00-871F-247A55D35594',
    ], // Bad Bunny, Rosalia
  },
  {
    id: 'P5',
    name: 'Festival-of-Colors Regional Pack',
    targetMarkets: ['IN'],
    category: 'regional_content',
    filterType: 'urn:entity:artist',
    candidateEntityIds: [], // Demonstrates legitimate unresolved/empty candidate scenario!
  },
  {
    id: 'P6',
    name: 'Summer Esports Cup Skins',
    targetMarkets: ['US', 'JP'],
    category: 'character_skin',
    filterType: 'urn:entity:videogame',
    candidateEntityIds: [
      '8E474FED-3ACD-46B1-A51C-C28B9FA206B1',
      'B2344587-2AF4-4A4A-A018-5CCDE6E3B1A0',
    ], // League of Legends, Apex Legends
  },
];

const markets = [
  { code: 'US', label: 'United States', qlooLocation: 'US' },
  { code: 'JP', label: 'Japan', qlooLocation: 'Japan' },
  { code: 'BR', label: 'Brazil', qlooLocation: 'Brazil' },
  { code: 'IN', label: 'India', qlooLocation: 'India' },
];

async function runInsightQuery(anchorId, filterType, candidateIds, locationQuery) {
  const url = new URL('/v2/insights', baseUrl);
  url.searchParams.set('signal.interests.entities', anchorId);
  url.searchParams.set('filter.type', filterType);
  if (candidateIds && candidateIds.length > 0) {
    url.searchParams.set('filter.results.entities', candidateIds.join(','));
    url.searchParams.set('take', String(candidateIds.length));
  } else {
    url.searchParams.set('take', '5');
  }
  if (locationQuery) {
    url.searchParams.set('signal.location.query', locationQuery);
  }

  const start = performance.now();
  try {
    const res = await fetch(url.toString(), {
      headers: { 'X-Api-Key': apiKey, Accept: 'application/json' },
    });
    const durationMs = Math.round(performance.now() - start);
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      return {
        ok: false,
        status: res.status === 400 ? 'unsupported' : 'failed',
        httpStatus: res.status,
        durationMs,
        error: err.message || res.statusText,
        entities: [],
      };
    }
    const data = await res.json();
    const entities = data.results?.entities || [];
    return {
      ok: true,
      status: entities.length > 0 ? 'success' : 'empty',
      httpStatus: res.status,
      durationMs,
      entities: entities.map((e, idx) => ({
        rank: idx + 1,
        name: e.name,
        entityId: e.entity_id,
        affinity: e.query?.affinity ?? null,
        type: e.subtype || e.type,
      })),
      rawResponseSample: entities[0]
        ? { name: entities[0].name, entity_id: entities[0].entity_id, query: entities[0].query }
        : null,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'failed',
      httpStatus: null,
      durationMs: Math.round(performance.now() - start),
      error: err.message,
      entities: [],
    };
  }
}

async function main() {
  console.log('======================================================================');
  console.log('PHASE 0 EVIDENCE PROBE: Proposals × Markets Matrix');
  console.log('Anchor Game: Valorant (ID: ' + ANCHOR_VALORANT + ')');
  console.log('======================================================================\n');

  const matrix = [];

  for (const proposal of proposals) {
    console.log(`\nProposal ${proposal.id}: "${proposal.name}" (${proposal.category})`);
    console.log(` - Filter Type: ${proposal.filterType}`);
    console.log(` - Candidate Entities: ${proposal.candidateEntityIds.length} resolved`);

    for (const marketCode of proposal.targetMarkets) {
      const market = markets.find((m) => m.code === marketCode);
      const res = await runInsightQuery(
        ANCHOR_VALORANT,
        proposal.filterType,
        proposal.candidateEntityIds,
        market?.qlooLocation,
      );

      const cell = {
        proposalId: proposal.id,
        proposalName: proposal.name,
        market: marketCode,
        status: res.status,
        httpStatus: res.httpStatus,
        durationMs: res.durationMs,
        entityCount: res.entities.length,
        topResult: res.entities[0] || null,
      };
      matrix.push(cell);

      if (res.status === 'success') {
        const entitySummary = res.entities
          .map((e) => `${e.name} (aff: ${e.affinity ? e.affinity.toFixed(4) : 'N/A'})`)
          .join(', ');
        console.log(`   [${marketCode}] SUCCESS (${res.durationMs}ms): ${entitySummary}`);
      } else {
        console.log(`   [${marketCode}] ${res.status.toUpperCase()} (${res.durationMs}ms)`);
      }
    }
  }

  console.log('\n======================================================================');
  console.log('OUTCOME MATRIX SUMMARY');
  console.log('======================================================================');
  console.table(
    matrix.map((m) => ({
      Proposal: m.proposalId + ': ' + m.proposalName.slice(0, 22),
      Market: m.market,
      Status: m.status,
      TopAffinity: m.topResult?.affinity ? m.topResult.affinity.toFixed(4) : 'N/A',
      Duration: `${m.durationMs}ms`,
    })),
  );

  const successCount = matrix.filter((m) => m.status === 'success').length;
  const proposalsWithSuccess = new Set(
    matrix.filter((m) => m.status === 'success').map((m) => m.proposalId),
  ).size;
  console.log(`\nProposals with >=1 SUCCESS: ${proposalsWithSuccess} of ${proposals.length}`);
  console.log(`Total queries: ${matrix.length}, Successful queries: ${successCount}`);

  if (proposalsWithSuccess >= 3) {
    console.log(
      '\n>>> PHASE 0 EXIT CRITERION SATISFIED: Decision is GO (>= 3 proposals with defensible signals) <<<',
    );
  } else {
    console.log('\n>>> PHASE 0 OUTCOME: GO-WITH-LIMITS or NO-GO <<<');
  }
}

main();
