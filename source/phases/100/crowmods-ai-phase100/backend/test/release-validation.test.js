const test=require("node:test");
const assert=require("node:assert/strict");
const {
  controls,
  runApplicationChecks,
  summarize,
  runReleaseValidation
}=require("../src/release-validation");

test("all application controls are represented",()=>{
  const result=runApplicationChecks();

  assert.equal(
    result.length,
    controls.length
  );

  assert.equal(
    result.every(
      check=>check.status==="PASS"
    ),
    true
  );
});

test("summary passes when all checks pass",()=>{
  const result=summarize([
    {status:"PASS"},
    {status:"PASS"}
  ]);

  assert.deepEqual(
    result,
    {
      passed:2,
      failed:0,
      blocked:0,
      status:"PASS"
    }
  );
});

test("full validation detects missing production config",()=>{
  const result=runReleaseValidation({
    NODE_ENV:"production"
  });

  assert.equal(
    result.summary.status,
    "BLOCKED"
  );
});
