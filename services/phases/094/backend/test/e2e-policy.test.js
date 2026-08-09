const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluatePolicies}=require("../src/policy");
const {
  claimRoles,
  identityFromValidatedClaims
}=require("../src/claims");

test("validated JWT claims flow into policy authorization",()=>{
  const payload={
    sub:"operator-7",
    iss:"https://issuer.example",
    aud:"crowmods",
    roles:["ops.incident"]
  };

  const identity=identityFromValidatedClaims({
    payload,
    roles:claimRoles({payload})
  });

  const result=evaluatePolicies({
    identity,
    resource:"incident",
    action:"acknowledge",
    policies:[{
      policy_name:"incident-ack",
      resource:"incident",
      action:"acknowledge",
      requiredRoles:["ops.incident"],
      effect:"ALLOW",
      enabled:true,
      priority:50
    }]
  });

  assert.equal(identity.authenticated,true);
  assert.equal(result.allowed,true);
});
