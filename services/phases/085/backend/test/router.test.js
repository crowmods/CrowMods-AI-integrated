const test=require("node:test");
const assert=require("node:assert/strict");
const {MemoryAlertRouter}=require("../src/router");

test("memory router records routed alert",async()=>{
  const router=new MemoryAlertRouter();

  const result=await router.route({
    severity:"HIGH",
    message:"test"
  });

  assert.equal(result.routed,true);
  assert.equal(router.events.length,1);
});
