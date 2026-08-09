const test=require("node:test");
const assert=require("node:assert/strict");
const {retryDelay,retryPlan}=require("../src/retry-backoff-telemetry");

test("retry delay is bounded",()=>{
  const r=retryDelay({
    attempt:20,
    maxMs:100,
    random:()=>1
  });
  assert.equal(r,100);
});

test("terminal attempt aborts",()=>{
  const r=retryPlan({
    attempt:3,
    maxAttempts:3,
    retryable:true
  });
  assert.equal(r.action,"ABORT");
});
