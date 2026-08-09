CREATE TABLE IF NOT EXISTS timeline_ingestion_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES reliability_incidents(id) ON DELETE CASCADE,
  source TEXT NOT NULL,
  event_type TEXT NOT NULL,
  event_time TIMESTAMPTZ NOT NULL,
  source_event_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ingested_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS timeline_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES reliability_incidents(id) ON DELETE CASCADE,
  snapshot_version INTEGER NOT NULL,
  digest TEXT NOT NULL,
  signature TEXT NOT NULL,
  key_version TEXT NOT NULL,
  algorithm TEXT NOT NULL,
  event_count INTEGER NOT NULL,
  snapshot JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(incident_id,snapshot_version)
);

CREATE TABLE IF NOT EXISTS action_sla_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_id UUID REFERENCES post_incident_actions(id) ON DELETE CASCADE,
  due_at TIMESTAMPTZ NOT NULL,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL
    CHECK(status IN ('ON_TRACK','DUE_SOON','OVERDUE','BLOCKED')),
  severity TEXT NOT NULL
    CHECK(severity IN ('INFO','MEDIUM','HIGH','CRITICAL'))
);

CREATE TABLE IF NOT EXISTS postmortem_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_window_days INTEGER NOT NULL,
  incident_count INTEGER NOT NULL,
  open_action_count INTEGER NOT NULL,
  overdue_action_count INTEGER NOT NULL,
  critical_incident_count INTEGER NOT NULL,
  digest TEXT NOT NULL,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_timeline_ingestion_time
ON timeline_ingestion_events(ingested_at DESC);

CREATE INDEX IF NOT EXISTS idx_timeline_snapshots_time
ON timeline_snapshots(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_action_sla_time
ON action_sla_checks(checked_at DESC);

CREATE INDEX IF NOT EXISTS idx_postmortem_reports_time
ON postmortem_reports(generated_at DESC);
