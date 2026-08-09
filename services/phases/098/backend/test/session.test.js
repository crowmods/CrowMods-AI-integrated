const test=require("node:test");
const assert=require("node:assert/strict");
const {
  scoreSession,
  suspiciousSession
}=require("../src/session");

test("suspicious privileged session scores high",()=>{
  const result=scoreSession({
    eventCount:180,
    deniedCount:6,
    sensitiveActionCount:12,
    unusualResource:true
  });

  assert.equal(result.severity,"CRITICAL");
  assert.equal(suspiciousSession(result.score),true);
});

test("normal session remains low",()=>{
  const result=scoreSession({
    eventCount:2
  });

  assert.equal(result.severity,"LOW");
});
