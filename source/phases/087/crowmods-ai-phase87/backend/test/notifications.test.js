const test=require("node:test");
const assert=require("node:assert/strict");
const {
  MemoryNotificationProvider
}=require("../src/notifications");

test("notification provider remains simulation-only",async()=>{
  const provider=new MemoryNotificationProvider();

  const result=await provider.send(
    "ops",
    "test alert"
  );

  assert.equal(result.sent,true);
  assert.equal(result.mode,"SIMULATION");
});
