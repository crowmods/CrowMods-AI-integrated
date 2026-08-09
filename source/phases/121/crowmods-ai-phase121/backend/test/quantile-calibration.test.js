const test=require("node:test");
const assert=require("node:assert/strict");
const {
  quantile,
  calibrateQuantiles,
  intervalCoverage
}=require("../src/quantile-calibration");

test("quantile calibration returns residual bands",()=>{
  const result=calibrateQuantiles({
    residuals:[-4,-2,-1,1,2,4],
    lowerQuantile:.2,
    upperQuantile:.8
  });

  assert.equal(result.status,"CALIBRATED");
  assert.equal(result.lowerError,-2);
  assert.equal(result.upperError,2);
});

test("coverage is measured",()=>{
  const result=intervalCoverage({
    actuals:[9,10,14],
    predictions:[10,10,10],
    lowerError:-2,
    upperError:2
  });

  assert.equal(result,2/3);
});

test("quantile returns sorted value",()=>{
  assert.equal(quantile([5,1,3],.5),3);
});
