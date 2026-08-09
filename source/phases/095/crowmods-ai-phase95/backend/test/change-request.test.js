const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateChangeRequest,
  canApprove
}=require("../src/change-request");

test("valid change request is accepted",()=>{
  assert.equal(
    validateChangeRequest({
      requestedBy:"user-1",
      changeType:"UPDATE_POLICY",
      proposedChange:{
        enabled:false
      }
    }).valid,
    true
  );
});

test("approver cannot approve own request",()=>{
  assert.equal(
    canApprove({
      identity:{
        authenticated:true,
        subject:"user-1",
        roles:["ops.rbac.approver"]
      },
      requestedBy:"user-1"
    }),
    false
  );
});

test("different approver can approve",()=>{
  assert.equal(
    canApprove({
      identity:{
        authenticated:true,
        subject:"user-2",
        roles:["ops.rbac.approver"]
      },
      requestedBy:"user-1"
    }),
    true
  );
});
