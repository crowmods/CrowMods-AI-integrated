const test=require("node:test");
const assert=require("node:assert/strict");
const {
  nextTrafficStage
}=require("../src/canary-traffic");

test("healthy canary advances traffic",()=>{
  const result=nextTrafficStage({
    currentPercent:5,
    health:{
      errorRate:1,
      latencyRegression:2,
      maxErrorRate:5,
      maxLatencyRegression:20
    }
  });

  assert.equal(result.status,"ADVANCE");
  assert.equal(result.trafficPercent,10);
});

test("unhealthy canary rolls back",()=>{
  const result=nextTrafficStage({
    currentPercent:10,
    health:{
      errorRate:9,
      latencyRegression:2,
      maxErrorRate:5,
      maxLatencyRegression:20
    }
  });

  assert.equal(result.status,"ROLLBACK");
});
