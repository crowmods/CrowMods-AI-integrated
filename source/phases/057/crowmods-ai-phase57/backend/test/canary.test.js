const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateCanary}=require("../src/canary");

test("healthy canary is promoted",()=>{
  const result=evaluateCanary({
    errorRate:0.005,
    latencyMs:300,
    healthPassRate:0.999
  });

  assert.equal(result.promote,true);
  assert.equal(result.action,"PROMOTE");
});

test("unhealthy canary is rolled back",()=>{
  const result=evaluateCanary({
    errorRate:0.08,
    latencyMs:300,
    healthPassRate:0.999
  });

  assert.equal(result.promote,false);
  assert.equal(result.action,"ROLLBACK");
});
