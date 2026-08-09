const test=require("node:test");
const assert=require("node:assert/strict");
const {
  approvalRequired,
  canStart,
  reportFromSteps
}=require("../src/gameday");

test("production game day requires approval",()=>{
  assert.equal(
    approvalRequired({
      dryRun:false,
      environment:"production"
    }),
    true
  );
});

test("healthy dry run can start without approval",()=>{
  assert.equal(
    canStart({
      approved:false,
      replicationHealthy:true,
      trafficHealthy:true,
      dryRun:true,
      environment:"simulation"
    }),
    true
  );
});

test("failed step makes report fail",()=>{
  const result=reportFromSteps([
    {status:"PASSED"},
    {status:"FAILED"}
  ]);

  assert.equal(result.overallPassed,false);
  assert.equal(result.failedSteps,1);
});
