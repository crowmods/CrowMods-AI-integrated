CREATE TABLE IF NOT EXISTS worker_failover_events (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 worker_key TEXT NOT NULL,
 old_worker_id TEXT,
 new_worker_id TEXT NOT NULL,
 expected_version BIGINT NOT NULL,
 committed_version BIGINT,
 result TEXT NOT NULL CHECK(result IN ('FAILED_OVER','CONFLICT','REJECTED')),
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retry_latency_samples (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 run_key TEXT NOT NULL,
 attempt INTEGER NOT NULL,
 latency_ms INTEGER NOT NULL,
 outcome TEXT NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_hysteresis (
 model_key TEXT PRIMARY KEY,
 last_action TEXT NOT NULL CHECK(last_action IN ('EXPAND','SHRINK','HOLD','INSUFFICIENT_DATA')),
 stable_cycles INTEGER NOT NULL DEFAULT 0,
 last_lower_bound NUMERIC(8,5),
 last_upper_bound NUMERIC(8,5),
 window_size INTEGER NOT NULL,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS alert_review_exports (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 reviewer TEXT NOT NULL,
 export_hash TEXT NOT NULL,
 event_count INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_retry_latency_time ON retry_latency_samples(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_failover_events_time ON worker_failover_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_calibration_hysteresis_time ON calibration_hysteresis(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_exports_time ON alert_review_exports(created_at DESC);
