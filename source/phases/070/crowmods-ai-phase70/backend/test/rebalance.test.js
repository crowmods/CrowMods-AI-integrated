const test=require("node:test");
const assert=require("node:assert/strict");
const {staleWorkers,rebalancePlan}=require("../src/rebalance");

test("stale worker is detected",()=>{
  const result=staleWorkers([
    {
      workerId:"w1",
      status:"READY",
      activePartitions:1,
      lastSeenAt:"2026-01-01T00:00:00Z"
    }
  ],Date.parse("2026-01-01T00:02:00Z"),60000);

  assert.equal(result.length,1);
});

test("rebalance assigns partition to healthy worker",()=>{
  const result=rebalancePlan({
    assignments:[{
      topic:"events",
      partitionId:0,
      consumerGroup:"g1",
      workerId:"dead"
    }],
    workers:[
      {
        workerId:"dead",
        status:"READY",
        activePartitions:1,
        lastSeenAt:"2026-01-01T00:00:00Z"
      },
      {
        workerId:"live",
        status:"READY",
        activePartitions:0,
        lastSeenAt:"2026-01-01T00:01:50Z"
      }
    ],
    now:Date.parse("2026-01-01T00:02:00Z"),
    timeoutMs:60000
  });

  assert.equal(result[0].newWorker,"live");
});
