#!/usr/bin/env sh
set -eu

ERROR_RATE="${ERROR_RATE:-0}"
LATENCY_MS="${LATENCY_MS:-0}"
HEALTH_PASS_RATE="${HEALTH_PASS_RATE:-1}"

node - <<'NODE'
const errorRate=Number(process.env.ERROR_RATE);
const latency=Number(process.env.LATENCY_MS);
const health=Number(process.env.HEALTH_PASS_RATE);

const promote =
  errorRate <= 0.02 &&
  latency <= 1000 &&
  health >= 0.99;

console.log(JSON.stringify({
  observed:{errorRate,latencyMs:latency,healthPassRate:health},
  thresholds:{maxErrorRate:0.02,maxLatencyMs:1000,minHealthPassRate:0.99},
  decision:promote?"PROMOTE":"ROLLBACK"
},null,2));

process.exit(promote?0:1);
NODE
