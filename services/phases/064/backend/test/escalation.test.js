const test=require("node:test");
const assert=require("node:assert/strict");
const {shouldEscalate,nextLevel,retryDelay}=require("../src/escalation");

test("unacknowledged incident with no notification escalates",()=>{
  assert.equal(shouldEscalate({status:"OPEN"}),true);
});

test("acknowledged incident does not escalate",()=>{
  assert.equal(shouldEscalate({
    status:"ACKNOWLEDGED",
    acknowledgedAt:new Date(0).toISOString(),
    now:Date.now()
  }),false);
});

test("next escalation level is bounded",()=>{
  assert.equal(nextLevel(1,3),2);
  assert.equal(nextLevel(3,3),null);
});

test("retry delay is bounded",()=>{
  assert.equal(retryDelay(0),1000);
  assert.ok(retryDelay(20)<=300000);
});
