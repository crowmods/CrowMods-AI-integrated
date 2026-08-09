const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calibrateForecasts
}=require("../src/forecast-calibration");

test("forecast calibration computes MAE",()=>{
  const result=calibrateForecasts({
    predictions:[50,60,70],
    actuals:[55,55,75]
  });

  assert.equal(result.status,"CALIBRATED");
  assert.equal(result.meanAbsoluteError,5);
  assert.equal(result.bias,1.6667);
});
