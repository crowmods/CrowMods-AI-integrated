const test=require("node:test");
const assert=require("node:assert/strict");
const {replayDecision}=require("../src/dlq");

test("pending DLQ item can replay",()=>{
  assert.equal(
    replayDecision({
      status:"PENDING",
      attempts:1,
      maxAttempts:3
    }),
    "REPLAY"
  );
});

test("max attempts fails",()=>{
  assert.equal(
    replayDecision({
      status:"PENDING",
      attempts:3,
      maxAttempts:3
    }),
    "FAIL"
  );
});
