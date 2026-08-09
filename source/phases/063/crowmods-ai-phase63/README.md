# CrowMods AI — Phase 63: Alert Routing & On-Call Operations

Adds the incident-response routing layer.

Included:
- alert routing rules
- on-call schedules
- escalation policies
- incident acknowledgment
- escalation
- resolution
- incident timeline
- notification-provider abstraction
- deduplication keys
- operational dashboard API
- on-call dashboard UI
- smoke tests

Notification providers remain provider-neutral. Production integrations should
use an approved paging/chat/email provider and credentials from a secrets
manager.

The system does not silently perform high-impact remediation. It routes,
records and escalates incidents according to configured policy.
