const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculateRiskTrend
}=require("../src/risk-trends");

test("falling risk score improves",()=>{
  assert.equal(
    calculateRiskTrend([70,65,60]).trend,
    "IMPROVING"
  );
});

test("rising risk score worsens",()=>{
  assert.equal(
    calculateRiskTrend([40,45,50]).trend,
    "WORSENING"
  );
});
