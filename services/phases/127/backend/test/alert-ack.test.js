const test=require("node:test");
const assert=require("node:assert/strict");
const {acknowledgeAlert}=require("../src/alert-ack");

test("alert can be acknowledged",()=>{
  const r=acknowledgeAlert({
    fingerprint:"fp-1",
    actor:"operator",
    note:"reviewed"
  });
  assert.equal(r.status,"ACKNOWLEDGED");
  assert.equal(r.actor,"operator");
});

test("missing actor is rejected",()=>{
  const r=acknowledgeAlert({
    fingerprint:"fp-1"
  });
  assert.equal(r.status,"REJECTED");
});
