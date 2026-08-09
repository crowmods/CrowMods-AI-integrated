CREATE TABLE IF NOT EXISTS phase_298_audit (
  id BIGSERIAL PRIMARY KEY,
  actor_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  state TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phase_298_audit_time
ON phase_298_audit(created_at DESC);
