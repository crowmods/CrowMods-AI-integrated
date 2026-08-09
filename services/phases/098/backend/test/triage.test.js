const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateTriage,
  nextAlertStatus
}=require("../src/triage");

test("triage requires valid decision and notes",()=>{
  assert.equal(
    validateTriage({
      decision:"ACKNOWLEDGED",
      notes:"Analyst reviewed event"
    }).valid,
    true
  );
});

test("false positive closes alert",()=>{
  assert.equal(
    nextAlertStatus("FALSE_POSITIVE"),
    "CLOSED"
  );
});

test("escalation keeps alert open",()=>{
  assert.equal(
    nextAlertStatus("ESCALATED"),
    "OPEN"
  );
});
