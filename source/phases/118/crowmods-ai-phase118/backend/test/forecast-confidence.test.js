const test=require("node:test");
const assert=require("node:assert/strict");
const {
  forecastWithConfidence
}=require("../src/forecast-confidence");

test("forecast returns confidence interval",()=>{
  const result=forecastWithConfidence({
    currentScore:60,
    slopePerPeriod:2,
    horizonPeriods:4,
    volatility:5
  });

  assert.equal(result.projectedScore,68);
  assert.equal(result.lowerBound<68,true);
  assert.equal(result.upperBound>68,true);
  assert.equal(result.confidence>0,true);
});
