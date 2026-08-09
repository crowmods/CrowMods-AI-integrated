const test=require("node:test");
const assert=require("node:assert/strict");
const {
  integrationCertification,
  drValidation
}=require("../src/certification");

test("certification requires every integration gate",()=>{
  assert.equal(
    integrationCertification({
      kmsReady:true,
      wormReady:true,
      retentionReady:true,
      healthChecksPassed:true
    }).certified,
    true
  );
});

test("DR validation requires every gate",()=>{
  assert.equal(
    drValidation({
      backupVerified:true,
      restoreVerified:true,
      integrityVerified:true,
      providerReconnectVerified:true
    }).passed,
    true
  );
});
