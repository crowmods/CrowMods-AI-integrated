const test=require("node:test");
const assert=require("node:assert/strict");
const {
  MemoryReplicationProvider,
  MemoryTrafficProvider
}=require("../src/adapters");

test("replication adapter reports healthy",async()=>{
  const provider=new MemoryReplicationProvider();

  const result=await provider.getLag("a","b");

  assert.equal(result.healthy,true);
});

test("traffic provider supports dry run and rollback",async()=>{
  const provider=new MemoryTrafficProvider();

  const dryRun=await provider.dryRun("a","b");
  const rollback=await provider.rollback("b","a");

  assert.equal(dryRun.valid,true);
  assert.equal(rollback.rolledBack,true);
});
