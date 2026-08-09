const test=require("node:test");
const assert=require("node:assert/strict");
const {buildAlert}=require("../src/alert-escalation");

test("critical alert escalates",()=>{
  const r=buildAlert({
    alertType:"FORECAST_DRIFT",
    message:"drift",
    severity:"CRITICAL",
    occurrences:1
  });
  assert.equal(r.escalated,true);
  assert.equal(r.fingerprint.length,64);
});

test("repeated warning escalates",()=>{
  const r=buildAlert({
    alertType:"FORECAST_DRIFT",
    message:"drift",
    severity:"WARNING",
    occurrences:3
  });
  assert.equal(r.escalated,true);
});
