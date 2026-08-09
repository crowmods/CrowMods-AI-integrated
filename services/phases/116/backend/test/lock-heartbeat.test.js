const test=require("node:test");
const assert=require("node:assert/strict");
const {
  renewLock,
  releaseLock
}=require("../src/lock-heartbeat");

test("owner can renew active lock",()=>{
  const result=renewLock({
    lock:{
      id:"lock-1",
      ownerId:"worker-1",
      expiresAt:"2026-01-01T01:00:00Z"
    },
    ownerId:"worker-1",
    now:"2026-01-01T00:00:00Z",
    extensionSeconds:300
  });

  assert.equal(result.status,"RENEWED");
});

test("owner can release lock",()=>{
  assert.equal(
    releaseLock({
      lock:{
        id:"lock-1",
        ownerId:"worker-1"
      },
      ownerId:"worker-1"
    }).status,
    "RELEASED"
  );
});
