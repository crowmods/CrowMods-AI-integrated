CREATE TABLE IF NOT EXISTS purge_eligibility_rules (
  policy_key TEXT PRIMARY KEY,
  table_name TEXT NOT NULL,
  date_column TEXT NOT NULL,
  retention_days INTEGER NOT NULL CHECK(retention_days > 0),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS baseline_alert_cooldowns (
  alert_key TEXT PRIMARY KEY,
  last_severity TEXT NOT NULL,
  last_triggered_at TIMESTAMPTZ NOT NULL,
  cooldown_until TIMESTAMPTZ NOT NULL,
  trigger_count INTEGER NOT NULL DEFAULT 1,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS manifest_reverification_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  requested_by TEXT NOT NULL,
  batch_size INTEGER NOT NULL,
  examined_count INTEGER NOT NULL DEFAULT 0,
  verified_count INTEGER NOT NULL DEFAULT 0,
  mismatch_count INTEGER NOT NULL DEFAULT 0,
  result TEXT NOT NULL CHECK(result IN ('COMPLETED','PARTIAL','FAILED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_purge_rules_enabled
ON purge_eligibility_rules(enabled,updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_alert_cooldown_until
ON baseline_alert_cooldowns(cooldown_until);

CREATE INDEX IF NOT EXISTS idx_manifest_batches_time
ON manifest_reverification_batches(created_at DESC);

CREATE OR REPLACE FUNCTION purge_row_is_eligible(
  p_created_at TIMESTAMPTZ,
  p_retention_days INTEGER
)
RETURNS BOOLEAN
LANGUAGE sql
IMMUTABLE AS $$
  SELECT p_created_at < NOW() - (p_retention_days || ' days')::INTERVAL
$$;
