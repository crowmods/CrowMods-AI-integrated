CREATE TABLE IF NOT EXISTS launch_operations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  release_version TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'production',
  status TEXT NOT NULL DEFAULT 'PREPARING'
    CHECK(status IN ('PREPARING','CANARY','PROGRESSIVE','LIVE','MONITORING','ROLLED_BACK','CLOSED')),
  owner TEXT,
  incident_commander TEXT,
  launch_window_start TIMESTAMPTZ,
  launch_window_end TIMESTAMPTZ,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS launch_checklist_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  launch_id UUID NOT NULL REFERENCES launch_operations(id) ON DELETE CASCADE,
  item_key TEXT NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT TRUE,
  completed BOOLEAN NOT NULL DEFAULT FALSE,
  evidence_ref TEXT,
  completed_by TEXT,
  completed_at TIMESTAMPTZ,
  UNIQUE(launch_id,item_key)
);

CREATE TABLE IF NOT EXISTS slo_observations (
  id BIGSERIAL PRIMARY KEY,
  launch_id UUID NOT NULL REFERENCES launch_operations(id) ON DELETE CASCADE,
  metric_name TEXT NOT NULL,
  value DOUBLE PRECISION NOT NULL,
  threshold DOUBLE PRECISION NOT NULL,
  passed BOOLEAN NOT NULL,
  window_minutes INTEGER NOT NULL DEFAULT 15,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_timeline (
  id BIGSERIAL PRIMARY KEY,
  launch_id UUID REFERENCES launch_operations(id) ON DELETE CASCADE,
  incident_id UUID REFERENCES incidents(id) ON DELETE SET NULL,
  event_type TEXT NOT NULL,
  message TEXT NOT NULL,
  actor TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_launch_ops_status
ON launch_operations(status,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_slo_launch_time
ON slo_observations(launch_id,observed_at DESC);

CREATE INDEX IF NOT EXISTS idx_incident_timeline_launch
ON incident_timeline(launch_id,created_at DESC);
