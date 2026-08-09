const test=require("node:test");
const assert=require("node:assert/strict");
const {
  sampleHealthy,
  confidenceScore,
  recoveryState
}=require("../src/recovery");

test("healthy sample requires improved signals",()=>{
  assert.equal(sampleHealthy({
    workers:4,
    expectedWorkers:4,
    lag:100,
    previousLag:200,
    errorRate:.01
  }),true);
});

test("confidence increases with healthy samples",()=>{
  const score=confidenceScore({
    healthySamples:5,
    unhealthySamples:0,
    minimumSamples:5
  });

  assert.equal(score,1);
});

test("recovery becomes eligible after sufficient evidence",()=>{
  const result=recoveryState({
    healthySamples:4,
    unhealthySamples:0,
    confidence:.9
  });

  assert.equal(result.state,"RECOVERED");
  assert.equal(result.closureEligible,true);
});

test("repeated unhealthy samples recommend rollback",()=>{
  const result=recoveryState({
    healthySamples:1,
    unhealthySamples:2,
    confidence:.2
  });

  assert.equal(result.state,"ROLLBACK_RECOMMENDED");
});
