const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculateRetry
}=require("../src/retry-policy");

test("retry uses exponential backoff",()=>{
  const result=calculateRetry({
    attempt:2,
    maxAttempts:5,
    baseDelaySeconds:10
  });

  assert.equal(result.retry,true);
  assert.equal(result.delaySeconds,20);
});

test("retry stops at limit",()=>{
  assert.equal(
    calculateRetry({
      attempt:5,
      maxAttempts:5
    }).retry,
    false
  );
});
