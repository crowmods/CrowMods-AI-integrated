const test=require("node:test");
const assert=require("node:assert/strict");
const {executeVerifiedTakeover}=require("../src/verified-sql-takeover");

test("verified SQL takeover succeeds",async()=>{
  const pool={
    query:async()=>({
      rowCount:1,
      rows:[{
        result:"TAKEN_OVER",
        affected_rows:"1",
        committed_version:"7"
      }]
    })
  };

  const r=await executeVerifiedTakeover(pool,{
    runKey:"r",
    expectedVersion:6,
    newWorkerId:"w2",
    newLeaseToken:"t2",
    newLeaseExpiresAt:"2027-01-01T00:10:00Z"
  });

  assert.equal(r.status,"TAKEN_OVER");
});
