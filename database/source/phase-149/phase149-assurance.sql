CREATE TABLE IF NOT EXISTS approval_quorum_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL,
  policy_key TEXT NOT NULL,
  approval_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  decision TEXT NOT NULL CHECK(decision IN ('APPROVE','REJECT')),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replay_rate_limit_state (
  idempotency_key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  request_count INTEGER NOT NULL DEFAULT 0,
  limit_count INTEGER NOT NULL DEFAULT 5,
  state TEXT NOT NULL CHECK(state IN ('ALLOW','THROTTLED','ESCALATED')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hysteresis_policy_versions (
  policy_key TEXT NOT NULL,
  version INTEGER NOT NULL,
  breach_threshold INTEGER NOT NULL,
  recovery_threshold INTEGER NOT NULL,
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(policy_key,version)
);

CREATE TABLE IF NOT EXISTS adaptive_baseline_drift_controls (
  model_key TEXT PRIMARY KEY,
  min_rate NUMERIC(12,6) NOT NULL DEFAULT 0,
  max_rate NUMERIC(12,6) NOT NULL DEFAULT 1,
  max_step NUMERIC(12,6) NOT NULL DEFAULT .05,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_external_verification (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarantine_id UUID NOT NULL,
  adapter_key TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  verification_state TEXT NOT NULL CHECK(
    verification_state IN ('VERIFIED','REJECTED','UNAVAILABLE')
  ),
  adapter_reference TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quorum_queue
ON approval_quorum_history(queue_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_replay_rate_updated
ON replay_rate_limit_state(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_evidence_external_time
ON evidence_external_verification(created_at DESC);
