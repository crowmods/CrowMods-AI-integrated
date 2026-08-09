const test=require("node:test");
const assert=require("node:assert/strict");
const {runWithSerializableRetry,backoffDelay}=require("../src/serializable-retry");

test("retry engine retries serialization failure",async()=>{
  let calls=0;
  const delays=[];
  const r=await runWithSerializableRetry({
    maxAttempts:3,
    operation:async()=>{
      calls++;
      if(calls<2){
        const e=new Error("serialization");
        e.code="40001";
        throw e;
      }
      return "ok";
    },
    sleep:async ms=>delays.push(ms)
  });
  assert.equal(r.status,"COMMITTED");
  assert.equal(r.attempt,2);
  assert.equal(delays.length,1);
});

test("backoff is bounded",()=>{
  assert.equal(
    backoffDelay({attempt:20,maxMs:100}),
    100
  );
});
