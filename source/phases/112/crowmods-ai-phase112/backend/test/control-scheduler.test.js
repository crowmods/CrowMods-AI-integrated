const test=require("node:test");
const assert=require("node:assert/strict");
const {
  nextRun,
  validateSchedule
}=require("../src/control-scheduler");

test("weekly schedule advances seven days",()=>{
  assert.equal(
    nextRun(
      "WEEKLY",
      "2026-01-01T00:00:00Z"
    ),
    "2026-01-08T00:00:00.000Z"
  );
});

test("valid schedule passes",()=>{
  assert.equal(
    validateSchedule({
      frequency:"MONTHLY",
      owner:"security-team"
    }).status,
    "VALID"
  );
});
