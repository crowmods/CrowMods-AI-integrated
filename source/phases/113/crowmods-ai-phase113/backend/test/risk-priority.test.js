const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculatePriority
}=require("../src/risk-priority");

test("high risk receives high priority",()=>{
  const result=calculatePriority({
    likelihood:8,
    impact:9,
    exposure:8,
    effectiveness:30
  });

  assert.equal(result.priority,"CRITICAL");
});

test("low risk receives low priority",()=>{
  const result=calculatePriority({
    likelihood:1,
    impact:1,
    exposure:1,
    effectiveness:99
  });

  assert.equal(result.priority,"LOW");
});
