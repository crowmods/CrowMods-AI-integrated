const test=require("node:test");
const assert=require("node:assert/strict");
const {routeAlert}=require("../src/alert-routing");

test("critical alert routes to security",()=>{
  const r=routeAlert({severity:"CRITICAL"});
  assert.equal(r.route,"SECURITY");
  assert.equal(r.escalationLevel,2);
});

test("acknowledged alert is not routed",()=>{
  const r=routeAlert({
    severity:"CRITICAL",
    acknowledged:true
  });
  assert.equal(r.state,"ACKNOWLEDGED");
  assert.equal(r.route,"NONE");
});

test("active suppression blocks routing",()=>{
  const r=routeAlert({
    severity:"WARNING",
    suppressedUntil:"2027-01-01T00:10:00Z",
    now:"2027-01-01T00:05:00Z"
  });
  assert.equal(r.state,"SUPPRESSED");
});
