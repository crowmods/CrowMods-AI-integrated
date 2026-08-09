const test=require("node:test");
const assert=require("node:assert/strict");
const {
  reviewDecision,
  campaignStatus
}=require("../src/access-review");

test("retain decision requires a reason",()=>{
  assert.equal(
    reviewDecision({
      decision:"RETAIN",
      reason:"Role still required"
    }).valid,
    true
  );
});

test("invalid review decision is rejected",()=>{
  assert.equal(
    reviewDecision({
      decision:"ALLOW",
      reason:"test"
    }).valid,
    false
  );
});

test("campaign becomes ready when all subjects reviewed",()=>{
  assert.equal(
    campaignStatus(10,10),
    "READY_TO_CLOSE"
  );
});
