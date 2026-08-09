const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculateResidualRisk
}=require("../src/risk-register");

test("strong control reduces residual risk",()=>{
  const result=calculateResidualRisk({
    likelihood:8,
    impact:8,
    controlEffectiveness:90
  });

  assert.equal(result.residualScore,6.4);
  assert.equal(result.status,"LOW");
});

test("weak control leaves high residual risk",()=>{
  const result=calculateResidualRisk({
    likelihood:8,
    impact:8,
    controlEffectiveness:20
  });

  assert.equal(result.status,"CRITICAL");
});
