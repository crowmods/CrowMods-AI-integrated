CREATE TABLE IF NOT EXISTS budget_forecasts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slo_id UUID REFERENCES security_slos(id) ON DELETE SET NULL,
  current_remaining_percent NUMERIC(7,3) NOT NULL,
  consumption_rate_percent_per_hour NUMERIC(10,4) NOT NULL,
  hours_to_exhaustion NUMERIC(12,3),
  forecast_status TEXT NOT NULL
    CHECK(forecast_status IN ('SAFE','AT_RISK','EXHAUSTION_FORECAST','BLOCKED')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reliability_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_key TEXT NOT NULL UNIQUE,
  severity TEXT NOT NULL
    CHECK(severity IN ('LOW','MEDIUM','HIGH','CRITICAL')),
  status TEXT NOT NULL
    CHECK(status IN ('OPEN','MITIGATING','RESOLVED')),
  started_at TIMESTAMPTZ NOT NULL,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS reliability_correlations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  incident_id UUID REFERENCES reliability_incidents(id) ON DELETE CASCADE,
  correlation_type TEXT NOT NULL
    CHECK(correlation_type IN ('CHANGE','PROVIDER','SLO','BURN_RATE')),
  reference_key TEXT NOT NULL,
  confidence NUMERIC(5,3) NOT NULL,
  reason TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS recovery_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_type TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  state TEXT NOT NULL
    CHECK(state IN (
      'DETECTED',
      'VALIDATING',
      'APPROVAL_REQUIRED',
      'RECOVERING',
      'VERIFYING',
      'RESTORED',
      'FAILED'
    )),
  requested_by TEXT,
  approved_by TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS change_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  change_key TEXT NOT NULL UNIQUE,
  service TEXT NOT NULL,
  started_at TIMESTAMPTZ NOT NULL,
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL
    CHECK(status IN ('PLANNED','IN_PROGRESS','COMPLETED','ROLLED_BACK')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_budget_forecasts_time
ON budget_forecasts(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reliability_incidents_time
ON reliability_incidents(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reliability_correlations_time
ON reliability_correlations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_recovery_workflows_time
ON recovery_workflows(updated_at DESC);
