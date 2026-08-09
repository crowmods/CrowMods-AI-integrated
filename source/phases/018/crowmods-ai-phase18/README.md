# CrowMods AI — Phase 18: Crow AI Orchestrator

Adds the central orchestration layer.

Responsibilities:
- inspect release state
- decide which safe workflow jobs are needed
- enqueue jobs
- expose workflow status
- provide deterministic fallback decisions
- record orchestration events

The orchestrator is intentionally policy-driven. It does not autonomously
publish content, change security settings, make financial decisions, or
execute APKs. High-impact actions remain approval-gated.
