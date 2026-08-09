const test=require("node:test");
const assert=require("node:assert/strict");
const {
  transition
}=require("../src/canary-orchestrator");

const healthy={
  schemaValid:true,
  dependenciesHealthy:true,
  rollbackReady:true,
  observabilityReady:true
};

test("rollout progresses to canary",()=>{
  assert.equal(
    transition({
      stage:"PRECHECK",
      checks:healthy
    }).stage,
    "CANARY"
  );
});

test("unhealthy observation rolls back",()=>{
  assert.equal(
    transition({
      stage:"OBSERVE",
      checks:healthy,
      errorRate:10
    }).stage,
    "ROLLING_BACK"
  );
});
