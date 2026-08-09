CREATE TABLE IF NOT EXISTS signed_evidence (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evidence_id UUID NOT NULL UNIQUE,
  incident_id UUID NOT NULL,
  canonical_payload TEXT NOT NULL,
  payload_sha256 TEXT NOT NULL,
  signer TEXT NOT NULL,
  signature_version TEXT NOT NULL DEFAULT 'sha256-digest-v1',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS immutable_audit_chain (
  sequence_id BIGSERIAL PRIMARY KEY,
  incident_id UUID,
  event_type TEXT NOT NULL,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  previous_hash TEXT,
  event_hash TEXT NOT NULL,
  actor TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_signed_evidence_incident
ON signed_evidence(incident_id,created_at DESC);

CREATE INDEX IF NOT EXISTS idx_audit_chain_incident
ON immutable_audit_chain(incident_id,sequence_id);
