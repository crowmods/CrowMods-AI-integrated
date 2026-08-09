const test=require("node:test");
const assert=require("node:assert/strict");
const {
  evaluateDelegation
}=require("../src/delegation-lifecycle");

test("active delegation is detected",()=>{
  assert.equal(
    evaluateDelegation({
      status:"ACTIVE",
      startsAt:"2026-01-01T00:00:00Z",
      endsAt:"2026-02-01T00:00:00Z",
      now:"2026-01-15T00:00:00Z"
    }).status,
    "ACTIVE"
  );
});

test("expired delegation is detected",()=>{
  assert.equal(
    evaluateDelegation({
      status:"ACTIVE",
      startsAt:"2025-01-01T00:00:00Z",
      endsAt:"2025-02-01T00:00:00Z",
      now:"2026-01-15T00:00:00Z"
    }).status,
    "EXPIRED"
  );
});
