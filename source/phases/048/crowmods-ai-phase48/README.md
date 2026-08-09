# CrowMods AI — Phase 48: Subscription & Customer Lifecycle

Adds subscription lifecycle and entitlement management.

Flow:
checkout -> subscription -> active entitlement
-> renewal / payment failure
-> grace period
-> cancellation / expiration
-> reactivation

Included:
- subscriptions
- lifecycle states
- entitlement checks
- provider event normalization
- invoice/receipt references
- grace periods
- customer lifecycle metrics
- admin lifecycle dashboard

Payment processing remains with an authorized provider. This service stores
provider references and normalized states, not card credentials.
