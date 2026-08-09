const test=require("node:test");
const assert=require("node:assert/strict");
const {
  createApprovalChain,
  applyDecision
}=require("../src/risk-approval");

test("multi-step approval advances",()=>{
  const chain=createApprovalChain({
    requiredLevel:2,
    approvers:["manager","executive"]
  });

  const next=applyDecision({
    chain,
    level:1,
    decision:"APPROVED"
  });

  assert.equal(next.currentLevel,2);
  assert.equal(next.status,"PENDING");
});

test("final approval completes chain",()=>{
  const chain=createApprovalChain({
    requiredLevel:1,
    approvers:["executive"]
  });

  const result=applyDecision({
    chain,
    level:1,
    decision:"APPROVED"
  });

  assert.equal(result.status,"APPROVED");
});
