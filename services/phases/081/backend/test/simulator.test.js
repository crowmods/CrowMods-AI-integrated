const test=require("node:test");
const assert=require("node:assert/strict");
const {
  MemoryTrafficFailoverAdapter
}=require("../src/simulator");

test("traffic failover simulation is non-destructive",async()=>{
  const adapter=new MemoryTrafficFailoverAdapter();

  const simulation=await adapter.simulate(
    "primary",
    "recovery"
  );

  const validation=await adapter.validate("recovery");

  assert.equal(simulation.status,"SIMULATED");
  assert.equal(validation.status,"VALIDATED");
  assert.equal(validation.healthy,true);
});
