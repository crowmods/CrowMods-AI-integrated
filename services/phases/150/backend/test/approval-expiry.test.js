const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateApproval,revokeApproval}=require("../src/approval-expiry");

test("expired approval is detected",()=>{
 const r=evaluateApproval({
  decision:"APPROVE",
  expiresAt:"2025-01-01T00:00:00Z",
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.state,"EXPIRED");
});

test("approval can be revoked",()=>{
 const r=revokeApproval({
  approvalId:"a1",
  actorId:"operator",
  reason:"policy change"
 });
 assert.equal(r.status,"REVOKED");
});
