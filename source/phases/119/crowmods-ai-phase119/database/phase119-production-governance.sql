CREATE TABLE IF NOT EXISTS downstream_fencing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  resource_key TEXT NOT NULL,
  token_version BIGINT NOT NULL,
  downstream TEXT NOT NULL,
  result TEXT NOT NULL
    CHECK(result IN ('ACCEPTED','BLOCKED')),
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS canary_rollout_decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  canary_id UUID REFERENCES dlq_canary_replays(id) ON DELETE SET NULL,
  decision TEXT NOT NULL
    CHECK(decision IN ('PROMOTE','ROLLBACK','HOLD')),
  reason TEXT NOT NULL,
  passed_checks INTEGER NOT NULL,
  failed_checks INTEGER NOT NULL,
  decided_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS delegation_worker_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  examined INTEGER NOT NULL,
  revoked INTEGER NOT NULL,
  skipped INTEGER NOT NULL,
  run_status TEXT NOT NULL
    CHECK(run_status IN ('COMPLETED','FAILED')),
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL
);

CREATE TABLE IF NOT EXISTS forecast_calibration_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sample_count INTEGER NOT NULL,
  mean_absolute_error NUMERIC(10,4),
  bias NUMERIC(10,4),
  calibrated_confidence NUMERIC(7,3),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS kms_signing_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider TEXT NOT NULL,
  key_reference TEXT NOT NULL,
  key_version TEXT,
  algorithm TEXT NOT NULL,
  digest TEXT NOT NULL,
  signature TEXT,
  status TEXT NOT NULL
    CHECK(status IN ('SIGNED','FAILED','BLOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_downstream_fencing_time
ON downstream_fencing_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_rollout_decisions_time
ON canary_rollout_decisions(decided_at DESC);

CREATE INDEX IF NOT EXISTS idx_delegation_worker_runs_time
ON delegation_worker_runs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_forecast_calibration_time
ON forecast_calibration_runs(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_kms_signing_time
ON kms_signing_events(created_at DESC);
