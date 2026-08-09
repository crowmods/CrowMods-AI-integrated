# Phase 121 — Transactional Fencing, Multi-Stage Canary Traffic, Queue Claims, Forecast Calibration & Cloud KMS

## Transactional fencing

Fencing verification checks resource identity, token version, token activity,
and payload digest as one authorization decision.

Production deployments should perform the final check and state transition
inside a transaction at the protected resource boundary.

## Multi-stage canary traffic

Traffic can progress through configurable stages such as:
1%, 5%, 10%, 25%, 50%, 100%.

Health thresholds can stop progression and trigger rollback.

## Queue-backed delegation claims

Delegation jobs receive a lease token and expiry when claimed by a worker.
Workers should renew or complete the claim before lease expiry.

Production queue implementations should use atomic claim semantics.

## Advanced forecast calibration

Residual distributions are used to derive lower/upper quantile error bands.
Actual outcomes can then be measured against those bands to estimate empirical
coverage.

## Cloud KMS adapters

The provider-neutral interface exposes sign and verify operations for:
- AWS KMS;
- Azure Key Vault;
- Google Cloud KMS.

The adapters require an injected provider client. They do not contain
credentials or SDK secrets.

## Security boundary

KMS adapters never expose private keys. Fencing and queue claims fail closed
when required security metadata is absent.

## Next

Possible next work:
- transactional resource fencing with serializable state changes;
- adaptive canary stage sizing;
- lease renewal/heartbeat for queue claims;
- conformal calibration and drift monitoring;
- provider-specific SDK adapters behind isolated integration packages.
