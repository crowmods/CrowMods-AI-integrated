# CrowMods AI — Phase 70: Rebalancer, DLQ Executor & Lag Alerting

Adds recovery and operational controls around the partitioned event platform.

Included:
- stale-worker detection
- partition rebalance planning
- safe lease takeover
- DLQ execution queue
- controlled replay executor contract
- lag alert generation
- broker/consumer observability APIs
- recovery state tracking
- tests

The rebalancer produces assignments according to explicit ownership rules.
It does not execute arbitrary production remediation.
