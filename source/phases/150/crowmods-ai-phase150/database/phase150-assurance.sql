CREATE TABLE IF NOT EXISTS approval_revocation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL,
  approval_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK(action IN ('REVOKE','EXPIRE')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replay_sliding_windows (
  idempotency_key TEXT PRIMARY KEY,
  window_start TIMESTAMPTZ NOT NULL,
  window_seconds INTEGER NOT NULL DEFAULT 60,
  request_count INTEGER NOT NULL DEFAULT 0,
  limit_count INTEGER NOT NULL DEFAULT 5,
  state TEXT NOT NULL CHECK(state IN ('ALLOW','THROTTLED','ESCALATED')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS hysteresis_policy_rollouts (
  policy_key TEXT NOT NULL,
  version INTEGER NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('DRAFT','ACTIVE','ROLLED_BACK')),
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(policy_key,version)
);

CREATE TABLE IF NOT EXISTS baseline_confidence_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  sample_count INTEGER NOT NULL,
  mean_rate NUMERIC(12,6) NOT NULL,
  variance NUMERIC(16,10) NOT NULL DEFAULT 0,
  lower_bound NUMERIC(12,6) NOT NULL,
  upper_bound NUMERIC(12,6) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS evidence_attestations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarantine_id UUID NOT NULL,
  evidence_hash TEXT NOT NULL,
  attestation_algorithm TEXT NOT NULL,
  attestation TEXT NOT NULL,
  signer_reference TEXT NOT NULL,
  verification_state TEXT NOT NULL CHECK(
    verification_state IN ('PENDING','VERIFIED','REJECTED')
  ),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_revocation_time
ON approval_revocation_history(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_replay_sliding_updated
ON replay_sliding_windows(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_policy_rollout_state
ON hysteresis_policy_rollouts(policy_key,state);

CREATE INDEX IF NOT EXISTS idx_confidence_model
ON baseline_confidence_samples(model_key,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_attestation_quarantine
ON evidence_attestations(quarantine_id,created_at DESC);
