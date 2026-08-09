CREATE TABLE IF NOT EXISTS incident_recovery_links (
  incident_id UUID PRIMARY KEY,
  scaling_action_id UUID,
  consumer_group TEXT NOT NULL,
  linked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_state_history (
  id BIGSERIAL PRIMARY KEY,
  incident_id UUID NOT NULL,
  previous_state TEXT,
  new_state TEXT NOT NULL,
  reason TEXT NOT NULL,
  changed_by TEXT NOT NULL DEFAULT 'system',
  changed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS slo_recovery_checks (
  id BIGSERIAL PRIMARY KEY,
  incident_id UUID NOT NULL,
  slo_name TEXT NOT NULL,
  target_value DOUBLE PRECISION NOT NULL,
  observed_value DOUBLE PRECISION NOT NULL,
  healthy BOOLEAN NOT NULL,
  observed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS incident_closure_gates (
  incident_id UUID PRIMARY KEY,
  recovery_verified BOOLEAN NOT NULL DEFAULT FALSE,
  slo_verified BOOLEAN NOT NULL DEFAULT FALSE,
  timeline_complete BOOLEAN NOT NULL DEFAULT FALSE,
  postmortem_evidence_complete BOOLEAN NOT NULL DEFAULT FALSE,
  closure_eligible BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_incident_state_history_incident
ON incident_state_history(incident_id,changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_slo_recovery_incident
ON slo_recovery_checks(incident_id,observed_at DESC);
