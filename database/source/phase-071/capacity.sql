CREATE TABLE IF NOT EXISTS capacity_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_group TEXT NOT NULL UNIQUE,
  min_workers INTEGER NOT NULL DEFAULT 1,
  max_workers INTEGER NOT NULL DEFAULT 20,
  target_lag BIGINT NOT NULL DEFAULT 100,
  scale_step INTEGER NOT NULL DEFAULT 1,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scaling_recommendations (
  id BIGSERIAL PRIMARY KEY,
  consumer_group TEXT NOT NULL,
  current_workers INTEGER NOT NULL,
  desired_workers INTEGER NOT NULL,
  lag_value BIGINT NOT NULL,
  target_lag BIGINT NOT NULL,
  action TEXT NOT NULL
    CHECK(action IN ('SCALE_OUT','SCALE_IN','HOLD')),
  reason TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'RECOMMENDED'
    CHECK(status IN ('RECOMMENDED','APPLIED','REJECTED','EXPIRED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_verifications (
  id BIGSERIAL PRIMARY KEY,
  consumer_group TEXT NOT NULL,
  incident_id UUID,
  lag_before BIGINT NOT NULL,
  lag_after BIGINT NOT NULL,
  error_rate DOUBLE PRECISION NOT NULL DEFAULT 0,
  healthy BOOLEAN NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scaling_group_time
ON scaling_recommendations(consumer_group,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_verification_group
ON recovery_verifications(consumer_group,verified_at DESC);
