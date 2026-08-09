CREATE TABLE IF NOT EXISTS autoscaling_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_group TEXT NOT NULL UNIQUE,
  min_workers INTEGER NOT NULL DEFAULT 1,
  max_workers INTEGER NOT NULL DEFAULT 20,
  target_lag BIGINT NOT NULL DEFAULT 100,
  scale_step INTEGER NOT NULL DEFAULT 1,
  cooldown_seconds INTEGER NOT NULL DEFAULT 300,
  scale_in_enabled BOOLEAN NOT NULL DEFAULT TRUE,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS scaling_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  consumer_group TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('SCALE_OUT','SCALE_IN','HOLD')),
  current_workers INTEGER NOT NULL,
  requested_workers INTEGER NOT NULL,
  applied_workers INTEGER,
  reason TEXT NOT NULL,
  approval_status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(approval_status IN ('PENDING','APPROVED','REJECTED')),
  execution_status TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK(execution_status IN ('PLANNED','APPLIED','FAILED','ROLLED_BACK')),
  cost_score DOUBLE PRECISION,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  applied_at TIMESTAMPTZ,
  rolled_back_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS scaling_verifications (
  id BIGSERIAL PRIMARY KEY,
  scaling_action_id UUID NOT NULL REFERENCES scaling_actions(id) ON DELETE CASCADE,
  workers_before INTEGER NOT NULL,
  workers_after INTEGER NOT NULL,
  lag_before BIGINT NOT NULL,
  lag_after BIGINT NOT NULL,
  healthy BOOLEAN NOT NULL,
  verified_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_scaling_actions_group_time
ON scaling_actions(consumer_group,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_scaling_actions_status
ON scaling_actions(execution_status,approval_status);

CREATE INDEX IF NOT EXISTS idx_scaling_verifications_time
ON scaling_verifications(verified_at DESC);
