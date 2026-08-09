const test=require("node:test");
const assert=require("node:assert/strict");
const {alertHistoryEvent}=require("../src/alert-history");

test("acknowledgement history is recorded",()=>{
  const r=alertHistoryEvent({
    fingerprint:"fp",
    action:"ACKNOWLEDGED",
    actor:"operator",
    note:"reviewed"
  });
  assert.equal(r.status,"RECORDED");
});
