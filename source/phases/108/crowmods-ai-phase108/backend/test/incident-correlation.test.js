const test=require("node:test");
const assert=require("node:assert/strict");
const {
  correlateSignals
}=require("../src/incident-correlation");

test("multiple signals increase confidence",()=>{
  const result=correlateSignals({
    incidentSeverity:"CRITICAL",
    burnAlert:true,
    providerFailure:true,
    changeOverlap:1
  });

  assert.equal(
    result.classification,
    "HIGH_CONFIDENCE"
  );
});
