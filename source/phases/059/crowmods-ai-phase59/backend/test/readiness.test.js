const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateReadiness}=require("../src/readiness");

test("complete evidence passes readiness",()=>{
  const evidence={
    ci:true,
    unitTests:true,
    integrationTests:true,
    securityChecks:true,
    artifactVerified:true,
    stagingSmoke:true,
    databaseBackupVerified:true,
    canaryVerified:true
  };

  const result=evaluateReadiness(evidence);
  assert.equal(result.ready,true);
  assert.deepEqual(result.missing,[]);
});

test("missing evidence blocks readiness",()=>{
  const result=evaluateReadiness({
    ci:true,
    unitTests:true
  });

  assert.equal(result.ready,false);
  assert.ok(result.missing.includes("integrationTests"));
});
