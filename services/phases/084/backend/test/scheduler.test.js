const test=require("node:test");
const assert=require("node:assert/strict");
const {
  nextRunFromCadence,
  MemorySchedulerAdapter
}=require("../src/scheduler");

test("daily cadence advances one day",()=>{
  const result=nextRunFromCadence(
    "daily",
    new Date("2026-08-09T00:00:00Z")
  );

  assert.equal(result,"2026-08-10T00:00:00.000Z");
});

test("scheduler can trigger a job",async()=>{
  const scheduler=new MemorySchedulerAdapter();

  const result=await scheduler.trigger({
    id:"job-1"
  });

  assert.equal(result.triggered,true);
});
