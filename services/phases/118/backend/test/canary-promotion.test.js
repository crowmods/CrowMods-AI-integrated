const test=require("node:test");
const assert=require("node:assert/strict");
const {
  evaluatePromotion,
  promoteCanary
}=require("../src/canary-promotion");

test("all canary gates pass",()=>{
  const eligibility=evaluatePromotion({
    checks:{
      schemaValid:true,
      dependenciesHealthy:true,
      targetAvailable:true,
      rollbackReady:true,
      observabilityReady:true
    }
  });

  assert.equal(eligibility.status,"ELIGIBLE");

  assert.equal(
    promoteCanary({
      eligibility,
      authorizedBy:"security-release-manager"
    }).status,
    "PROMOTED"
  );
});

test("missing rollback readiness blocks",()=>{
  const result=evaluatePromotion({
    checks:{
      schemaValid:true,
      dependenciesHealthy:true,
      targetAvailable:true,
      rollbackReady:false,
      observabilityReady:true
    }
  });

  assert.equal(result.status,"BLOCKED");
});
