CREATE TABLE IF NOT EXISTS lock_fencing_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  token_version BIGINT NOT NULL,
  token TEXT NOT NULL UNIQUE,
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('ACTIVE','REVOKED','EXPIRED'))
);

CREATE UNIQUE INDEX IF NOT EXISTS uq_active_fencing_resource
ON lock_fencing_tokens(resource_key)
WHERE status='ACTIVE';

CREATE TABLE IF NOT EXISTS dlq_canary_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dead_letter_id UUID REFERENCES dead_letter_jobs(id) ON DELETE CASCADE,
  replay_key TEXT NOT NULL UNIQUE,
  canary_percent NUMERIC(6,3) NOT NULL,
  canary_status TEXT NOT NULL
    CHECK(canary_status IN ('REQUESTED','PASSED','FAILED','BLOCKED')),
  validation_summary JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delegation_lifecycle_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_id UUID REFERENCES approval_delegations(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL
    CHECK(event_type IN ('ACTIVATED','EXPIRED','REVOKED')),
  actor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_score NUMERIC(10,3) NOT NULL,
  slope_per_period NUMERIC(10,4) NOT NULL,
  horizon_periods INTEGER NOT NULL,
  projected_score NUMERIC(10,3),
  forecast_status TEXT NOT NULL
    CHECK(forecast_status IN ('IMPROVING','STABLE','WORSENING','CRITICAL')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signed_decision_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  decision_id UUID REFERENCES executive_decision_records(id) ON DELETE CASCADE,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  key_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  evidence JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fencing_expiry
ON lock_fencing_tokens(expires_at,status);

CREATE INDEX IF NOT EXISTS idx_canary_replays_time
ON dlq_canary_replays(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delegation_events_time
ON delegation_lifecycle_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_risk_forecasts_time
ON risk_forecasts(created_at DESC);
