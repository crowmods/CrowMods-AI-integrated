const test=require("node:test");
const assert=require("node:assert/strict");
const {MemoryChaosProvider}=require("../src/chaos");

test("chaos provider remains simulation-only",async()=>{
  const provider=new MemoryChaosProvider();

  const injected=await provider.inject({
    type:"REGION_UNAVAILABLE",
    scope:"simulation"
  });

  const recovered=await provider.recover(injected.fault);
  const rollback=await provider.rollback(injected.fault);

  assert.equal(injected.injected,true);
  assert.equal(recovered.recovered,true);
  assert.equal(rollback.rolledBack,true);
});
