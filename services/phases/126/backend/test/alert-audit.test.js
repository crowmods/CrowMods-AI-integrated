const test=require("node:test");
const assert=require("node:assert/strict");
const {buildAuditEvent}=require("../src/alert-audit");

test("audit event records action",()=>{
  const r=buildAuditEvent({
    fingerprint:"abc",
    action:"ACKNOWLEDGED",
    actor:"operator-1"
  });
  assert.equal(r.action,"ACKNOWLEDGED");
  assert.equal(r.actor,"operator-1");
});
