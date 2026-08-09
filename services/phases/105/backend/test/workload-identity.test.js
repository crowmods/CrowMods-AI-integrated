const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateWorkloadIdentity
}=require("../src/workload-identity");

test("matching workload identity is accepted",()=>{
  const result=validateWorkloadIdentity({
    subject:"service-a",
    audience:"siem-api",
    expectedAudience:"siem-api",
    issuer:"https://issuer",
    expectedIssuer:"https://issuer"
  });

  assert.equal(result.status,"ACCEPTED");
});

test("audience mismatch is rejected",()=>{
  const result=validateWorkloadIdentity({
    subject:"service-a",
    audience:"other",
    expectedAudience:"siem-api"
  });

  assert.equal(result.status,"REJECTED");
});
