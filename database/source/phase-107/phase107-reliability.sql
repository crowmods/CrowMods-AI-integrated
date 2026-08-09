CREATE TABLE IF NOT EXISTS burn_rate_windows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_id UUID REFERENCES security_slos(id) ON DELETE CASCADE,
  window_minutes INTEGER NOT NULL,
  observed_success_percent NUMERIC(7,3) NOT NULL,
  burn_rate NUMERIC(10,3) NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('INFO','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL
    CHECK(status IN ('NORMAL','ALERT')),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS budget_policy_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_id UUID REFERENCES security_slos(id) ON DELETE SET NULL,
  policy TEXT NOT NULL,
  decision TEXT NOT NULL
    CHECK(decision IN ('CONTINUE','WARN','FREEZE_CHANGE','ESCALATE')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_failover_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL,
  primary_provider TEXT NOT NULL,
  fallback_provider TEXT,
  state TEXT NOT NULL
    CHECK(state IN ('PRIMARY_HEALTHY','DEGRADED','FAIL_CLOSED','RECOVERING')),
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reliability_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  report_window_hours INTEGER NOT NULL,
  total_checks INTEGER NOT NULL,
  successful_checks INTEGER NOT NULL,
  failed_checks INTEGER NOT NULL,
  availability_percent NUMERIC(7,3),
  burn_alerts INTEGER NOT NULL DEFAULT 0,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_burn_rate_windows_time
ON burn_rate_windows(measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_budget_policy_time
ON budget_policy_actions(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_failover_events_time
ON provider_failover_events(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reliability_reports_time
ON reliability_reports(generated_at DESC);
