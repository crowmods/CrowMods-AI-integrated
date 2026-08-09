const test=require("node:test");
const assert=require("node:assert/strict");
const {incidentPayload}=require("../src/incident-bridge");

test("lag alert produces incident payload",()=>{
  const result=incidentPayload({
    consumerGroup:"api-workers",
    lag:500,
    threshold:100,
    severity:"HIGH"
  });

  assert.equal(result.alertName,"consumer-lag");
  assert.equal(result.metadata.lag,500);
});
