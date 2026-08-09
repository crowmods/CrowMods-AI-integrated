const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateApproval}=require("../src/redrive-policy");

test("approval is granted after threshold",()=>{
 const r=evaluateApproval({
  policyEnabled:true,
  approvals:2,
  requiredApprovals:2,
  priorRedrives:0,
  maxRedrives:2,
  actorId:"operator",
  reason:"approved retry"
 });
 assert.equal(r.status,"APPROVED");
});

test("approval remains pending below threshold",()=>{
 const r=evaluateApproval({
  policyEnabled:true,
  approvals:1,
  requiredApprovals:2,
  actorId:"operator",
  reason:"retry"
 });
 assert.equal(r.status,"PENDING");
});
