const test=require("node:test");
const assert=require("node:assert/strict");
const {MemoryAutoscalingAdapter}=require("../src/adapter");

test("memory adapter applies capacity",async()=>{
  const adapter=new MemoryAutoscalingAdapter();

  await adapter.applyCapacity("workers",5);

  assert.equal(
    await adapter.getCapacity("workers"),
    5
  );
});

test("memory adapter rolls back capacity",async()=>{
  const adapter=new MemoryAutoscalingAdapter();

  await adapter.applyCapacity("workers",5);
  await adapter.rollbackCapacity("workers",2);

  assert.equal(
    await adapter.getCapacity("workers"),
    2
  );
});
