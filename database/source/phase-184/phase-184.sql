CREATE TABLE IF NOT EXISTS phase_184_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  state TEXT NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phase_184_audit_time
ON phase_184_audit(created_at DESC);
