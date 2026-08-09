const test=require("node:test");
const assert=require("node:assert/strict");
const {
  decideCanaryRollout
}=require("../src/canary-rollback");

test("healthy canary promotes",()=>{
  const result=decideCanaryRollout({
    checks:{
      schemaValid:true,
      dependenciesHealthy:true,
      targetAvailable:true,
      rollbackReady:true,
      observabilityReady:true
    },
    errorRate:1,
    latencyRegression:5
  });

  assert.equal(result.decision,"PROMOTE");
});

test("high error rate rolls back",()=>{
  const result=decideCanaryRollout({
    checks:{
      schemaValid:true,
      dependenciesHealthy:true,
      targetAvailable:true,
      rollbackReady:true,
      observabilityReady:true
    },
    errorRate:10
  });

  assert.equal(result.decision,"ROLLBACK");
});
