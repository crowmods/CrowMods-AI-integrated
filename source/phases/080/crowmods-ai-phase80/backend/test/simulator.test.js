const test=require("node:test");
const assert=require("node:assert/strict");
const {MemoryDRSimulationAdapter}=require("../src/simulator");

test("simulation adapter validates restore flow",async()=>{
  const adapter=new MemoryDRSimulationAdapter();

  assert.equal((await adapter.validateSnapshot()).passed,true);
  assert.equal((await adapter.restore()).passed,true);
  assert.equal((await adapter.verifyIntegrity()).passed,true);
  assert.equal((await adapter.reconnectProviders()).passed,true);
});
