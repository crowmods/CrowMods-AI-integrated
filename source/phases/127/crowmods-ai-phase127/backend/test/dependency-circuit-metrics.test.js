const test=require("node:test");
const assert=require("node:assert/strict");
const {
  recordDependencyMetrics,
  dependencyHealth
}=require("../src/dependency-circuit-metrics");

test("dependency metrics calculate p95",()=>{
  const r=recordDependencyMetrics({
    requestCount:100,
    failureCount:5,
    timeoutCount:2,
    latencySamples:[10,20,30,40,100]
  });
  assert.equal(r.latencyP95Ms,100);
  assert.equal(r.failureRate,.05);
});

test("degraded dependency is detected",()=>{
  const r=dependencyHealth({
    failureRate:.2,
    timeoutRate:.01,
    latencyP95Ms:100
  });
  assert.equal(r.status,"DEGRADED");
});
