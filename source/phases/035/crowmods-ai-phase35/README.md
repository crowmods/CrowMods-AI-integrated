# CrowMods AI — Phase 35: AI Operations Orchestrator

Adds an event-driven orchestration foundation that connects the platform
modules without giving AI unrestricted authority.

Flow:
upload -> quarantine -> scan -> AI metadata -> approval -> publish ->
campaign -> platform queues -> analytics -> revenue/insights.

Important:
- high-impact actions remain approval-gated;
- workers are idempotent;
- events have audit records;
- retries use bounded attempts;
- dead-letter state is supported;
- secrets remain outside application code.

This is an orchestration reference, not a replacement for a production
message broker/workflow platform.
