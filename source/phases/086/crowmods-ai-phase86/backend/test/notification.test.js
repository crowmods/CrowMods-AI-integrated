const test=require("node:test");
const assert=require("node:assert/strict");
const {
  MemoryNotificationProvider
}=require("../src/notification");

test("memory notification provider is simulation-only",async()=>{
  const provider=new MemoryNotificationProvider();

  const result=await provider.send(
    "test-destination",
    "test alert"
  );

  assert.equal(result.sent,true);
  assert.equal(result.mode,"SIMULATION");
});
