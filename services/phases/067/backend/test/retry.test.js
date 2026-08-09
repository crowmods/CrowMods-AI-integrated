const test=require("node:test");
const assert=require("node:assert/strict");
const {retryDelay,deliveryDecision}=require("../src/retry");

test("retry delay grows",()=>{
  assert.ok(retryDelay(2)>retryDelay(1));
});

test("max attempts sends to DLQ",()=>{
  assert.equal(deliveryDecision(5,5),"DLQ");
});

test("attempt below maximum retries",()=>{
  assert.equal(deliveryDecision(2,5),"RETRY");
});
