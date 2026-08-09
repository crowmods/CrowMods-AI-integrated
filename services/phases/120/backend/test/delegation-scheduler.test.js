const test=require("node:test");
const assert=require("node:assert/strict");
const {
  scheduleDelegation,
  claimJob
}=require("../src/delegation-scheduler");

test("due delegation job can be claimed",()=>{
  const job=scheduleDelegation({
    delegationId:"d1",
    scheduledFor:"2026-01-01T00:00:00Z",
    runKey:"run-1"
  });

  const result=claimJob({
    job:{
      ...job,
      status:"SCHEDULED"
    },
    workerId:"worker-1",
    now:"2026-01-01T01:00:00Z"
  });

  assert.equal(result.status,"CLAIMED");
});
