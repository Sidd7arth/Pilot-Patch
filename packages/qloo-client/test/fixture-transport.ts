// packages/qloo-client/test/fixture-transport.ts
// TEST-ONLY FIXTURE TRANSPORT.
// RULE (SEC-40): Never reachable from composition root or production exports.
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const FIXTURES_DIR = path.join(__dirname, 'fixtures', 'live-captures');

export function createFixtureFetch(): typeof fetch {
  return async (input: RequestInfo | URL, init?: RequestInit): Promise<Response> => {
    const urlStr = typeof input === 'string' ? input : input.toString();
    const url = new URL(urlStr);
    const pathname = url.pathname;

    let fixtureFile: string;

    if (pathname === '/') {
      const authHeader = (init?.headers as Record<string, string>)?.['X-Api-Key'];
      if (authHeader === 'invalid-key') {
        fixtureFile = 'auth-negative.json';
      } else {
        fixtureFile = 'auth-positive.json';
      }
    } else if (pathname === '/search') {
      const q = url.searchParams.get('query');
      if (q === 'NonExistentEntityEmpty') {
        return new Response(JSON.stringify({ results: [] }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      if (q === 'AmbiguousTopic') {
        return new Response(
          JSON.stringify({
            results: [
              { entity_id: 'amb-1', name: 'Ambiguous Artist 1', types: ['urn:entity:artist'] },
              { entity_id: 'amb-2', name: 'Ambiguous Artist 2', types: ['urn:entity:artist'] },
            ],
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          },
        );
      }
      const types = url.searchParams.get('types');
      if (types?.includes('artist')) {
        fixtureFile = 'search-artists.json';
      } else {
        fixtureFile = 'search-videogames.json';
      }
    } else if (pathname === '/v2/insights') {
      const loc = url.searchParams.get('signal.location.query');
      const candidates = url.searchParams.get('filter.results.entities');
      if (candidates === 'empty-trigger') {
        fixtureFile = 'insights-empty.json';
      } else if (loc) {
        fixtureFile = 'insights-market-conditioned.json';
      } else {
        fixtureFile = 'insights-ranked-entities.json';
      }
    } else {
      return new Response(JSON.stringify({ error: { reason: 'Not found' } }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const fullPath = path.join(FIXTURES_DIR, fixtureFile);
    if (!fs.existsSync(fullPath)) {
      throw new Error(`Fixture not found: ${fixtureFile}`);
    }

    const content = fs.readFileSync(fullPath, 'utf-8');
    const isError = fixtureFile.includes('negative');

    return new Response(content, {
      status: isError ? 401 : 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  };
}
