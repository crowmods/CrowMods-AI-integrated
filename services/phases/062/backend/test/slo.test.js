const test=require("node:test");
const assert=require("node:assert/strict");
const {burnRate,evaluate}=require("../src/slo");

test("burn rate is one at the error budget boundary",()=>{
  assert.equal(burnRate({
    observedErrorRate:.02,
    allowedErrorRate:.02
  }),1);
});

test("healthy SLO continues",()=>{
  const r=evaluate({
    errorRate:.001,
    latencyMs:300,
    healthRate:1
  });
  assert.equal(r.healthy,true);
  assert.equal(r.recommendation,"CONTINUE");
});

test("unhealthy SLO alerts",()=>{
  const r=evaluate({
    errorRate:.08,
    latencyMs:300,
    healthRate:1
  });
  assert.equal(r.healthy,false);
  assert.equal(r.recommendation,"ALERT");
  assert.ok(r.burnRate>1);
});
