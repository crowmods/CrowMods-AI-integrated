const test=require("node:test");
const assert=require("node:assert/strict");
const {
  transition,
  highestSeverity,
  correlateIncident,
  shouldReopen,
  retryEligible
}=require("../src/lifecycle");

test("alert can be acknowledged and resolved",()=>{
  assert.equal(
    transition("OPEN","ACKNOWLEDGED"),
    "ACKNOWLEDGED"
  );

  assert.equal(
    transition("ACKNOWLEDGED","RESOLVED"),
    "RESOLVED"
  );
});

test("highest severity is selected",()=>{
  assert.equal(
    highestSeverity(["WARNING","CRITICAL","HIGH"]),
    "CRITICAL"
  );
});

test("incident correlation detects SLO breach",()=>{
  const result=correlateIncident([
    {severity:"WARNING",sloBreach:false},
    {severity:"HIGH",sloBreach:true}
  ]);

  assert.equal(result.alertCount,2);
  assert.equal(result.sloBreach,true);
  assert.equal(result.highestSeverity,"HIGH");
});

test("resolved critical incident can reopen",()=>{
  assert.equal(
    shouldReopen({
      incidentStatus:"RESOLVED",
      incomingSeverity:"CRITICAL",
      previousSeverity:"HIGH"
    }),
    true
  );
});

test("failed delivery is retry eligible",()=>{
  assert.equal(
    retryEligible({
      status:"FAILED",
      attempts:2,
      maxAttempts:5,
      nextAttemptAt:null
    }),
    true
  );
});
