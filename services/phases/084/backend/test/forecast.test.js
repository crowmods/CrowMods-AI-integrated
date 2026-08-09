const test=require("node:test");
const assert=require("node:assert/strict");
const {
  linearTrend,
  forecastScore,
  riskLevel,
  degradationDetected
}=require("../src/forecast");

test("increasing values have positive trend",()=>{
  assert.equal(linearTrend([.5,.6,.7])>.0,true);
});

test("forecast stays within score bounds",()=>{
  const result=forecastScore([.9,.8,.7],2);

  assert.equal(result.forecast>=0,true);
  assert.equal(result.forecast<=1,true);
});

test("low forecast produces elevated risk",()=>{
  assert.equal(riskLevel(.3),"CRITICAL");
});

test("threshold degradation is detected",()=>{
  assert.equal(
    degradationDetected({
      currentScore:.9,
      forecastScore:.7,
      threshold:.8
    }),
    true
  );
});
