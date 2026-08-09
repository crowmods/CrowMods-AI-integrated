CREATE TABLE IF NOT EXISTS regions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  region_name TEXT NOT NULL UNIQUE,
  role TEXT NOT NULL DEFAULT 'SECONDARY'
    CHECK(role IN ('PRIMARY','SECONDARY','RECOVERY')),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS replication_samples (
  id BIGSERIAL PRIMARY KEY,
  source_region TEXT NOT NULL,
  target_region TEXT NOT NULL,
  replication_lag_seconds DOUBLE PRECISION NOT NULL,
  healthy BOOLEAN NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS region_health_samples (
  id BIGSERIAL PRIMARY KEY,
  region_name TEXT NOT NULL,
  health_score DOUBLE PRECISION NOT NULL,
  healthy BOOLEAN NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS traffic_failover_simulations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source_region TEXT NOT NULL,
  target_region TEXT NOT NULL,
  simulated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL DEFAULT 'PLANNED'
    CHECK(status IN ('PLANNED','SIMULATED','FAILED','VALIDATED')),
  rto_seconds DOUBLE PRECISION,
  rpo_seconds DOUBLE PRECISION,
  notes TEXT NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS failback_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  simulation_id UUID NOT NULL REFERENCES traffic_failover_simulations(id) ON DELETE CASCADE,
  target_primary_region TEXT NOT NULL,
  prerequisites JSONB NOT NULL DEFAULT '[]'::jsonb,
  ready BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_replication_samples_pair_time
ON replication_samples(source_region,target_region,observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_region_health_time
ON region_health_samples(region_name,observed_at DESC);
