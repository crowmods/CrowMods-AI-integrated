const test=require("node:test");
const assert=require("node:assert/strict");
const {
  validateReview,
  canCloseReview
}=require("../src/post-incident");

test("review requires meaningful summary",()=>{
  assert.equal(
    validateReview({
      summary:"A detailed incident summary."
    }).valid,
    true
  );
});

test("critical unresolved actions block closure",()=>{
  assert.equal(
    canCloseReview({
      status:"APPROVED",
      unresolvedCriticalActions:1
    }),
    false
  );
});

test("approved review with no critical actions closes",()=>{
  assert.equal(
    canCloseReview({
      status:"APPROVED",
      unresolvedCriticalActions:0
    }),
    true
  );
});
