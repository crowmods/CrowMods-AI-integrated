CREATE TABLE IF NOT EXISTS escalation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  routed_incident_id UUID NOT NULL REFERENCES routed_incidents(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN ('QUEUED','LEASED','RUNNING','WAITING','SUCCEEDED','FAILED','CANCELLED')),
  run_after TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  lease_until TIMESTAMPTZ,
  worker_id TEXT,
  attempts INTEGER NOT NULL DEFAULT 0,
  max_attempts INTEGER NOT NULL DEFAULT 5,
  last_error TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS notification_deliveries (
  id BIGSERIAL PRIMARY KEY,
  routed_incident_id UUID NOT NULL REFERENCES routed_incidents(id) ON DELETE CASCADE,
  provider TEXT NOT NULL,
  destination TEXT,
  severity TEXT,
  status TEXT NOT NULL DEFAULT 'QUEUED'
    CHECK(status IN ('QUEUED','SENT','FAILED','RETRYING')),
  attempts INTEGER NOT NULL DEFAULT 0,
  provider_ref TEXT,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_escalation_jobs_queue
ON escalation_jobs(status,run_after,created_at);

CREATE INDEX IF NOT EXISTS idx_escalation_jobs_lease
ON escalation_jobs(lease_until);

CREATE INDEX IF NOT EXISTS idx_notification_incident
ON notification_deliveries(routed_incident_id,created_at DESC);
