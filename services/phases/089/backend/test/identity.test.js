const test=require("node:test");
const assert=require("node:assert/strict");
const {
  buildIdentity,
  isExpired,
  hasRole,
  requireAuthenticated
}=require("../src/identity");

test("identity contains unique roles",()=>{
  const identity=buildIdentity({
    subject:"operator-1",
    provider:"development-idp",
    roles:["ops","ops","viewer"]
  });

  assert.equal(identity.roles.length,2);
});

test("expired identity is rejected",()=>{
  const identity=buildIdentity({
    subject:"operator-1",
    provider:"development-idp",
    expiresAt:"2026-08-01T00:00:00Z"
  });

  assert.equal(
    isExpired(identity,new Date("2026-08-09T00:00:00Z")),
    true
  );
});

test("role can be checked",()=>{
  const identity=buildIdentity({
    subject:"operator-1",
    provider:"development-idp",
    roles:["ops"]
  });

  assert.equal(hasRole(identity,"ops"),true);
});

test("valid identity is authenticated",()=>{
  const identity=buildIdentity({
    subject:"operator-1",
    provider:"development-idp"
  });

  assert.equal(requireAuthenticated(identity),true);
});
