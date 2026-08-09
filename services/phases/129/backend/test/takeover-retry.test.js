const test=require("node:test");
const assert=require("node:assert/strict");
const {takeoverWithRetry}=require("../src/takeover-retry");

test("takeover retries serialization conflict",async()=>{
  let attempts=0;
  const r=await takeoverWithRetry({
    maxAttempts:3,
    sleep:async()=>{},
    execute:async()=>{
      attempts++;
      if(attempts===1){
        const e=new Error("serialization");
        e.code="40001";
        throw e;
      }
      return {status:"TAKEN_OVER"};
    }
  });
  assert.equal(r.status,"TAKEN_OVER");
  assert.equal(r.attempt,2);
});
