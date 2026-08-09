const test=require("node:test");
const assert=require("node:assert/strict");
const {
  claimQueueJob,
  isLeaseValid
}=require("../src/queue-claim");

test("due queue job receives lease",()=>{
  const result=claimQueueJob({
    job:{
      status:"SCHEDULED",
      runKey:"run-1",
      scheduledFor:"2026-01-01T00:00:00Z"
    },
    workerId:"worker-1",
    now:"2026-01-01T01:00:00Z"
  });

  assert.equal(result.status,"CLAIMED");
  assert.equal(
    isLeaseValid({
      status:"CLAIMED",
      leaseExpiresAt:result.leaseExpiresAt,
      now:"2026-01-01T01:01:00Z"
    }),
    true
  );
});
