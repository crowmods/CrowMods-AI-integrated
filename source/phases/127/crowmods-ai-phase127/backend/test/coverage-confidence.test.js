const test=require("node:test");
const assert=require("node:assert/strict");
const {wilsonInterval}=require("../src/coverage-confidence");

test("coverage confidence interval is bounded",()=>{
  const r=wilsonInterval({
    successes:90,
    trials:100,
    confidenceLevel:.95
  });
  assert.equal(r.status,"CALCULATED");
  assert.equal(r.coverage,.9);
  assert.equal(r.lowerBound>=0,true);
  assert.equal(r.upperBound<=1,true);
  assert.equal(r.lowerBound<.9,true);
  assert.equal(r.upperBound>.9,true);
});
