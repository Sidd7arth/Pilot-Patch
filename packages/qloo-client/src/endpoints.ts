// packages/qloo-client/src/endpoints.ts
// Authoritative constants for Qloo API communication.
// RULE: Every constant must reference verified evidence from Phase 0 (PHASE0_REPORT.md).
// No unverified endpoints or parameters are permitted.

/**
 * Verified Qloo API Hostnames
 * Evidence: Q-01, Q-02 (PHASE0_REPORT.md §V-3)
 */
export const QLOO_HOSTS = {
  HACKATHON: 'https://hackathon.api.qloo.com',
  PRODUCTION: 'https://api.qloo.com',
} as const;

/**
 * Verified Authentication Header
 * Evidence: Q-03 (PHASE0_REPORT.md §V-3, case-sensitive X-Api-Key)
 */
export const QLOO_AUTH_HEADER = 'X-Api-Key' as const;

/**
 * Verified API Endpoints
 * Evidence: Q-04, Q-06 (PHASE0_REPORT.md §V-4, §V-6)
 */
export const QLOO_ENDPOINTS = {
  SEARCH: '/search',
  INSIGHTS_V2: '/v2/insights',
  ROOT_PROBE: '/',
} as const;

/**
 * Verified Query Parameters for /search
 * Evidence: Q-05, Q-08 (PHASE0_REPORT.md §V-5)
 */
export const QLOO_SEARCH_PARAMS = {
  QUERY: 'query',
  TYPES: 'types',
  PAGE: 'page',
} as const;

/**
 * Verified Query Parameters for /v2/insights
 * Evidence: Q-06, Q-09, Q-10 (PHASE0_REPORT.md §V-6, §V-7)
 */
export const QLOO_INSIGHTS_PARAMS = {
  INTEREST_ENTITIES: 'signal.interests.entities',
  FILTER_TYPE: 'filter.type',
  FILTER_RESULTS_ENTITIES: 'filter.results.entities',
  LOCATION_QUERY: 'signal.location.query',
} as const;

/**
 * Verified Entity Type URNs
 * Evidence: Q-08 (PHASE0_REPORT.md §V-5, §V-6)
 */
export const QLOO_ENTITY_TYPES = {
  VIDEOGAME: 'urn:entity:videogame',
  ARTIST: 'urn:entity:artist',
  MOVIE: 'urn:entity:movie',
  BOOK: 'urn:entity:book',
  PODCAST: 'urn:entity:podcast',
  TV_SHOW: 'urn:entity:tv_show',
} as const;

export type QlooEntityType = (typeof QLOO_ENTITY_TYPES)[keyof typeof QLOO_ENTITY_TYPES];
