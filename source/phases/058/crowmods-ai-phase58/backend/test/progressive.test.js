const test=require("node:test");
const assert=require("node:assert/strict");
const {STAGES,evaluateStage,nextStage}=require("../src/progressive");

test("progressive stages are ordered",()=>{
  assert.deepEqual(STAGES.map(x=>x.trafficPercent),[5,25,50,100]);
});

test("healthy stage can promote",()=>{
  const result=evaluateStage({
    errorRate:0.001,
    latencyMs:200,
    healthPassRate:1
  });
  assert.equal(result.promote,true);
});

test("unhealthy stage stops promotion",()=>{
  const result=evaluateStage({
    errorRate:0.10,
    latencyMs:200,
    healthPassRate:1
  });
  assert.equal(result.promote,false);
});

test("next stage advances correctly",()=>{
  assert.equal(nextStage("CANARY").name,"EARLY");
  assert.equal(nextStage("MAJORITY").name,"FULL");
  assert.equal(nextStage("FULL"),null);
});
