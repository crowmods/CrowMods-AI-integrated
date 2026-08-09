const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculateBudget,
  burnRate,
  burnSeverity,
  evaluateBurn
}=require("../src/error-budget");

test("error budget is calculated",()=>{
  const result=calculateBudget({
    targetPercent:99,
    total:1000,
    failures:5
  });

  assert.equal(
    result.allowedFailurePercent,
    1
  );
  assert.equal(
    result.consumedFailurePercent,
    0.5
  );
  assert.equal(
    result.status,
    "HEALTHY"
  );
});

test("budget exhaustion is detected",()=>{
  assert.equal(
    calculateBudget({
      targetPercent:99,
      total:100,
      failures:2
    }).status,
    "EXHAUSTED"
  );
});

test("burn rate is calculated",()=>{
  assert.equal(
    burnRate({
      targetPercent:99,
      observedSuccessPercent:98
    }),
    2
  );
});

test("high burn produces alert",()=>{
  const result=evaluateBurn({
    targetPercent:99,
    observedSuccessPercent:90,
    windowMinutes:60
  });

  assert.equal(result.status,"ALERT");
  assert.equal(result.severity,"CRITICAL");
});

test("normal burn stays normal",()=>{
  assert.equal(
    burnSeverity(0.5),
    "INFO"
  );
});
