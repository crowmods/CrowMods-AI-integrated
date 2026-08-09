const test=require("node:test");
const assert=require("node:assert/strict");
const {
  WorkloadIdentityProvider
}=require("../src/workload-provider");

test("configured provider passes",()=>{
  const provider=new WorkloadIdentityProvider({
    name:"approved-idp",
    issuer:"https://issuer.example",
    audience:"siem-api"
  });

  assert.equal(
    provider.configurationStatus().status,
    "PASS"
  );
});

test("empty provider is blocked",()=>{
  const provider=new WorkloadIdentityProvider();

  assert.equal(
    provider.configurationStatus().status,
    "BLOCKED"
  );
});
