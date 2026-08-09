const test=require("node:test");
const assert=require("node:assert/strict");
const {
  sloHealthy,
  closureEligibility,
  nextIncidentState
}=require("../src/closure");

test("lower-is-better SLO passes",()=>{
  assert.equal(
    sloHealthy({
      observedValue:.01,
      targetValue:.02,
      direction:"LOWER"
    }),
    true
  );
});

test("all closure gates are required",()=>{
  const result=closureEligibility({
    recoveryVerified:true,
    sloVerified:true,
    timelineComplete:true,
    postmortemEvidenceComplete:false
  });

  assert.equal(result.eligible,false);
});

test("eligible incident reaches ready-for-closure",()=>{
  assert.equal(
    nextIncidentState({
      currentState:"RECOVERY_VERIFIED",
      closureEligible:true
    }),
    "READY_FOR_CLOSURE"
  );
});
