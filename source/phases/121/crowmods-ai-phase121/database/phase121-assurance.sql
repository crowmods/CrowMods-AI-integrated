CREATE TABLE IF NOT EXISTS fencing_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL,
  token_version BIGINT NOT NULL,
  payload_digest TEXT NOT NULL,
  verification_result TEXT NOT NULL
    CHECK(verification_result IN ('ACCEPTED','BLOCKED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_traffic_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rollout_key TEXT NOT NULL,
  stage_name TEXT NOT NULL,
  traffic_percent NUMERIC(6,3) NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('PENDING','ACTIVE','PASSED','FAILED')),
  entered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(rollout_key,stage_name)
);

CREATE TABLE IF NOT EXISTS delegation_queue_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_key TEXT NOT NULL UNIQUE,
  delegation_id UUID REFERENCES approval_delegations(id) ON DELETE CASCADE,
  worker_id TEXT NOT NULL,
  lease_token TEXT NOT NULL UNIQUE,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_expires_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('CLAIMED','COMPLETED','EXPIRED','RELEASED'))
);

CREATE TABLE IF NOT EXISTS forecast_quantile_calibration (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_count INTEGER NOT NULL,
  lower_quantile NUMERIC(7,4) NOT NULL,
  upper_quantile NUMERIC(7,4) NOT NULL,
  lower_error NUMERIC(10,4),
  upper_error NUMERIC(10,4),
  coverage NUMERIC(7,4),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kms_adapter_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  operation TEXT NOT NULL
    CHECK(operation IN ('SIGN','VERIFY')),
  key_reference TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('SUCCESS','FAILED','BLOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fencing_transactions_time
ON fencing_transactions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_canary_traffic_rollout
ON canary_traffic_stages(rollout_key,entered_at);

CREATE INDEX IF NOT EXISTS idx_delegation_claims_status
ON delegation_queue_claims(status,lease_expires_at);

CREATE INDEX IF NOT EXISTS idx_forecast_quantile_time
ON forecast_quantile_calibration(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kms_adapter_events_time
ON kms_adapter_events(created_at DESC);
