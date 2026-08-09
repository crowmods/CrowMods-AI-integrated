const test=require("node:test");
const assert=require("node:assert/strict");
const {
  calculateJitteredRetry
}=require("../src/retry-jitter");

test("jittered retry remains bounded",()=>{
  const result=calculateJitteredRetry({
    attempt:2,
    maxAttempts:5,
    baseDelaySeconds:10,
    maxDelaySeconds:100,
    jitterRatio:.25,
    random:()=>1
  });

  assert.equal(result.retry,true);
  assert.equal(result.delaySeconds<=100,true);
});

test("retry limit routes to dead letter",()=>{
  const result=calculateJitteredRetry({
    attempt:5,
    maxAttempts:5
  });

  assert.equal(result.deadLetter,true);
});
