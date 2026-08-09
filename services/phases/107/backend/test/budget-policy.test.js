const test=require("node:test");
const assert=require("node:assert/strict");
const {
  decidePolicy
}=require("../src/budget-policy");

test("healthy budget continues",()=>{
  assert.equal(
    decidePolicy({
      budgetStatus:"HEALTHY",
      highestSeverity:"INFO"
    }).decision,
    "CONTINUE"
  );
});

test("exhausted budget freezes change",()=>{
  assert.equal(
    decidePolicy({
      budgetStatus:"EXHAUSTED",
      highestSeverity:"INFO"
    }).decision,
    "FREEZE_CHANGE"
  );
});

test("critical burn escalates",()=>{
  assert.equal(
    decidePolicy({
      budgetStatus:"HEALTHY",
      highestSeverity:"CRITICAL"
    }).decision,
    "ESCALATE"
  );
});
