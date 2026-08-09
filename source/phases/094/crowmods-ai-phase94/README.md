# CrowMods AI — Phase 94: Persistent RBAC Policies & Trusted JWT Claims

Adds persistent, policy-driven authorization on top of validated identity.

Included:
- verified JWT claim-to-role mapping
- persistent authorization policies
- policy evaluation engine
- deny-by-default behavior
- policy management APIs
- protected policy-aware routes
- authorization audit records
- end-to-end security regression tests
- administration dashboard

Production note:
Authorization decisions must use claims from a cryptographically validated
token or a trusted server-side identity context. Client-supplied role headers
are not used by the policy engine.
