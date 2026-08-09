CREATE TABLE IF NOT EXISTS phase_278_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phase_278_audit_time
ON phase_278_audit(created_at DESC);
