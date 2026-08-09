CREATE TABLE IF NOT EXISTS broker_topics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic TEXT NOT NULL UNIQUE,
  partitions INTEGER NOT NULL CHECK(partitions > 0),
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS partition_assignments (
  topic TEXT NOT NULL,
  partition_id INTEGER NOT NULL,
  consumer_group TEXT NOT NULL,
  worker_id TEXT NOT NULL,
  lease_until TIMESTAMPTZ NOT NULL,
  assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(topic,partition_id,consumer_group)
);

CREATE TABLE IF NOT EXISTS partition_offsets (
  topic TEXT NOT NULL,
  partition_id INTEGER NOT NULL,
  consumer_group TEXT NOT NULL,
  offset_value BIGINT NOT NULL DEFAULT 0,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY(topic,partition_id,consumer_group)
);

CREATE TABLE IF NOT EXISTS worker_heartbeats (
  worker_id TEXT PRIMARY KEY,
  consumer_group TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'READY',
  active_partitions INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_partition_assignments_lease
ON partition_assignments(lease_until);

CREATE INDEX IF NOT EXISTS idx_worker_heartbeats_group
ON worker_heartbeats(consumer_group,last_seen_at DESC);
