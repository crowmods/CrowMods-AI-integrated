const test=require("node:test");
const assert=require("node:assert/strict");
const {
  launchReady,nextStage,rolloutDecision
}=require("../src/launch");

test("launch gate requires all evidence",()=>{
  const result=launchReady({
    ci:true,tests:true,security:true,artifact:true,
    staging:true,backup:true,canary:true,approval:true
  });
  assert.equal(result.ready,true);
});

test("missing approval blocks launch",()=>{
  const result=launchReady({
    ci:true,tests:true,security:true,artifact:true,
    staging:true,backup:true,canary:true
  });
  assert.equal(result.ready,false);
  assert.deepEqual(result.missing,["approval"]);
});

test("rollout advances from canary",()=>{
  assert.equal(nextStage("CANARY").trafficPercent,25);
});

test("bad production metrics stop promotion",()=>{
  const result=rolloutDecision({
    errorRate:0.05,
    latencyMs:300,
    healthPassRate:1
  });
  assert.equal(result.promote,false);
});
