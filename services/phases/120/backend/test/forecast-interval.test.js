const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculatePredictionIntervals,
  empiricalCoverage
}=require("../src/forecast-interval");

test("prediction interval is calculated",()=>{
  const result=calculatePredictionIntervals({
    residuals:[2,3,4,5,6],
    projectedScore:50,
    horizonPeriods:4,
    coverageTarget:.8
  });

  assert.equal(result.status,"CALCULATED");
  assert.equal(result.lowerBound<50,true);
  assert.equal(result.upperBound>50,true);
});

test("empirical coverage is measured",()=>{
  const result=empiricalCoverage({
    predictions:[50,50],
    actuals:[52,60],
    bounds:[
      {lower:45,upper:55},
      {lower:45,upper:55}
    ]
  });

  assert.equal(result,.5);
});
