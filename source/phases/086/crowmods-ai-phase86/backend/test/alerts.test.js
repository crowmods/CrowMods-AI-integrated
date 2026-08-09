const test=require("node:test");
const assert=require("node:assert/strict");
const {
  shouldSuppress,
  nextBackoff,
  deliveryStatus,
  correlateAlerts,
  policyMatch
}=require("../src/alerts");

test("suppression window blocks active alerts",()=>{
  assert.equal(
    shouldSuppress({
      now:"2026-08-09T12:00:00Z",
      startsAt:"2026-08-09T11:00:00Z",
      endsAt:"2026-08-09T13:00:00Z"
    }),
    true
  );
});

test("backoff increases with attempts",()=>{
  const first=Date.parse(nextBackoff(1));
  const third=Date.parse(nextBackoff(3));

  assert.equal(third>first,true);
});

test("delivery reaches DLQ at max attempts",()=>{
  assert.equal(
    deliveryStatus({
      success:false,
      attempts:5
    }),
    "DLQ"
  );
});

test("correlation identifies SLO breach",()=>{
  const result=correlateAlerts([
    {severity:"WARNING",sloBreach:false},
    {severity:"CRITICAL",sloBreach:true}
  ]);

  assert.equal(result.sloBreach,true);
  assert.equal(result.highestSeverity,"CRITICAL");
});

test("policy threshold matches",()=>{
  assert.equal(policyMatch(10,5),true);
});
