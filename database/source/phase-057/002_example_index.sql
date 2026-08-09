CREATE INDEX IF NOT EXISTS idx_ai_tasks_status_created
ON ai_tasks(status,created_at DESC);

INSERT INTO schema_migrations(version,checksum)
VALUES('002_example_index','phase57-example-index-v1')
ON CONFLICT(version) DO NOTHING;
