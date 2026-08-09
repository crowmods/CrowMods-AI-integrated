const test=require("node:test");
const assert=require("node:assert/strict");
const {
  forecastAssurance
}=require("../src/assurance-forecast");

test("improving assurance is forecast",()=>{
  const result=forecastAssurance({
    currentScore:80,
    slopePerPeriod:2,
    horizonPeriods:5
  });

  assert.equal(result.status,"IMPROVING");
  assert.equal(result.projectedScore,90);
});

test("declining score can become at risk",()=>{
  const result=forecastAssurance({
    currentScore:65,
    slopePerPeriod:-3,
    horizonPeriods:4
  });

  assert.equal(result.status,"AT_RISK");
});
