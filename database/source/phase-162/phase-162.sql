CREATE TABLE IF NOT EXISTS phase_162_crypto_audit (
  id BIGSERIAL PRIMARY KEY,
  key_id TEXT,
  algorithm TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  operation TEXT NOT NULL,
  result TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_phase_162_crypto_audit_time
ON phase_162_crypto_audit(created_at DESC);
