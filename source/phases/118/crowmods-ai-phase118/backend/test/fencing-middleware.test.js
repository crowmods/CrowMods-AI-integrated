const test=require("node:test");
const assert=require("node:assert/strict");
const {
  enforceFencing
}=require("../src/fencing-middleware");

test("current fencing token is allowed",()=>{
  const result=enforceFencing({
    resourceKey:"resource-1",
    presentedVersion:4,
    currentVersion:4,
    tokenStatus:"ACTIVE",
    expiresAt:"2027-01-01T00:00:00Z",
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.allowed,true);
});

test("stale fencing token is blocked",()=>{
  const result=enforceFencing({
    resourceKey:"resource-1",
    presentedVersion:3,
    currentVersion:4,
    tokenStatus:"ACTIVE",
    expiresAt:"2027-01-01T00:00:00Z",
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.reason,"stale_fencing_token");
});
