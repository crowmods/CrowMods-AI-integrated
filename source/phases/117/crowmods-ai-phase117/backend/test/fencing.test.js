const test=require("node:test");
const assert=require("node:assert/strict");
const {
  issueFencingToken,
  validateFencingToken
}=require("../src/fencing");

test("fencing token is issued",()=>{
  const result=issueFencingToken({
    resourceKey:"job-1",
    ownerId:"worker-1",
    version:1,
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.status,"ISSUED");
  assert.equal(result.token.length,48);
});

test("stale fencing token is rejected",()=>{
  const result=validateFencingToken({
    presentedVersion:1,
    currentVersion:2,
    tokenStatus:"ACTIVE",
    expiresAt:"2027-01-01T00:00:00Z",
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.valid,false);
  assert.equal(result.reason,"stale_fencing_token");
});
