const test=require("node:test");
const assert=require("node:assert/strict");
const {
  approvalState,
  canApprove
}=require("../src/dual-approval");

test("two independent approvals are required",()=>{
  const result=approvalState([
    {
      approver:"a",
      decision:"APPROVED"
    },
    {
      approver:"b",
      decision:"APPROVED"
    }
  ]);

  assert.equal(result.approved,true);
});

test("same requester cannot approve",()=>{
  assert.equal(
    canApprove({
      subject:"a",
      requester:"a",
      roles:["ops.rbac.approver"]
    }),
    false
  );
});

test("different approver with role can approve",()=>{
  assert.equal(
    canApprove({
      subject:"b",
      requester:"a",
      roles:["ops.rbac.approver"]
    }),
    true
  );
});
