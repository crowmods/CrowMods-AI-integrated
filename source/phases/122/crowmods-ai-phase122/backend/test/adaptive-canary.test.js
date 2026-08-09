const test=require("node:test");
const assert=require("node:assert/strict");
const {adaptiveCanary}=require("../src/adaptive-canary");

test("healthy canary advances adaptively",()=>{
  const r=adaptiveCanary({
    currentTraffic:10,errorRate:1,latencyRegression:2
  });
  assert.equal(r.decision,"ADVANCE");
  assert.equal(r.nextTraffic>10,true);
});

test("bad health rolls back",()=>{
  const r=adaptiveCanary({
    currentTraffic:25,errorRate:9,latencyRegression:1
  });
  assert.equal(r.decision,"ROLLBACK");
  assert.equal(r.nextTraffic,0);
});
