const test=require("node:test");
const assert=require("node:assert/strict");
const {
  forecastRisk
}=require("../src/risk-forecast");

test("declining risk score is improving",()=>{
  const result=forecastRisk({
    currentScore:40,
    slopePerPeriod:-2,
    horizonPeriods:5
  });

  assert.equal(result.status,"IMPROVING");
  assert.equal(result.projectedScore,30);
});

test("high projected risk is critical",()=>{
  const result=forecastRisk({
    currentScore:70,
    slopePerPeriod:2,
    horizonPeriods:4
  });

  assert.equal(result.status,"CRITICAL");
});
