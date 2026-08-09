const test=require("node:test");
const assert=require("node:assert/strict");
const {
  breakerState,
  recordBreakerResult
}=require("../src/retry-circuit");

test("failure threshold opens breaker",()=>{
  const r=recordBreakerResult({
    state:"CLOSED",
    failureCount:2,
    successCount:0,
    success:false
  });
  assert.equal(r.state,"OPEN");
});

test("half-open successes close breaker",()=>{
  const r=recordBreakerResult({
    state:"HALF_OPEN",
    failureCount:0,
    successCount:1,
    success:true,
    recoverySuccesses:2
  });
  assert.equal(r.state,"CLOSED");
});

test("open breaker transitions to half-open after timeout",()=>{
  const r=breakerState({
    state:"OPEN",
    openedAt:"2026-01-01T00:00:00Z",
    now:"2026-01-01T00:01:00Z",
    resetTimeoutMs:30000
  });
  assert.equal(r.state,"HALF_OPEN");
});
