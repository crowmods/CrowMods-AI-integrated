CREATE TABLE IF NOT EXISTS quorum_revocation_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL,
  approval_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  propagated BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quorum_decision_state (
  queue_id UUID PRIMARY KEY,
  required_approvals INTEGER NOT NULL DEFAULT 2,
  active_approvals INTEGER NOT NULL DEFAULT 0,
  state TEXT NOT NULL CHECK(state IN ('APPROVED','PENDING','REVOKED')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_quorum_revocation_queue
ON quorum_revocation_events(queue_id,created_at DESC);
