const test=require("node:test");
const assert=require("node:assert/strict");
const {
  correlateDeployment
}=require("../src/deployment-correlation");

test("deployment overlapping incident is correlated",()=>{
  const result=correlateDeployment({
    incidentStart:"2026-01-01T00:00:00Z",
    incidentEnd:"2026-01-01T02:00:00Z",
    deploymentStart:"2026-01-01T01:00:00Z",
    deploymentEnd:"2026-01-01T03:00:00Z",
    deploymentKey:"DEP-1",
    commitSha:"abc123"
  });

  assert.equal(
    result.status,
    "CORRELATED"
  );
  assert.equal(
    result.commitSha,
    "abc123"
  );
});
