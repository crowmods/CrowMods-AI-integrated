const test=require("node:test");
const assert=require("node:assert/strict");
const {
  claimRoles,
  identityFromValidatedClaims
}=require("../src/claims");

test("roles come from validated claims",()=>{
  assert.deepEqual(
    claimRoles({
      payload:{
        roles:["ops.admin","ops.admin","viewer"]
      }
    }),
    ["ops.admin","viewer"]
  );
});

test("identity preserves validated issuer and subject",()=>{
  const identity=identityFromValidatedClaims({
    payload:{
      sub:"operator-1",
      iss:"https://issuer.example",
      aud:"crowmods"
    },
    roles:["ops.viewer"]
  });

  assert.equal(identity.subject,"operator-1");
  assert.equal(identity.issuer,"https://issuer.example");
  assert.equal(identity.authenticated,true);
});
