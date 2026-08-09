const test=require("node:test");
const assert=require("node:assert/strict");
const {
  startRecovery,
  validationResult,
  verificationResult
}=require("../src/recovery-orchestrator");

test("critical recovery starts with validation",()=>{
  assert.equal(
    startRecovery({
      securityCritical:true
    }).next,
    "VALIDATING"
  );
});

test("healthy provider still requires approval",()=>{
  assert.equal(
    validationResult({
      healthy:true,
      approved:false,
      securityCritical:true
    }).state,
    "APPROVAL_REQUIRED"
  );
});

test("verified recovery restores sensitive operations",()=>{
  const result=verificationResult({
    healthy:true,
    securityChecksPassed:true
  });

  assert.equal(
    result.state,
    "RESTORED"
  );
  assert.equal(
    result.allowSensitiveOperations,
    true
  );
});
