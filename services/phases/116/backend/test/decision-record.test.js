const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateDecision
}=require("../src/decision-record");

test("decision record validates",()=>{
  assert.equal(
    validateDecision({
      decision:"MITIGATE",
      rationale:"Risk reduction work is approved.",
      decisionMaker:"security-executive"
    }).status,
    "VALID"
  );
});
