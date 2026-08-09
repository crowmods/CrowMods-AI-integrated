const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateProductionIntegrations
}=require("../src/integration-validation");

test("complete integration config passes",()=>{
  const result=validateProductionIntegrations({
    KMS_PROVIDER:"approved-kms",
    KMS_KEY_ID:"key-1",
    KMS_ALGORITHM:"RSA-PSS-SHA256",
    SIEM_ENDPOINT:"https://siem.example",
    SIEM_AUTH_MODE:"oauth2",
    SIEM_AUDIENCE:"siem-api"
  });

  assert.equal(
    result.every(item=>item.status==="PASS"),
    true
  );
});
