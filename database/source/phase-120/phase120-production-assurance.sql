CREATE TABLE IF NOT EXISTS fencing_envelopes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL,
  token_version BIGINT NOT NULL,
  payload_digest TEXT NOT NULL,
  envelope_digest TEXT NOT NULL UNIQUE,
  signature TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  key_version TEXT NOT NULL,
  expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('ACTIVE','EXPIRED','REVOKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_rollouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rollout_key TEXT NOT NULL UNIQUE,
  stage TEXT NOT NULL
    CHECK(stage IN ('PRECHECK','CANARY','OBSERVE','PROMOTING','PROMOTED','ROLLING_BACK','ROLLED_BACK','FAILED')),
  traffic_percent NUMERIC(6,3) NOT NULL,
  error_rate NUMERIC(8,3) DEFAULT 0,
  latency_regression NUMERIC(8,3) DEFAULT 0,
  reason TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delegation_scheduler_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_id UUID REFERENCES approval_delegations(id) ON DELETE CASCADE,
  run_key TEXT NOT NULL UNIQUE,
  scheduled_for TIMESTAMPTZ NOT NULL,
  claimed_by TEXT,
  status TEXT NOT NULL
    CHECK(status IN ('SCHEDULED','CLAIMED','EXECUTED','SKIPPED')),
  claimed_at TIMESTAMPTZ,
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS forecast_interval_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_count INTEGER NOT NULL,
  horizon_periods INTEGER NOT NULL,
  coverage_target NUMERIC(6,3) NOT NULL,
  empirical_coverage NUMERIC(6,3),
  interval_width NUMERIC(10,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kms_verification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  key_reference TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  verification_result TEXT NOT NULL
    CHECK(verification_result IN ('VALID','INVALID','BLOCKED')),
  digest TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fencing_envelopes_expiry
ON fencing_envelopes(expires_at,status);

CREATE INDEX IF NOT EXISTS idx_canary_rollouts_stage
ON canary_rollouts(stage,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_delegation_scheduler_status
ON delegation_scheduler_jobs(status,scheduled_for);

CREATE INDEX IF NOT EXISTS idx_forecast_interval_time
ON forecast_interval_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kms_verification_time
ON kms_verification_events(created_at DESC);
