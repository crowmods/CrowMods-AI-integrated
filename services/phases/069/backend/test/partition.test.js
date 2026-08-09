const test=require("node:test");
const assert=require("node:assert/strict");
const {
  partitionForKey,
  lagScaleSignal
}=require("../src/partition");

test("partition stays within range",()=>{
  const p=partitionForKey("service-a",8);
  assert.ok(p>=0&&p<8);
});

test("same key maps consistently",()=>{
  assert.equal(
    partitionForKey("same-key",8),
    partitionForKey("same-key",8)
  );
});

test("high lag requests scale out",()=>{
  const r=lagScaleSignal({
    totalLag:1000,
    targetLag:100,
    currentWorkers:2,
    partitions:8
  });

  assert.equal(r.action,"SCALE_OUT");
  assert.ok(r.desiredWorkers>2);
});
