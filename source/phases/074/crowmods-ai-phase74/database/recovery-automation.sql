CREATE TABLE IF NOT EXISTS stabilization_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scaling_action_id UUID NOT NULL REFERENCES scaling_actions(id) ON DELETE CASCADE,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  duration_seconds INTEGER NOT NULL,
  ends_at TIMESTAMPTZ NOT NULL,
  status TEXT NOT NULL DEFAULT 'ACTIVE'
    CHECK(status IN ('ACTIVE','PASSED','FAILED','CANCELLED'))
);

CREATE TABLE IF NOT EXISTS verification_samples (
  id BIGSERIAL PRIMARY KEY,
  scaling_action_id UUID NOT NULL REFERENCES scaling_actions(id) ON DELETE CASCADE,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  workers INTEGER NOT NULL,
  lag BIGINT NOT NULL,
  error_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  throughput DOUBLE PRECISION NOT NULL DEFAULT 0,
  healthy BOOLEAN NOT NULL
);

CREATE TABLE IF NOT EXISTS recovery_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scaling_action_id UUID NOT NULL REFERENCES scaling_actions(id) ON DELETE CASCADE,
  healthy_samples INTEGER NOT NULL DEFAULT 0,
  unhealthy_samples INTEGER NOT NULL DEFAULT 0,
  confidence DOUBLE PRECISION NOT NULL DEFAULT 0,
  state TEXT NOT NULL DEFAULT 'VERIFYING'
    CHECK(state IN ('VERIFYING','RECOVERED','DEGRADED','ROLLBACK_RECOMMENDED')),
  closure_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_verification_samples_action_time
ON verification_samples(scaling_action_id,observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_runs_action
ON recovery_runs(scaling_action_id,updated_at DESC);
