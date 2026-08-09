const test=require("node:test");
const assert=require("node:assert/strict");
const {
  acquireLease,
  leaseExpired
}=require("../src/worker-lease");

test("scheduled job receives lease",()=>{
  const result=acquireLease({
    job:{id:"job-1",status:"SCHEDULED",attempts:0},
    workerId:"worker-1",
    now:"2026-01-01T00:00:00Z",
    leaseSeconds:60
  });

  assert.equal(result.status,"ACTIVE");
});

test("expired lease is detected",()=>{
  assert.equal(
    leaseExpired({
      leasedUntil:"2025-12-31T23:00:00Z",
      now:"2026-01-01T00:00:00Z"
    }),
    true
  );
});
