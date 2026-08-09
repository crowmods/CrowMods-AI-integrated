CREATE TABLE IF NOT EXISTS event_schemas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type TEXT NOT NULL,
  schema_version INTEGER NOT NULL,
  schema JSONB NOT NULL,
  compatibility TEXT NOT NULL DEFAULT 'BACKWARD'
    CHECK(compatibility IN ('BACKWARD','FORWARD','FULL','NONE')),
  active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(event_type,schema_version)
);

CREATE TABLE IF NOT EXISTS event_delivery_attempts (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL,
  consumer_group TEXT NOT NULL,
  attempt INTEGER NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('SUCCESS','RETRY','DLQ')),
  error_message TEXT,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS event_dead_letters (
  id BIGSERIAL PRIMARY KEY,
  event_id UUID NOT NULL,
  event_type TEXT NOT NULL,
  consumer_group TEXT NOT NULL,
  payload JSONB NOT NULL,
  reason TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'PENDING'
    CHECK(status IN ('PENDING','REPLAYED','DISCARDED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  replayed_at TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS event_replays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL,
  consumer_group TEXT NOT NULL,
  requested_by TEXT NOT NULL,
  reason TEXT,
  status TEXT NOT NULL DEFAULT 'REQUESTED'
    CHECK(status IN ('REQUESTED','RUNNING','SUCCEEDED','FAILED','CANCELLED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_event_attempts_event
ON event_delivery_attempts(event_id,consumer_group);

CREATE INDEX IF NOT EXISTS idx_dead_letters_status
ON event_dead_letters(status,created_at);

CREATE INDEX IF NOT EXISTS idx_replays_status
ON event_replays(status,created_at);
