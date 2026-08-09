CREATE TABLE IF NOT EXISTS worker_transaction_audit (
 id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 worker_key TEXT NOT NULL,
 operation TEXT NOT NULL CHECK(operation IN ('FAILOVER','RENEW')),
 expected_version BIGINT NOT NULL,
 committed_version BIGINT,
 result TEXT NOT NULL,
 event_id UUID,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retry_percentile_rollups (
 run_key TEXT PRIMARY KEY,
 sample_count INTEGER NOT NULL,
 p50_ms NUMERIC(12,3),
 p95_ms NUMERIC(12,3),
 p99_ms NUMERIC(12,3),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS calibration_deadbands (
 model_key TEXT PRIMARY KEY,
 expand_threshold NUMERIC(8,5) NOT NULL,
 shrink_threshold NUMERIC(8,5) NOT NULL,
 consecutive_expand INTEGER NOT NULL DEFAULT 0,
 consecutive_shrink INTEGER NOT NULL DEFAULT 0,
 last_action TEXT NOT NULL CHECK(last_action IN ('EXPAND','SHRINK','HOLD')),
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS export_manifests (
 export_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
 reviewer TEXT NOT NULL,
 payload_hash TEXT NOT NULL,
 manifest_hash TEXT NOT NULL,
 algorithm TEXT NOT NULL DEFAULT 'SHA-256',
 event_count INTEGER NOT NULL,
 created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS retention_policies (
 policy_key TEXT PRIMARY KEY,
 table_name TEXT NOT NULL,
 retention_days INTEGER NOT NULL CHECK(retention_days>0),
 enabled BOOLEAN NOT NULL DEFAULT TRUE,
 updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_worker_audit_time
ON worker_transaction_audit(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_retry_rollup_time
ON retry_percentile_rollups(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_deadband_time
ON calibration_deadbands(updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_export_manifest_time
ON export_manifests(created_at DESC);
