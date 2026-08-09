const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateSourcePolicy
}=require("../src/source-auth");

test("authenticated workload source is accepted",()=>{
  const result=validateSourcePolicy({
    sourceName:"siem",
    authMode:"WORKLOAD_IDENTITY",
    expectedAudience:"security-api",
    presentedAudience:"security-api",
    authenticated:true
  });

  assert.equal(result.status,"ACCEPTED");
});

test("unauthenticated source is rejected",()=>{
  const result=validateSourcePolicy({
    sourceName:"siem",
    authMode:"WORKLOAD_IDENTITY",
    authenticated:false
  });

  assert.equal(result.status,"REJECTED");
});
