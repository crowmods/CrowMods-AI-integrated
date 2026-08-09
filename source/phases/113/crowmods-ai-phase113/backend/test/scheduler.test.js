const test=require("node:test");
const assert=require("node:assert/strict");
const {
  createIdempotencyKey,
  claimJob,
  completeJob
}=require("../src/scheduler");

test("same schedule creates deterministic idempotency key",()=>{
  const a=createIdempotencyKey({
    controlId:"ctrl-1",
    scheduledFor:"2026-01-01T00:00:00Z"
  });
  const b=createIdempotencyKey({
    controlId:"ctrl-1",
    scheduledFor:"2026-01-01T00:00:00Z"
  });

  assert.equal(a,b);
});

test("scheduled job can be claimed",()=>{
  assert.equal(
    claimJob({
      status:"SCHEDULED",
      attempts:0
    }).status,
    "RUNNING"
  );
});

test("successful job completes",()=>{
  assert.equal(
    completeJob({success:true}).status,
    "SUCCEEDED"
  );
});
