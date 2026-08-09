CREATE TABLE IF NOT EXISTS repair_backoff_schedule (
  queue_id UUID PRIMARY KEY,
  next_attempt_at TIMESTAMPTZ NOT NULL,
  attempt INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 3,
  state TEXT NOT NULL CHECK(state IN ('SCHEDULED','READY','DEAD_LETTER')),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS repair_dead_letter_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  queue_id UUID NOT NULL,
  final_attempt INTEGER NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slo_multiwindow_burn_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_class TEXT NOT NULL,
  window_minutes INTEGER NOT NULL,
  compliance_ratio NUMERIC(8,5) NOT NULL,
  burn_rate NUMERIC(12,5) NOT NULL,
  state TEXT NOT NULL CHECK(state IN ('NORMAL','BREACH')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS lease_conflict_rate_samples (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  model_key TEXT NOT NULL,
  window_minutes INTEGER NOT NULL,
  conflict_count INTEGER NOT NULL DEFAULT 0,
  request_count INTEGER NOT NULL DEFAULT 0,
  conflict_rate NUMERIC(12,6) NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS quarantine_immutable_closures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quarantine_id UUID NOT NULL UNIQUE,
  closure_state TEXT NOT NULL CHECK(closure_state IN ('RELEASED','REJECTED','RESOLVED')),
  actor_id TEXT NOT NULL,
  evidence_hash TEXT NOT NULL,
  closed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_repair_backoff_ready
ON repair_backoff_schedule(state,next_attempt_at);

CREATE INDEX IF NOT EXISTS idx_dead_letter_time
ON repair_dead_letter_queue(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_multiwindow_burn_time
ON slo_multiwindow_burn_rates(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_lease_conflict_rate_time
ON lease_conflict_rate_samples(created_at DESC);
