const test=require("node:test");
const assert=require("node:assert/strict");
const {
  hysteresisDecision,
  verificationResult
}=require("../src/hysteresis");

test("scale-out threshold triggers",()=>{
  const r=hysteresisDecision({
    lag:500,
    scaleOutThreshold:400,
    scaleInThreshold:100,
    currentWorkers:2,
    minWorkers:1,
    maxWorkers:10
  });

  assert.equal(r.action,"SCALE_OUT");
  assert.equal(r.desiredWorkers,3);
});

test("inside hysteresis band holds",()=>{
  const r=hysteresisDecision({
    lag:200,
    scaleOutThreshold:400,
    scaleInThreshold:100,
    currentWorkers:3,
    minWorkers:1,
    maxWorkers:10
  });

  assert.equal(r.action,"HOLD");
});

test("successful verification passes",()=>{
  const r=verificationResult({
    expectedWorkers:4,
    observedWorkers:4,
    lagBefore:500,
    lagAfter:200,
    errorRate:.01
  });

  assert.equal(r.status,"PASS");
});

test("verification can recommend rollback",()=>{
  const r=verificationResult({
    expectedWorkers:4,
    observedWorkers:2,
    lagBefore:500,
    lagAfter:700,
    errorRate:.05
  });

  assert.equal(r.status,"ROLLBACK_RECOMMENDED");
});
