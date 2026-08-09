const test=require("node:test");
const assert=require("node:assert/strict");
const {
  buildEvidence,
  packageStatus,
  approvalDecision
}=require("../src/evidence");

test("evidence has required metadata",()=>{
  const e=buildEvidence({
    incidentId:"i1",
    evidenceType:"SLO",
    source:"memory",
    summary:"Recovered"
  });

  assert.equal(e.incidentId,"i1");
  assert.equal(e.evidenceType,"SLO");
});

test("package becomes ready after minimum evidence",()=>{
  assert.equal(packageStatus(3,3),"READY");
});

test("approval requires explicit approver",()=>{
  const result=approvalDecision({
    closureEligible:true,
    packageReady:true,
    requestedBy:"operator"
  });

  assert.equal(result.allowed,false);
});

test("approval succeeds with all gates",()=>{
  const result=approvalDecision({
    closureEligible:true,
    packageReady:true,
    requestedBy:"operator",
    approvedBy:"approver"
  });

  assert.equal(result.allowed,true);
});
