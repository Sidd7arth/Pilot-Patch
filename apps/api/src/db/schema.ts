import {
  pgTable,
  uuid,
  text,
  varchar,
  char,
  integer,
  smallint,
  bigint,
  boolean,
  numeric,
  timestamp,
  date,
  jsonb,
  primaryKey,
  unique,
  index,
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

// ---------------------------------------------------------------------------
// 4.1 workspaces
// ---------------------------------------------------------------------------
export const workspaces = pgTable(
  'workspaces',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    expiresAt: timestamp('expires_at', { withTimezone: true, mode: 'date' }).notNull(),
    demoSeeded: boolean('demo_seeded').notNull().default(false),
    qlooCallsUsedToday: integer('qloo_calls_used_today').notNull().default(0),
    qlooQuotaWindowStart: timestamp('qloo_quota_window_start', {
      withTimezone: true,
      mode: 'date',
    })
      .notNull()
      .defaultNow(),
    accessVerified: boolean('access_verified').notNull().default(false),
  },
  (table) => [index('workspaces_expires_at_idx').on(table.expiresAt)],
);

// ---------------------------------------------------------------------------
// 4.2 games (one per workspace in MVP)
// ---------------------------------------------------------------------------
export const games = pgTable('games', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' })
    .unique(),
  name: varchar('name', { length: 120 }).notNull(),
  description: text('description'),
  genreTags: text('genre_tags')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  platforms: text('platforms')
    .array()
    .notNull()
    .default(sql`'{}'::text[]`),
  dataOrigin: text('data_origin').notNull(),
  createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 4.3 markets
// ---------------------------------------------------------------------------
export const markets = pgTable(
  'markets',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    name: text('name').notNull(),
    countryCode: char('country_code', { length: 2 }),
    regionLabel: text('region_label'),
    weight: numeric('weight', { precision: 6, scale: 5 }).notNull(),
    qlooLocationHint: text('qloo_location_hint'),
    audienceNotes: varchar('audience_notes', { length: 1000 }),
    dataOrigin: text('data_origin').notNull(),
  },
  (table) => [unique('markets_workspace_id_name_unique').on(table.workspaceId, table.name)],
);

// ---------------------------------------------------------------------------
// 4.4 planning_constraints (one per workspace)
// ---------------------------------------------------------------------------
export const planningConstraints = pgTable('planning_constraints', {
  workspaceId: uuid('workspace_id')
    .primaryKey()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  currency: char('currency', { length: 3 }).notNull().default('USD'),
  budgetTotalMinor: bigint('budget_total_minor', { mode: 'bigint' }).notNull(),
  contingencyReserveMinor: bigint('contingency_reserve_minor', { mode: 'bigint' })
    .notNull()
    .default(sql`0`),
  capacityPersonDays: integer('capacity_person_days'),
  capacityEnforcement: text('capacity_enforcement').notNull().default('hard'),
  horizonStart: date('horizon_start', { mode: 'string' }).notNull(),
  horizonEnd: date('horizon_end', { mode: 'string' }).notNull(),
  horizonEnforcement: text('horizon_enforcement').notNull().default('hard'),
  maxSelections: integer('max_selections'),
  weights: jsonb('weights').$type<Record<string, number>>().notNull(),
  minCoverage: numeric('min_coverage', { precision: 4, scale: 3 }).notNull().default('0.5'),
  updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
});

// ---------------------------------------------------------------------------
// 4.5 proposals
// ---------------------------------------------------------------------------
export const proposals = pgTable(
  'proposals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    gameId: uuid('game_id')
      .notNull()
      .references(() => games.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 140 }).notNull(),
    description: varchar('description', { length: 4000 }),
    category: text('category').notNull(),
    status: text('status').notNull().default('candidate'),
    estimatedCostMinor: bigint('estimated_cost_minor', { mode: 'bigint' }).notNull(),
    currency: char('currency', { length: 3 }).notNull(),
    effortPersonDays: integer('effort_person_days').notNull(),
    releaseWindowStart: date('release_window_start', { mode: 'string' }).notNull(),
    releaseWindowEnd: date('release_window_end', { mode: 'string' }).notNull(),
    scheduleConfidence: smallint('schedule_confidence'),
    stakeholderPriority: smallint('stakeholder_priority'),
    openQuestions: jsonb('open_questions')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    assumptions: jsonb('assumptions')
      .$type<string[]>()
      .notNull()
      .default(sql`'[]'::jsonb`),
    dataOrigin: text('data_origin').notNull(),
    deletedAt: timestamp('deleted_at', { withTimezone: true, mode: 'date' }),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    updatedAt: timestamp('updated_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('proposals_workspace_id_name_unique').on(table.workspaceId, table.name),
    index('proposals_workspace_id_idx').on(table.workspaceId),
    index('proposals_workspace_id_status_idx').on(table.workspaceId, table.status),
  ],
);

// ---------------------------------------------------------------------------
// 4.5a proposal_markets
// ---------------------------------------------------------------------------
export const proposalMarkets = pgTable(
  'proposal_markets',
  {
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'cascade' }),
    marketId: uuid('market_id')
      .notNull()
      .references(() => markets.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.proposalId, table.marketId] }),
    index('proposal_markets_workspace_id_idx').on(table.workspaceId),
  ],
);

// ---------------------------------------------------------------------------
// 4.6 proposal_dependencies
// ---------------------------------------------------------------------------
export const proposalDependencies = pgTable('proposal_dependencies', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  proposalId: uuid('proposal_id')
    .notNull()
    .references(() => proposals.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(), // 'internal' | 'external'
  dependsOnProposalId: uuid('depends_on_proposal_id').references(() => proposals.id, {
    onDelete: 'cascade',
  }),
  description: varchar('description', { length: 300 }).notNull(),
  status: text('status').notNull(), // 'satisfied' | 'pending' | 'blocked'
  isHardBlocking: boolean('is_hard_blocking').notNull().default(true),
});

// ---------------------------------------------------------------------------
// 4.7 historical_records
// ---------------------------------------------------------------------------
export const historicalRecords = pgTable('historical_records', {
  id: uuid('id').primaryKey().defaultRandom(),
  workspaceId: uuid('workspace_id')
    .notNull()
    .references(() => workspaces.id, { onDelete: 'cascade' }),
  title: text('title').notNull(),
  contentCategory: text('content_category').notNull(),
  releaseDate: date('release_date', { mode: 'string' }),
  metricName: text('metric_name').notNull(),
  metricUnit: text('metric_unit').notNull(),
  metricValue: numeric('metric_value', { precision: 14, scale: 4 }).notNull(),
  baselineValue: numeric('baseline_value', { precision: 14, scale: 4 }).notNull(),
  periodNote: text('period_note'),
  notes: text('notes'),
  dataOrigin: text('data_origin').notNull(), // 'user_supplied' | 'synthetic_demo'
});

// ---------------------------------------------------------------------------
// 4.8 proposal_analogs
// ---------------------------------------------------------------------------
export const proposalAnalogs = pgTable(
  'proposal_analogs',
  {
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'cascade' }),
    historicalRecordId: uuid('historical_record_id')
      .notNull()
      .references(() => historicalRecords.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
  },
  (table) => [
    primaryKey({ columns: [table.proposalId, table.historicalRecordId] }),
    index('proposal_analogs_workspace_id_idx').on(table.workspaceId),
  ],
);

// ---------------------------------------------------------------------------
// 4.9 cultural_references
// ---------------------------------------------------------------------------
export const culturalReferences = pgTable(
  'cultural_references',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    ownerType: text('owner_type').notNull(), // 'game' | 'proposal'
    gameId: uuid('game_id').references(() => games.id, { onDelete: 'cascade' }),
    proposalId: uuid('proposal_id').references(() => proposals.id, { onDelete: 'cascade' }),
    role: text('role').notNull(), // 'audience_anchor' | 'cultural_theme'
    label: varchar('label', { length: 200 }).notNull(),
    entityTypeHint: text('entity_type_hint'),
    dataOrigin: text('data_origin').notNull(), // 'user_supplied' | 'synthetic_demo'
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [index('cultural_references_workspace_idx').on(table.workspaceId)],
);

// ---------------------------------------------------------------------------
// 4.10 qloo_queries
// ---------------------------------------------------------------------------
export const qlooQueries = pgTable(
  'qloo_queries',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    purpose: text('purpose').notNull(),
    endpoint: text('endpoint').notNull(),
    sanitizedParams: jsonb('sanitized_params').$type<Record<string, unknown>>().notNull(),
    requestFingerprint: text('request_fingerprint').notNull(),
    status: text('status').notNull(),
    httpStatus: integer('http_status'),
    errorClass: text('error_class'),
    errorMessage: varchar('error_message', { length: 500 }),
    retrievedAt: timestamp('retrieved_at', { withTimezone: true, mode: 'date' }).notNull(),
    durationMs: integer('duration_ms').notNull(),
    attempts: integer('attempts').notNull().default(1),
    adapterVersion: text('adapter_version').notNull(),
    qlooRequestId: text('qloo_request_id'),
    qlooApiVersion: text('qloo_api_version'),
    schemaMismatch: boolean('schema_mismatch').notNull().default(false),
    cacheState: text('cache_state').notNull(),
    dataOrigin: text('data_origin').notNull(), // 'live_qloo' | 'cached_qloo'
    rawResponse: jsonb('raw_response'),
    rawTruncated: boolean('raw_truncated').notNull().default(false),
    signalConfigVersion: text('signal_config_version'),
  },
  (table) => [
    index('qloo_queries_fingerprint_retrieved_idx').on(table.requestFingerprint, table.retrievedAt),
    index('qloo_queries_workspace_retrieved_idx').on(table.workspaceId, table.retrievedAt),
    index('qloo_queries_status_idx').on(table.status),
  ],
);

// ---------------------------------------------------------------------------
// 4.11 qloo_evidence_items
// ---------------------------------------------------------------------------
export const qlooEvidenceItems = pgTable(
  'qloo_evidence_items',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    queryId: uuid('query_id')
      .notNull()
      .references(() => qlooQueries.id, { onDelete: 'cascade' }),
    position: integer('position').notNull(),
    qlooEntityId: text('qloo_entity_id').notNull(),
    entityName: text('entity_name').notNull(),
    entityType: text('entity_type').notNull(),
    entityAttributes: jsonb('entity_attributes')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    rawScoreFields: jsonb('raw_score_fields')
      .$type<Record<string, unknown>>()
      .notNull()
      .default(sql`'{}'::jsonb`),
    scoreSemantics: text('score_semantics').notNull().default('unverified'),
    dataOrigin: text('data_origin').notNull(),
  },
  (table) => [
    index('qloo_evidence_items_query_position_idx').on(table.queryId, table.position),
    index('qloo_evidence_items_entity_id_idx').on(table.qlooEntityId),
  ],
);

// ---------------------------------------------------------------------------
// 4.12 reference_resolutions
// ---------------------------------------------------------------------------
export const referenceResolutions = pgTable(
  'reference_resolutions',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    referenceId: uuid('reference_id')
      .notNull()
      .references(() => culturalReferences.id, { onDelete: 'cascade' })
      .unique(),
    status: text('status').notNull(),
    chosenQlooEntityId: text('chosen_qloo_entity_id'),
    chosenEntityName: text('chosen_entity_name'),
    chosenEntityType: text('chosen_entity_type'),
    chosenBy: text('chosen_by'), // 'auto' | 'user'
    candidates: jsonb('candidates')
      .$type<
        Array<{
          qlooEntityId: string;
          name: string;
          type: string;
          position: number;
        }>
      >()
      .notNull()
      .default(sql`'[]'::jsonb`),
    queryId: uuid('query_id').references(() => qlooQueries.id, { onDelete: 'set null' }),
    resolvedAt: timestamp('resolved_at', { withTimezone: true, mode: 'date' }),
    dataOrigin: text('data_origin').notNull(),
  },
  (table) => [index('reference_resolutions_workspace_idx').on(table.workspaceId)],
);

// ---------------------------------------------------------------------------
// 4.13 cultural_signals
// ---------------------------------------------------------------------------
export const culturalSignals = pgTable(
  'cultural_signals',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'cascade' }),
    marketId: uuid('market_id')
      .notNull()
      .references(() => markets.id, { onDelete: 'cascade' }),
    strategy: text('strategy').notNull(), // 'S1' | 'S2' | 'S3'
    direction: text('direction').notNull(), // 'supports' | 'not_observed'
    strengthBand: text('strength_band'), // 'strong' | 'moderate' | 'weak'
    strengthValue: numeric('strength_value', { precision: 6, scale: 5 }),
    basis: text('basis').notNull(),
    freshness: text('freshness').notNull(), // 'live' | 'cached_fresh' | 'cached_stale'
    signalConfigVersion: text('signal_config_version').notNull(),
    derivedAt: timestamp('derived_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
    supersededBy: uuid('superseded_by'),
  },
  (table) => [
    index('cultural_signals_lookup_idx').on(table.proposalId, table.marketId, table.strategy),
  ],
);

// ---------------------------------------------------------------------------
// 4.13a cultural_signal_evidence
// ---------------------------------------------------------------------------
export const culturalSignalEvidence = pgTable(
  'cultural_signal_evidence',
  {
    signalId: uuid('signal_id')
      .notNull()
      .references(() => culturalSignals.id, { onDelete: 'cascade' }),
    evidenceItemId: uuid('evidence_item_id')
      .notNull()
      .references(() => qlooEvidenceItems.id, { onDelete: 'cascade' }),
  },
  (table) => [primaryKey({ columns: [table.signalId, table.evidenceItemId] })],
);

// ---------------------------------------------------------------------------
// 4.14 decision_runs
// ---------------------------------------------------------------------------
export const decisionRuns = pgTable(
  'decision_runs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    label: text('label'),
    parentRunId: uuid('parent_run_id'),
    variants: text('variants').notNull(), // 'qloo_informed' | 'baseline' | 'both'
    engineVersion: text('engine_version').notNull(),
    signalConfigVersion: text('signal_config_version').notNull(),
    inputSnapshot: jsonb('input_snapshot').$type<Record<string, unknown>>().notNull(),
    inputHash: text('input_hash').notNull(),
    output: jsonb('output').$type<Record<string, unknown>>().notNull(),
    diffFromParent: jsonb('diff_from_parent').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('decision_runs_workspace_created_idx').on(table.workspaceId, table.createdAt),
    index('decision_runs_input_hash_idx').on(table.inputHash),
  ],
);

// ---------------------------------------------------------------------------
// 4.15 decision_rankings
// ---------------------------------------------------------------------------
export const decisionRankings = pgTable(
  'decision_rankings',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    runId: uuid('run_id')
      .notNull()
      .references(() => decisionRuns.id, { onDelete: 'cascade' }),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    variant: text('variant').notNull(), // 'qloo_informed' | 'baseline'
    proposalId: uuid('proposal_id')
      .notNull()
      .references(() => proposals.id, { onDelete: 'no action' }),
    rank: integer('rank'),
    score: numeric('score', { precision: 7, scale: 6 }),
    scoreLower: numeric('score_lower', { precision: 7, scale: 6 }),
    scoreUpper: numeric('score_upper', { precision: 7, scale: 6 }),
    coverage: numeric('coverage', { precision: 7, scale: 6 }).notNull(),
    status: text('status').notNull(),
    reasonCodes: text('reason_codes')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    flags: text('flags')
      .array()
      .notNull()
      .default(sql`'{}'::text[]`),
    criteria: jsonb('criteria').$type<Record<string, unknown>>().notNull(),
    explanation: jsonb('explanation').$type<Record<string, unknown>>().notNull(),
  },
  (table) => [
    unique('decision_rankings_run_variant_proposal_unique').on(
      table.runId,
      table.variant,
      table.proposalId,
    ),
    index('decision_rankings_workspace_idx').on(table.workspaceId),
  ],
);

// ---------------------------------------------------------------------------
// 4.16 briefs
// ---------------------------------------------------------------------------
export const briefs = pgTable(
  'briefs',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id')
      .notNull()
      .references(() => workspaces.id, { onDelete: 'cascade' }),
    runId: uuid('run_id')
      .notNull()
      .references(() => decisionRuns.id, { onDelete: 'cascade' }),
    version: integer('version').notNull(),
    content: jsonb('content').$type<Record<string, unknown>>().notNull(),
    markdown: text('markdown').notNull(),
    narrative: jsonb('narrative').$type<Record<string, unknown>>(),
    narrativeStatus: text('narrative_status').notNull().default('none'),
    narrativeMeta: jsonb('narrative_meta').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    unique('briefs_run_id_version_unique').on(table.runId, table.version),
    index('briefs_workspace_idx').on(table.workspaceId),
  ],
);

// ---------------------------------------------------------------------------
// 4.17 integration_events
// ---------------------------------------------------------------------------
export const integrationEvents = pgTable(
  'integration_events',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    workspaceId: uuid('workspace_id').references(() => workspaces.id, { onDelete: 'cascade' }),
    kind: text('kind').notNull(),
    detail: jsonb('detail').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true, mode: 'date' }).notNull().defaultNow(),
  },
  (table) => [
    index('integration_events_workspace_created_idx').on(table.workspaceId, table.createdAt),
  ],
);
