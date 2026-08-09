const test=require("node:test");
const assert=require("node:assert/strict");
const {
  claimRoles,
  identityFromValidatedClaims
}=require("../src/claims");

test("array roles are normalized",()=>{
  assert.deepEqual(
    claimRoles({
      payload:{
        roles:["ops","ops","viewer"]
      }
    }),
    ["ops","viewer"]
  );
});

test("space-separated roles are supported",()=>{
  assert.deepEqual(
    claimRoles({
      payload:{
        roles:"ops viewer"
      }
    }),
    ["ops","viewer"]
  );
});

test("identity is created from validated claims",()=>{
  const identity=identityFromValidatedClaims({
    payload:{
      sub:"u1",
      iss:"issuer",
      aud:"app"
    },
    roles:["ops"]
  });

  assert.equal(identity.authenticated,true);
  assert.equal(identity.subject,"u1");
});
