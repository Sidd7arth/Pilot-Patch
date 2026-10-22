CREATE TABLE "briefs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"run_id" uuid NOT NULL,
	"version" integer NOT NULL,
	"content" jsonb NOT NULL,
	"markdown" text NOT NULL,
	"narrative" jsonb,
	"narrative_status" text DEFAULT 'none' NOT NULL,
	"narrative_meta" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "briefs_run_id_version_unique" UNIQUE("run_id","version")
);
--> statement-breakpoint
CREATE TABLE "cultural_references" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"owner_type" text NOT NULL,
	"game_id" uuid,
	"proposal_id" uuid,
	"role" text NOT NULL,
	"label" varchar(200) NOT NULL,
	"entity_type_hint" text,
	"data_origin" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "cultural_signal_evidence" (
	"signal_id" uuid NOT NULL,
	"evidence_item_id" uuid NOT NULL,
	CONSTRAINT "cultural_signal_evidence_signal_id_evidence_item_id_pk" PRIMARY KEY("signal_id","evidence_item_id")
);
--> statement-breakpoint
CREATE TABLE "cultural_signals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"strategy" text NOT NULL,
	"direction" text NOT NULL,
	"strength_band" text,
	"strength_value" numeric(6, 5),
	"basis" text NOT NULL,
	"freshness" text NOT NULL,
	"signal_config_version" text NOT NULL,
	"derived_at" timestamp with time zone DEFAULT now() NOT NULL,
	"superseded_by" uuid
);
--> statement-breakpoint
CREATE TABLE "decision_rankings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	"variant" text NOT NULL,
	"proposal_id" uuid NOT NULL,
	"rank" integer,
	"score" numeric(7, 6),
	"score_lower" numeric(7, 6),
	"score_upper" numeric(7, 6),
	"coverage" numeric(7, 6) NOT NULL,
	"status" text NOT NULL,
	"reason_codes" text[] DEFAULT '{}'::text[] NOT NULL,
	"flags" text[] DEFAULT '{}'::text[] NOT NULL,
	"criteria" jsonb NOT NULL,
	"explanation" jsonb NOT NULL,
	CONSTRAINT "decision_rankings_run_variant_proposal_unique" UNIQUE("run_id","variant","proposal_id")
);
--> statement-breakpoint
CREATE TABLE "decision_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"label" text,
	"parent_run_id" uuid,
	"variants" text NOT NULL,
	"engine_version" text NOT NULL,
	"signal_config_version" text NOT NULL,
	"input_snapshot" jsonb NOT NULL,
	"input_hash" text NOT NULL,
	"output" jsonb NOT NULL,
	"diff_from_parent" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "games" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"name" varchar(120) NOT NULL,
	"description" text,
	"genre_tags" text[] DEFAULT '{}'::text[] NOT NULL,
	"platforms" text[] DEFAULT '{}'::text[] NOT NULL,
	"data_origin" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "games_workspace_id_unique" UNIQUE("workspace_id")
);
--> statement-breakpoint
CREATE TABLE "historical_records" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"title" text NOT NULL,
	"content_category" text NOT NULL,
	"release_date" date,
	"metric_name" text NOT NULL,
	"metric_unit" text NOT NULL,
	"metric_value" numeric(14, 4) NOT NULL,
	"baseline_value" numeric(14, 4) NOT NULL,
	"period_note" text,
	"notes" text,
	"data_origin" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "integration_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"kind" text NOT NULL,
	"detail" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "markets" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"name" text NOT NULL,
	"country_code" char(2),
	"region_label" text,
	"weight" numeric(6, 5) NOT NULL,
	"qloo_location_hint" text,
	"audience_notes" varchar(1000),
	"data_origin" text NOT NULL,
	CONSTRAINT "markets_workspace_id_name_unique" UNIQUE("workspace_id","name")
);
--> statement-breakpoint
CREATE TABLE "planning_constraints" (
	"workspace_id" uuid PRIMARY KEY NOT NULL,
	"currency" char(3) DEFAULT 'USD' NOT NULL,
	"budget_total_minor" bigint NOT NULL,
	"contingency_reserve_minor" bigint DEFAULT 0 NOT NULL,
	"capacity_person_days" integer,
	"capacity_enforcement" text DEFAULT 'hard' NOT NULL,
	"horizon_start" date NOT NULL,
	"horizon_end" date NOT NULL,
	"horizon_enforcement" text DEFAULT 'hard' NOT NULL,
	"max_selections" integer,
	"weights" jsonb NOT NULL,
	"min_coverage" numeric(4, 3) DEFAULT '0.5' NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_analogs" (
	"proposal_id" uuid NOT NULL,
	"historical_record_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	CONSTRAINT "proposal_analogs_proposal_id_historical_record_id_pk" PRIMARY KEY("proposal_id","historical_record_id")
);
--> statement-breakpoint
CREATE TABLE "proposal_dependencies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"proposal_id" uuid NOT NULL,
	"kind" text NOT NULL,
	"depends_on_proposal_id" uuid,
	"description" varchar(300) NOT NULL,
	"status" text NOT NULL,
	"is_hard_blocking" boolean DEFAULT true NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proposal_markets" (
	"proposal_id" uuid NOT NULL,
	"market_id" uuid NOT NULL,
	"workspace_id" uuid NOT NULL,
	CONSTRAINT "proposal_markets_proposal_id_market_id_pk" PRIMARY KEY("proposal_id","market_id")
);
--> statement-breakpoint
CREATE TABLE "proposals" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"game_id" uuid NOT NULL,
	"name" varchar(140) NOT NULL,
	"description" varchar(4000),
	"category" text NOT NULL,
	"status" text DEFAULT 'candidate' NOT NULL,
	"estimated_cost_minor" bigint NOT NULL,
	"currency" char(3) NOT NULL,
	"effort_person_days" integer NOT NULL,
	"release_window_start" date NOT NULL,
	"release_window_end" date NOT NULL,
	"schedule_confidence" smallint,
	"stakeholder_priority" smallint,
	"open_questions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"assumptions" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"data_origin" text NOT NULL,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "proposals_workspace_id_name_unique" UNIQUE("workspace_id","name")
);
--> statement-breakpoint
CREATE TABLE "qloo_evidence_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"query_id" uuid NOT NULL,
	"position" integer NOT NULL,
	"qloo_entity_id" text NOT NULL,
	"entity_name" text NOT NULL,
	"entity_type" text NOT NULL,
	"entity_attributes" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"raw_score_fields" jsonb DEFAULT '{}'::jsonb NOT NULL,
	"score_semantics" text DEFAULT 'unverified' NOT NULL,
	"data_origin" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "qloo_queries" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid,
	"purpose" text NOT NULL,
	"endpoint" text NOT NULL,
	"sanitized_params" jsonb NOT NULL,
	"request_fingerprint" text NOT NULL,
	"status" text NOT NULL,
	"http_status" integer,
	"error_class" text,
	"error_message" varchar(500),
	"retrieved_at" timestamp with time zone NOT NULL,
	"duration_ms" integer NOT NULL,
	"attempts" integer DEFAULT 1 NOT NULL,
	"adapter_version" text NOT NULL,
	"qloo_request_id" text,
	"qloo_api_version" text,
	"schema_mismatch" boolean DEFAULT false NOT NULL,
	"cache_state" text NOT NULL,
	"data_origin" text NOT NULL,
	"raw_response" jsonb,
	"raw_truncated" boolean DEFAULT false NOT NULL,
	"signal_config_version" text
);
--> statement-breakpoint
CREATE TABLE "reference_resolutions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"workspace_id" uuid NOT NULL,
	"reference_id" uuid NOT NULL,
	"status" text NOT NULL,
	"chosen_qloo_entity_id" text,
	"chosen_entity_name" text,
	"chosen_entity_type" text,
	"chosen_by" text,
	"candidates" jsonb DEFAULT '[]'::jsonb NOT NULL,
	"query_id" uuid,
	"resolved_at" timestamp with time zone,
	"data_origin" text NOT NULL,
	CONSTRAINT "reference_resolutions_reference_id_unique" UNIQUE("reference_id")
);
--> statement-breakpoint
CREATE TABLE "workspaces" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"demo_seeded" boolean DEFAULT false NOT NULL,
	"qloo_calls_used_today" integer DEFAULT 0 NOT NULL,
	"qloo_quota_window_start" timestamp with time zone DEFAULT now() NOT NULL,
	"access_verified" boolean DEFAULT false NOT NULL
);
--> statement-breakpoint
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_run_id_decision_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."decision_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_references" ADD CONSTRAINT "cultural_references_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_references" ADD CONSTRAINT "cultural_references_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_references" ADD CONSTRAINT "cultural_references_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_signal_evidence" ADD CONSTRAINT "cultural_signal_evidence_signal_id_cultural_signals_id_fk" FOREIGN KEY ("signal_id") REFERENCES "public"."cultural_signals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_signal_evidence" ADD CONSTRAINT "cultural_signal_evidence_evidence_item_id_qloo_evidence_items_id_fk" FOREIGN KEY ("evidence_item_id") REFERENCES "public"."qloo_evidence_items"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_signals" ADD CONSTRAINT "cultural_signals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_signals" ADD CONSTRAINT "cultural_signals_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "cultural_signals" ADD CONSTRAINT "cultural_signals_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_rankings" ADD CONSTRAINT "decision_rankings_run_id_decision_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."decision_runs"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_rankings" ADD CONSTRAINT "decision_rankings_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_rankings" ADD CONSTRAINT "decision_rankings_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "decision_runs" ADD CONSTRAINT "decision_runs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "games" ADD CONSTRAINT "games_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "historical_records" ADD CONSTRAINT "historical_records_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "integration_events" ADD CONSTRAINT "integration_events_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "markets" ADD CONSTRAINT "markets_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "planning_constraints" ADD CONSTRAINT "planning_constraints_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_analogs" ADD CONSTRAINT "proposal_analogs_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_analogs" ADD CONSTRAINT "proposal_analogs_historical_record_id_historical_records_id_fk" FOREIGN KEY ("historical_record_id") REFERENCES "public"."historical_records"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_analogs" ADD CONSTRAINT "proposal_analogs_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_dependencies" ADD CONSTRAINT "proposal_dependencies_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_dependencies" ADD CONSTRAINT "proposal_dependencies_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_dependencies" ADD CONSTRAINT "proposal_dependencies_depends_on_proposal_id_proposals_id_fk" FOREIGN KEY ("depends_on_proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_markets" ADD CONSTRAINT "proposal_markets_proposal_id_proposals_id_fk" FOREIGN KEY ("proposal_id") REFERENCES "public"."proposals"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_markets" ADD CONSTRAINT "proposal_markets_market_id_markets_id_fk" FOREIGN KEY ("market_id") REFERENCES "public"."markets"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposal_markets" ADD CONSTRAINT "proposal_markets_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proposals" ADD CONSTRAINT "proposals_game_id_games_id_fk" FOREIGN KEY ("game_id") REFERENCES "public"."games"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qloo_evidence_items" ADD CONSTRAINT "qloo_evidence_items_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qloo_evidence_items" ADD CONSTRAINT "qloo_evidence_items_query_id_qloo_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."qloo_queries"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "qloo_queries" ADD CONSTRAINT "qloo_queries_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_resolutions" ADD CONSTRAINT "reference_resolutions_workspace_id_workspaces_id_fk" FOREIGN KEY ("workspace_id") REFERENCES "public"."workspaces"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_resolutions" ADD CONSTRAINT "reference_resolutions_reference_id_cultural_references_id_fk" FOREIGN KEY ("reference_id") REFERENCES "public"."cultural_references"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "reference_resolutions" ADD CONSTRAINT "reference_resolutions_query_id_qloo_queries_id_fk" FOREIGN KEY ("query_id") REFERENCES "public"."qloo_queries"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "briefs_workspace_idx" ON "briefs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "cultural_references_workspace_idx" ON "cultural_references" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "cultural_signals_lookup_idx" ON "cultural_signals" USING btree ("proposal_id","market_id","strategy");--> statement-breakpoint
CREATE INDEX "decision_rankings_workspace_idx" ON "decision_rankings" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "decision_runs_workspace_created_idx" ON "decision_runs" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "decision_runs_input_hash_idx" ON "decision_runs" USING btree ("input_hash");--> statement-breakpoint
CREATE INDEX "integration_events_workspace_created_idx" ON "integration_events" USING btree ("workspace_id","created_at");--> statement-breakpoint
CREATE INDEX "proposal_analogs_workspace_id_idx" ON "proposal_analogs" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "proposal_markets_workspace_id_idx" ON "proposal_markets" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "proposals_workspace_id_idx" ON "proposals" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "proposals_workspace_id_status_idx" ON "proposals" USING btree ("workspace_id","status");--> statement-breakpoint
CREATE INDEX "qloo_evidence_items_query_position_idx" ON "qloo_evidence_items" USING btree ("query_id","position");--> statement-breakpoint
CREATE INDEX "qloo_evidence_items_entity_id_idx" ON "qloo_evidence_items" USING btree ("qloo_entity_id");--> statement-breakpoint
CREATE INDEX "qloo_queries_fingerprint_retrieved_idx" ON "qloo_queries" USING btree ("request_fingerprint","retrieved_at");--> statement-breakpoint
CREATE INDEX "qloo_queries_workspace_retrieved_idx" ON "qloo_queries" USING btree ("workspace_id","retrieved_at");--> statement-breakpoint
CREATE INDEX "qloo_queries_status_idx" ON "qloo_queries" USING btree ("status");--> statement-breakpoint
CREATE INDEX "reference_resolutions_workspace_idx" ON "reference_resolutions" USING btree ("workspace_id");--> statement-breakpoint
CREATE INDEX "workspaces_expires_at_idx" ON "workspaces" USING btree ("expires_at");