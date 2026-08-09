# Deployment Adapter Contract

Implement one adapter for the chosen production platform.

Required operations:

- validate(release)
- deployStaging(release)
- startCanary(release, trafficPercent)
- shiftTraffic(release, trafficPercent)
- rollback(release)
- getHealth(release)

The adapter should consume immutable image digests.

The release controller should never receive raw cloud credentials from an AI
model or browser. Credentials belong in the deployment platform's secret
store/service account.
