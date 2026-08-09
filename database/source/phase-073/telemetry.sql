CREATE TABLE IF NOT EXISTS capacity_telemetry (
  id BIGSERIAL PRIMARY KEY,
  consumer_group TEXT NOT NULL,
  workers INTEGER NOT NULL,
  lag BIGINT NOT NULL,
  throughput DOUBLE PRECISION NOT NULL DEFAULT 0,
  error_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  cpu_utilization DOUBLE PRECISION,
  memory_utilization DOUBLE PRECISION,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scaling_verification_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scaling_action_id UUID NOT NULL REFERENCES scaling_actions(id) ON DELETE CASCADE,
  expected_workers INTEGER NOT NULL,
  observed_workers INTEGER NOT NULL,
  lag_before BIGINT NOT NULL,
  lag_after BIGINT NOT NULL,
  error_rate DOUBLE PRECISION NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('PASS','FAIL','ROLLBACK_RECOMMENDED','PENDING')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scaling_state (
  consumer_group TEXT PRIMARY KEY,
  state TEXT NOT NULL DEFAULT 'STABLE'
    CHECK(state IN ('STABLE','SCALING_OUT','SCALING_IN','VERIFYING','COOLDOWN','DEGRADED')),
  last_transition_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  cooldown_until TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_capacity_telemetry_group_time
ON capacity_telemetry(consumer_group,observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_verification_runs_action
ON scaling_verification_runs(scaling_action_id,created_at DESC);
