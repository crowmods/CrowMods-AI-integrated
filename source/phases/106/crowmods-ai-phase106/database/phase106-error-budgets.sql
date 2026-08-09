CREATE TABLE IF NOT EXISTS security_error_budgets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_id UUID REFERENCES security_slos(id) ON DELETE CASCADE,
  window_hours INTEGER NOT NULL,
  target_percent NUMERIC(6,3) NOT NULL,
  allowed_failure_percent NUMERIC(7,3) NOT NULL,
  consumed_failure_percent NUMERIC(7,3) NOT NULL DEFAULT 0,
  remaining_budget_percent NUMERIC(7,3) NOT NULL DEFAULT 0,
  status TEXT NOT NULL
    CHECK(status IN ('HEALTHY','WARNING','EXHAUSTED','BLOCKED')),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS security_burn_rates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_id UUID REFERENCES security_slos(id) ON DELETE CASCADE,
  window_minutes INTEGER NOT NULL,
  burn_rate NUMERIC(10,3) NOT NULL,
  severity TEXT NOT NULL
    CHECK(severity IN ('INFO','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL
    CHECK(status IN ('NORMAL','ALERT')),
  measured_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS provider_health_checks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  status TEXT NOT NULL
    CHECK(status IN ('PASS','FAIL','BLOCKED')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  checked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_error_budgets_time
ON security_error_budgets(measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_burn_rates_time
ON security_burn_rates(measured_at DESC);

CREATE INDEX IF NOT EXISTS idx_provider_health_time
ON provider_health_checks(checked_at DESC);
