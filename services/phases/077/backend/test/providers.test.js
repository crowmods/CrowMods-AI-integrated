const test=require("node:test");
const assert=require("node:assert/strict");
const {
  MockIncidentProvider,
  MockSLOProvider
}=require("../src/providers");

test("mock incident provider transitions state",async()=>{
  const provider=new MockIncidentProvider();

  await provider.transitionState(
    "i1",
    "RECOVERY_VERIFIED",
    "Evidence passed"
  );

  const incident=await provider.getIncident("i1");

  assert.equal(incident.state,"RECOVERY_VERIFIED");
});

test("mock SLO provider evaluates target",async()=>{
  const provider=new MockSLOProvider();

  provider.setSLO("error-rate",.02,"LOWER");

  const result=await provider.evaluate("error-rate",.01);

  assert.equal(result.healthy,true);
});
