const test=require("node:test");
const assert=require("node:assert/strict");
const {
  overlapScore,
  correlateChange
}=require("../src/correlation");

test("overlapping windows produce confidence",()=>{
  const score=overlapScore({
    eventStart:"2026-01-01T00:00:00Z",
    eventEnd:"2026-01-01T02:00:00Z",
    referenceStart:"2026-01-01T01:00:00Z",
    referenceEnd:"2026-01-01T03:00:00Z"
  });

  assert.equal(score,0.5);
});

test("change correlation identifies overlap",()=>{
  const result=correlateChange({
    incidentStart:"2026-01-01T00:00:00Z",
    incidentEnd:"2026-01-01T02:00:00Z",
    changeStart:"2026-01-01T01:00:00Z",
    changeEnd:"2026-01-01T03:00:00Z",
    changeKey:"CHG-1"
  });

  assert.equal(
    result.correlationType,
    "CHANGE"
  );
  assert.equal(
    result.referenceKey,
    "CHG-1"
  );
});
