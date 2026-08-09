const test=require("node:test");
const assert=require("node:assert/strict");
const {failoverDecision}=require("../src/worker-failover");

test("expired lease fails over",()=>{
  const r=failoverDecision({
    activeWorkerId:"w1",
    leaseExpiresAt:"2026-01-01T00:00:00Z",
    now:"2026-01-01T00:02:00Z",
    candidateWorkerId:"w2",
    candidateLeaseToken:"t2",
    currentFencingVersion:4
  });
  assert.equal(r.status,"FAILED_OVER");
  assert.equal(r.fencingVersion,5);
});
