CREATE TABLE IF NOT EXISTS fencing_enforcement_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL,
  presented_version BIGINT,
  current_version BIGINT,
  result TEXT NOT NULL
    CHECK(result IN ('ALLOWED','BLOCKED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_promotion_gates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  dead_letter_id UUID REFERENCES dead_letter_jobs(id) ON DELETE CASCADE,
  replay_key TEXT NOT NULL UNIQUE,
  canary_id UUID REFERENCES dlq_canary_replays(id) ON DELETE SET NULL,
  required_checks INTEGER NOT NULL,
  passed_checks INTEGER NOT NULL,
  promotion_status TEXT NOT NULL
    CHECK(promotion_status IN ('ELIGIBLE','BLOCKED','PROMOTED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delegation_revocation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  delegation_id UUID REFERENCES approval_delegations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('SCHEDULED','EXECUTED','SKIPPED')),
  executed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS risk_forecast_confidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  current_score NUMERIC(10,3) NOT NULL,
  projected_score NUMERIC(10,3),
  lower_bound NUMERIC(10,3),
  upper_bound NUMERIC(10,3),
  confidence NUMERIC(6,3) NOT NULL,
  horizon_periods INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS signed_governance_bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id TEXT NOT NULL UNIQUE,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  key_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  manifest JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fencing_enforcement_time
ON fencing_enforcement_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_canary_promotion_time
ON canary_promotion_gates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_delegation_revocation_status
ON delegation_revocation_jobs(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_forecast_confidence_time
ON risk_forecast_confidence(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_signed_bundle_time
ON signed_governance_bundles(created_at DESC);
