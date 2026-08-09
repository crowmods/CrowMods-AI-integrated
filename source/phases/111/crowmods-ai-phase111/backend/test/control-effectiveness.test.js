const test=require("node:test");
const assert=require("node:assert/strict");
const {
  evaluateControl
}=require("../src/control-effectiveness");

test("strong control is effective",()=>{
  const result=evaluateControl({
    totalTests:100,
    passedTests:100,
    targetPercent:99
  });

  assert.equal(result.status,"EFFECTIVE");
});

test("weak control is ineffective",()=>{
  const result=evaluateControl({
    totalTests:100,
    passedTests:70,
    targetPercent:99
  });

  assert.equal(result.status,"INEFFECTIVE");
});
