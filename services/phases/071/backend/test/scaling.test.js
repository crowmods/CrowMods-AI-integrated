const test=require("node:test");
const assert=require("node:assert/strict");
const {
  scalingRecommendation,
  recoveryHealthy
}=require("../src/scaling");

test("high lag recommends scale out",()=>{
  const r=scalingRecommendation({
    currentWorkers:2,
    lag:500,
    targetLag:100,
    minWorkers:1,
    maxWorkers:10
  });

  assert.equal(r.action,"SCALE_OUT");
  assert.equal(r.desiredWorkers,3);
});

test("low lag can scale in",()=>{
  const r=scalingRecommendation({
    currentWorkers:4,
    lag:10,
    targetLag:100,
    minWorkers:1,
    maxWorkers:10
  });

  assert.equal(r.action,"SCALE_IN");
  assert.equal(r.desiredWorkers,3);
});

test("recovery is healthy when lag improves",()=>{
  const r=recoveryHealthy({
    lagBefore:500,
    lagAfter:100,
    errorRate:.001
  });

  assert.equal(r.healthy,true);
});
