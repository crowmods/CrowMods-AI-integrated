const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validatePlan,
  requiresApproval,
  canExecute
}=require("../src/remediation-plan");

test("approved action must be allowlisted",()=>{
  assert.equal(
    validatePlan({
      controlKey:"jwks-health",
      action:"REFRESH_JWKS_CACHE",
      reason:"Restore stale JWKS cache",
      requestedBy:"ops-a"
    }).valid,
    true
  );
});

test("critical remediation requires approval",()=>{
  assert.equal(
    requiresApproval("CRITICAL"),
    true
  );
});

test("requester cannot self-approve",()=>{
  assert.equal(
    canExecute({
      status:"APPROVED",
      requestedBy:"ops-a",
      approvedBy:"ops-a",
      riskLevel:"CRITICAL"
    }),
    false
  );
});
