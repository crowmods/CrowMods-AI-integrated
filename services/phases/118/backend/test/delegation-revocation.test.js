const test=require("node:test");
const assert=require("node:assert/strict");
const {
  determineRevocation
}=require("../src/delegation-revocation");

test("expired delegation is revoked",()=>{
  assert.equal(
    determineRevocation({
      status:"ACTIVE",
      endsAt:"2025-01-01T00:00:00Z",
      now:"2026-01-01T00:00:00Z"
    }).action,
    "EXECUTE"
  );
});

test("active delegation remains scheduled",()=>{
  assert.equal(
    determineRevocation({
      status:"ACTIVE",
      endsAt:"2027-01-01T00:00:00Z",
      now:"2026-01-01T00:00:00Z"
    }).action,
    "SCHEDULED"
  );
});
