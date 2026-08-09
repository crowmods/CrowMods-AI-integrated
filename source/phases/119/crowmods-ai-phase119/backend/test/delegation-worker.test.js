const test=require("node:test");
const assert=require("node:assert/strict");
const {
  processDelegations
}=require("../src/delegation-worker");

test("worker identifies expired delegations",()=>{
  const result=processDelegations({
    delegations:[
      {
        status:"ACTIVE",
        endsAt:"2025-01-01T00:00:00Z"
      },
      {
        status:"ACTIVE",
        endsAt:"2027-01-01T00:00:00Z"
      }
    ],
    now:"2026-01-01T00:00:00Z"
  });

  assert.equal(result.revoked,1);
  assert.equal(result.skipped,1);
});
