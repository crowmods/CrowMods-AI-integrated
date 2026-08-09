const test=require("node:test");
const assert=require("node:assert/strict");
const {
  createLockToken,
  lockExpiry,
  canAcquireLock
}=require("../src/distributed-lock");

test("lock token is generated",()=>{
  assert.equal(
    createLockToken().length,
    48
  );
});

test("expired lock can be acquired",()=>{
  assert.equal(
    canAcquireLock({
      existing:{
        status:"HELD",
        expiresAt:"2025-01-01T00:00:00Z"
      },
      now:"2026-01-01T00:00:00Z"
    }),
    true
  );
});

test("lock expiry is calculated",()=>{
  assert.equal(
    lockExpiry({
      now:"2026-01-01T00:00:00Z",
      leaseSeconds:60
    }),
    "2026-01-01T00:01:00.000Z"
  );
});
