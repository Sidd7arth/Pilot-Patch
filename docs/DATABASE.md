# PatchPilot — Database Design

| Field | Value |
|---|---|
| Document | `docs/DATABASE.md` |
| Version | 1.0 (documentation baseline) |
| Date | 2026-10-22 |
| Authority | Data model, constraints, indexes, lifecycle, migrations. |
| Engine | PostgreSQL (managed). ORM/migrations: Drizzle + drizzle-kit (default; see `ARCHITECTURE.md` §2). |

Persistence is justified (PRD AC-F3, AC-E4, AC-T1): immutable decision runs, traceable evidence, multi-session demo state.

---

## 1. Conventions

- Table/column names `snake_case`; API DTOs `camelCase` (mapped in repository layer).
- PKs: `uuid` (v4/v7 generated in app via `crypto.randomUUID()` or DB `gen_random_uuid()`).
- Timestamps: `timestamptz` UTC; `created_at` default `now()`; `updated_at` maintained by app.
- Money: `bigint` **minor units** (`*_minor`) + `currency char(3)` (ISO-4217). No floats for money.
- Effort: `integer` person-days (`effort_person_days`).
- Every tenant-owned table has `workspace_id uuid NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE`, indexed, and **all repository functions require it** (no unscoped queries).
- Enums implemented as Postgres `CHECK` constraints on `text` (or native enums) — migrations must be additive-friendly; prefer `text + CHECK`.
- `data_origin text NOT NULL CHECK (data_origin IN ('live_qloo','cached_qloo','test_fixture','synthetic_demo','user_supplied','system_derived'))` wherever a record's provenance matters. **`test_fixture` rows must never exist in production DB** (a startup assertion and a test enforce this).
- **Never persisted:** API keys, session secrets, LLM keys, raw request headers, cookies, IP addresses (rate limiting uses in-memory or hashed short-lived keys).

## 2. Data Domains (separation rules)

| Domain | Tables | Rule |
|---|---|---|
| Persisted user/studio data | `workspaces`, `games`, `markets`, `planning_constraints`, `historical_records` | Origin `user_supplied` or `synthetic_demo` |
| Proposal data | `proposals`, `proposal_markets`, `proposal_dependencies`, `proposal_analogs`, `cultural_references` | User-supplied references live here, **not** mixed with Qloo-resolved data |
| Normalized Qloo evidence | `reference_resolutions`, `qloo_queries`, `qloo_evidence_items` | Origin `live_qloo`/`cached_qloo` only; immutable after insert |
| Derived (system) data | `cultural_signals`, `cultural_signal_evidence` | Origin `system_derived`; always link to evidence; never treated as source evidence |
| Decision data | `decision_runs`, `decision_rankings` | Immutable snapshots; reproducible via `input_hash` |
| Generated briefs | `briefs` | Derived; reference run + evidence IDs |
| Operational | `integration_events` | Sanitized |

## 3. Entity-Relationship Overview

```
workspaces 1─1 games
workspaces 1─* markets            games 1─* markets
workspaces 1─1 planning_constraints
workspaces 1─* proposals          proposals *─* markets (proposal_markets)
proposals 1─* proposal_dependencies (→ proposals | external)
proposals *─* historical_records (proposal_analogs)
(games|proposals) 1─* cultural_references 1─0..1 reference_resolutions ─→ qloo_queries
qloo_queries 1─* qloo_evidence_items
cultural_signals *─* qloo_evidence_items (cultural_signal_evidence);  cultural_signals ─→ proposals, markets
decision_runs 1─* decision_rankings (variant × proposal) ; decision_runs ─→ decision_runs (parent)
decision_runs 1─* briefs
workspaces 1─* integration_events
```

## 4. Tables

Legend: **PK**, *FK*, `UQ`, `NN` (not null). Types abbreviated.

### 4.1 `workspaces`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| created_at / expires_at | timestamptz | NN; `expires_at > created_at` |
| demo_seeded | boolean | NN default false |
| qloo_calls_used_today | int | NN default 0, ≥0 |
| qloo_quota_window_start | timestamptz | NN |
| access_verified | boolean | NN default false (if `DEMO_ACCESS_CODE` set) |

Index: `(expires_at)` for purge.

### 4.2 `games` (one per workspace in MVP)
`id PK`, `workspace_id FK UQ NN`, `name text NN (1..120)`, `description text (≤2000)`, `genre_tags text[] NN default '{}'`, `platforms text[] NN default '{}'`, `data_origin NN`, `created_at`, `updated_at`.

### 4.3 `markets`
`id PK`, `workspace_id FK NN`, `game_id FK NN`, `name text NN`, `country_code char(2) NULL` (ISO-3166-1), `region_label text NULL`, `weight numeric(6,5) NN CHECK (weight > 0 AND weight <= 1)`, `qloo_location_hint text NULL` (value format determined by Q-09), `audience_notes text (≤1000)`, `data_origin NN`.
`UQ (workspace_id, name)`. App normalizes weights to sum 1 at run time (stored weights are relative inputs; engine input contains normalized values).

### 4.4 `planning_constraints` (one per workspace)
| Column | Type | Constraints |
|---|---|---|
| workspace_id | uuid | PK, FK |
| currency | char(3) | NN default 'USD' |
| budget_total_minor | bigint | NN, ≥0 |
| contingency_reserve_minor | bigint | NN default 0, ≥0, ≤ budget_total_minor |
| capacity_person_days | int | NULL (no capacity constraint) ≥0 |
| capacity_enforcement | text | NN default 'hard' CHECK in ('hard','advisory') |
| horizon_start / horizon_end | date | NN, `horizon_end >= horizon_start` |
| horizon_enforcement | text | NN default 'hard' CHECK in ('hard','advisory') |
| max_selections | int | NULL, ≥1 |
| weights | jsonb | NN; keys = criterion keys; validated sum = 1 (±1e-9) |
| min_coverage | numeric(4,3) | NN default 0.5 |
| updated_at | timestamptz | NN |

Budget is always a hard portfolio limit (see `ARCHITECTURE.md` §8.2); there is intentionally no `budget_enforcement` column.

### 4.5 `proposals`
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| workspace_id, game_id | uuid | FK NN |
| name | text | NN 1..140; `UQ(workspace_id, name)` |
| description | text | ≤4000 |
| category | text | NN CHECK in ('seasonal_event','character_skin','themed_bundle','entertainment_collab','regional_content','other') |
| status | text | NN default 'candidate' CHECK in ('candidate','under_review','approved','rejected','shipped') |
| estimated_cost_minor | bigint | NN ≥0 |
| currency | char(3) | NN; must equal `planning_constraints.currency` (enforced in service + trigger-free check on write) |
| effort_person_days | int | NN ≥0 |
| release_window_start / release_window_end | date | NN; `end >= start` |
| schedule_confidence | smallint | NULL CHECK 1..5 |
| stakeholder_priority | smallint | NULL CHECK 1..5 |
| open_questions | jsonb | NN default '[]' (array of strings, ≤20, each ≤300) |
| assumptions | jsonb | NN default '[]' |
| data_origin | text | NN |
| deleted_at | timestamptz | NULL — soft-delete marker (see §6); excluded from lists and new runs |
| created_at / updated_at | timestamptz | NN |

Indexes: `(workspace_id)`, `(workspace_id, status)`, partial `(workspace_id) WHERE deleted_at IS NULL`. Max 12 proposals per workspace (service-enforced).

### 4.5a `proposal_markets`
`proposal_id FK`, `market_id FK`, `workspace_id FK NN`, **PK (proposal_id, market_id)**. Both FKs must share `workspace_id` (service check + composite FK optional).

### 4.6 `proposal_dependencies`
`id PK`, `workspace_id`, `proposal_id FK NN`, `kind text NN CHECK in ('internal','external')`, `depends_on_proposal_id FK NULL` (required iff internal; `CHECK ((kind='internal') = (depends_on_proposal_id IS NOT NULL))`), `description text NN (≤300)`, `status text NN CHECK in ('satisfied','pending','blocked')`, `is_hard_blocking boolean NN default true`. `CHECK (depends_on_proposal_id <> proposal_id)`. Acyclicity enforced in service (DFS) on write; test covers.

### 4.7 `historical_records` (commercial evidence inputs)
`id PK`, `workspace_id`, `title text NN`, `content_category text NN` (same enum as proposals), `release_date date NULL`, `metric_name text NN` (e.g., "Event revenue index vs studio baseline"), `metric_unit text NN` (e.g., "ratio"), `metric_value numeric(14,4) NN`, `baseline_value numeric(14,4) NN CHECK (baseline_value > 0)`, `period_note text`, `notes text`, `data_origin NN CHECK in ('user_supplied','synthetic_demo')`. **Never auto-created or inferred by the system.**

### 4.8 `proposal_analogs`
`proposal_id FK`, `historical_record_id FK`, `workspace_id`, **PK (proposal_id, historical_record_id)**.

### 4.9 `cultural_references` (user-supplied only)
| Column | Type | Constraints |
|---|---|---|
| id | uuid | PK |
| workspace_id | uuid | FK NN |
| owner_type | text | NN CHECK in ('game','proposal') |
| owner_id | uuid | NN (game_id or proposal_id; integrity enforced in service; partial FKs via two nullable columns `game_id`, `proposal_id` with `CHECK (num_nonnulls(game_id, proposal_id)=1)` is the preferred implementation) |
| role | text | NN CHECK in ('audience_anchor','cultural_theme') |
| label | text | NN 1..200 (what the user typed) |
| entity_type_hint | text | NULL (value must come from verified Qloo type list, Q-08/Q-05; validated against a config table, not hard-coded guesses) |
| data_origin | text | NN ('user_supplied'/'synthetic_demo') |
| created_at | timestamptz | NN |

`UQ (owner, role, lower(label))`.

### 4.10 `qloo_queries` (provenance ledger; **immutable after insert**)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid NULL FK | NULL allowed only for global-cache rows (if Q-13 permits sharing) |
| purpose | text NN | 'resolve_entity','tag_lookup','insights_s1','insights_s2','insights_s3','probe' |
| endpoint | text NN | path only |
| sanitized_params | jsonb NN | no secrets |
| request_fingerprint | text NN | sha256 hex |
| status | text NN | CHECK in ('success','empty','unsupported','invalid_request','failed_auth','failed_rate_limited','failed_timeout','failed_network','failed_upstream','not_configured') |
| http_status | int NULL | |
| error_class / error_message | text NULL | sanitized, ≤500 chars |
| retrieved_at | timestamptz NN | time of live retrieval |
| duration_ms | int NN | |
| attempts | int NN ≥0 | |
| adapter_version | text NN | |
| qloo_request_id / qloo_api_version | text NULL | only if verified present (Q-16) |
| schema_mismatch | boolean NN default false | |
| cache_state | text NN | CHECK in ('live','cached_fresh','cached_stale') **at time of use**; see 4.10a |
| data_origin | text NN | CHECK in ('live_qloo','cached_qloo') (`test_fixture` forbidden) |
| raw_response | jsonb NULL | redacted, ≤256 KB; truncated flag in `raw_truncated boolean` |
| signal_config_version | text NULL | |

Indexes: `(request_fingerprint, retrieved_at DESC)` (cache lookup), `(workspace_id, retrieved_at DESC)`, `(status)`.

**4.10a Cache usage.** A cache hit creates **no new Qloo call**; it creates a lightweight `qloo_query_uses` row? To keep the MVP simple: cache hits reuse the original `qloo_queries` row, and the *usage context* (`live`/`cached_fresh`/`cached_stale`) is stored on dependent records (`cultural_signals.freshness`, `reference_resolutions.freshness`) and computed at read time from `retrieved_at` + TTL. The `cache_state` column on `qloo_queries` therefore records only the state of **that row's creation** (always `live`). Implementations must not mutate the row to mark staleness.

### 4.11 `qloo_evidence_items` (normalized results; immutable)
`id PK`, `workspace_id NULL FK` (same rule), `query_id FK NN → qloo_queries ON DELETE CASCADE`, `position int NN ≥0` (order in response), `qloo_entity_id text NN`, `entity_name text NN`, `entity_type text NN`, `entity_attributes jsonb NN default '{}'` (verified, normalized, e.g. tags/year — only fields verified in Phase 0), `raw_score_fields jsonb NN default '{}'` (verbatim numeric/score-like fields keyed by original name; **semantics unknown unless Q-10 verified**), `score_semantics text NN default 'unverified' CHECK in ('unverified','within_query_comparable','cross_query_comparable')`, `data_origin NN`.
Indexes: `(query_id, position)`, `(qloo_entity_id)`.

### 4.12 `reference_resolutions`
`id PK`, `workspace_id`, `reference_id FK UQ NN`, `status text NN CHECK in ('pending','resolved','ambiguous','unresolved','unsupported','failed')`, `chosen_qloo_entity_id text NULL`, `chosen_entity_name text NULL`, `chosen_entity_type text NULL`, `chosen_by text NULL CHECK in ('auto','user')`, `candidates jsonb NN default '[]'` (array of `{qlooEntityId,name,type,position}` copied from evidence items), `query_id FK NULL`, `resolved_at timestamptz NULL`, `data_origin NN` ('live_qloo'/'cached_qloo' when status in resolved/ambiguous/unresolved; else 'system_derived'). Rule: `status='resolved'` ⇒ `chosen_*` NOT NULL and `query_id` NOT NULL. Auto-resolution only when exactly one confident candidate per documented rule (exact normalized-name match after Phase 0 defines matching); otherwise `ambiguous`.

### 4.13 `cultural_signals` (derived, `system_derived`)
`id PK`, `workspace_id`, `proposal_id FK NN`, `market_id FK NN`, `strategy text NN CHECK in ('S1','S2','S3')`, `direction text NN CHECK in ('supports','not_observed')`, `strength_band text NULL CHECK in ('strong','moderate','weak')`, `strength_value numeric(6,5) NULL CHECK between 0 and 1`, `basis text NN`, `freshness text NN CHECK in ('live','cached_fresh','cached_stale')`, `signal_config_version text NN`, `derived_at timestamptz NN`, `superseded_by uuid NULL FK → cultural_signals(id)`.
Checks: `(direction='supports') = (strength_band IS NOT NULL)`; `strength_value IS NULL` unless signal mode is `score_normalized`.
Index: `(proposal_id, market_id, strategy) WHERE superseded_by IS NULL`.
Signals are **recomputed** (new row, old row superseded) when evidence is refreshed or config version changes; old signals are retained because runs reference them.

### 4.13a `cultural_signal_evidence`
`signal_id FK`, `evidence_item_id FK`, **PK (signal_id, evidence_item_id)**. Every signal must have ≥1 row (service invariant + test).

### 4.14 `decision_runs` (immutable)
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| workspace_id | uuid NN | |
| label | text NULL | |
| parent_run_id | uuid NULL FK self | replan lineage |
| variants | text NN CHECK in ('qloo_informed','baseline','both') | |
| engine_version | text NN | |
| signal_config_version | text NN | |
| input_snapshot | jsonb NN | full `DecisionInput` (self-contained; includes signal IDs and values) |
| input_hash | text NN | sha256 of canonical JSON |
| output | jsonb NN | full `DecisionOutput` |
| diff_from_parent | jsonb NULL | computed at creation |
| created_at | timestamptz NN | |

Index: `(workspace_id, created_at DESC)`, `(input_hash)`. **No UPDATE/DELETE of runs in app code** (except workspace cascade). A DB role/permission or test asserts no update paths exist.

### 4.15 `decision_rankings` (denormalized, queryable projection of `output`)
`id PK`, `run_id FK NN ON DELETE CASCADE`, `workspace_id`, `variant text NN CHECK in ('qloo_informed','baseline')`, `proposal_id FK NN`, `rank int NULL`, `score numeric(7,6) NULL`, `score_lower numeric(7,6) NULL`, `score_upper numeric(7,6) NULL`, `coverage numeric(7,6) NN`, `status text NN CHECK in ('selected','not_funded','deferred_unmet_dependency','excluded','unscored')`, `reason_codes text[] NN default '{}'`, `flags text[] NN default '{}'`, `criteria jsonb NN`, `explanation jsonb NN`.
`UQ (run_id, variant, proposal_id)`. `proposal_id` FK uses `ON DELETE NO ACTION`; proposals referenced by runs are **soft-removed** (see §6).

### 4.16 `briefs`
`id PK`, `workspace_id`, `run_id FK NN`, `version int NN` (per run, starting 1; `UQ(run_id, version)`), `content jsonb NN` (deterministic `DecisionBrief`), `markdown text NN`, `narrative jsonb NULL`, `narrative_status text NN CHECK in ('none','accepted','rejected')`, `narrative_meta jsonb NULL` (provider, model name, validator results — never prompts containing user data beyond packet, no keys), `created_at`. Immutable.

### 4.17 `integration_events`
`id`, `workspace_id NULL`, `kind text NN` ('probe_success','probe_failure','breaker_open','breaker_close','quota_exceeded','schema_mismatch'), `detail jsonb` (sanitized), `created_at`. Retention 14 days.

## 5. Indexing Summary

All FKs indexed; hot paths: cache lookup by fingerprint; evidence by `(query_id, position)`; signals by `(proposal_id, market_id)`; runs by `(workspace_id, created_at DESC)`; purge by `workspaces.expires_at`.

## 6. Lifecycle Rules

| Event | Rule |
|---|---|
| Workspace created | Row + (optional) synthetic seed in one transaction; `expires_at = now + WORKSPACE_TTL_DAYS` |
| Proposal edited | Allowed; existing runs unaffected (they hold snapshots). UI shows "inputs changed since run" by comparing current inputs' hash with `input_snapshot` |
| Proposal deleted | If referenced by any `decision_rankings`/`briefs`: **soft-delete** (`status='rejected'` is *not* deletion). Implement `deleted_at timestamptz NULL` on proposals; deleted proposals excluded from lists and new runs but retained for historical runs. Otherwise hard delete (cascades references, dependencies, signals) |
| Constraints edited | Does not change prior runs; replan creates a new run |
| Evidence refresh | Appends new `qloo_queries`/items; derives new signals superseding old; old rows retained while referenced |
| Run created | Immutable; briefs append-only |
| Workspace expiry | Nightly purge job (in-process scheduler or on-request opportunistic purge); `ON DELETE CASCADE` removes tenant data; global-cache rows (if allowed) purged by age |
| Qloo raw data retention | Subject to Q-13; configurable `QLOO_RAW_RETENTION_DAYS` (default 14) after which `raw_response` is nulled but normalized items/provenance remain |

## 7. Referential Integrity Invariants (tested)

1. A `resolved` resolution links to a query row with `status='success'` and an evidence item whose `qloo_entity_id` equals `chosen_qloo_entity_id`.
2. Every `cultural_signals` row has ≥1 evidence link; evidence belongs to queries for the same workspace (or global cache).
3. `decision_runs.input_snapshot` signal IDs resolve to existing signals (even if superseded).
4. No `test_fixture` rows in production.
5. Currency consistency across proposals, constraints, and historical records used as analogs is not required (ratios), but proposals/constraints must match.
6. No row stores secrets (pattern test over a seeded DB dump for key-like strings).

## 8. Migration Approach

- Versioned SQL migrations generated by drizzle-kit, committed under `apps/api/src/db/migrations`. Never edit applied migrations; add new ones.
- Migrations run via `pnpm db:migrate` as a deploy step; CI applies migrations to a fresh Postgres and then runs a **schema drift check** (generated SQL equals committed).
- First migration creates all tables above; `0002_seed_reference_data` (if any) must contain **no** Qloo-derived or fabricated content.
- Rollback: forward-fix preferred; each migration has a documented down note in its header comment (MVP does not require automated down migrations).
- Test DB: ephemeral Postgres (service container or Testcontainers); each integration test file uses a fresh schema or transaction rollback.

## 9. Seed Data Rules

Seed lives in `scripts/seed` and the `POST /workspaces {seedDemo:true}` path. It creates **only** `synthetic_demo` game/market/proposal/constraint/historical records (spec in `IMPLEMENTATION.md` Appendix A). It never creates Qloo evidence, resolutions, signals, runs, or briefs. Evidence must come from real calls.
