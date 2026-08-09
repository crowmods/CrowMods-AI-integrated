const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateDelegation,
  canDelegateApproval
}=require("../src/approval-delegation");

test("valid delegation passes",()=>{
  assert.equal(
    validateDelegation({
      delegator:"manager",
      delegate:"backup-manager",
      approvalLevel:1,
      startsAt:"2026-01-01T00:00:00Z",
      endsAt:"2026-02-01T00:00:00Z"
    }).status,
    "VALID"
  );
});

test("self delegation is blocked",()=>{
  assert.equal(
    validateDelegation({
      delegator:"manager",
      delegate:"manager",
      approvalLevel:1,
      startsAt:"2026-01-01T00:00:00Z",
      endsAt:"2026-02-01T00:00:00Z"
    }).status,
    "BLOCKED"
  );
});
