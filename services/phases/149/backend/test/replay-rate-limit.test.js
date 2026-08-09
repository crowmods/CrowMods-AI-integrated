const test=require("node:test");
const assert=require("node:assert/strict");
const {checkRateLimit}=require("../src/replay-rate-limit");

test("replay rate becomes throttled",()=>{
 assert.equal(
  checkRateLimit({requestCount:5,limitCount:5}).state,
  "THROTTLED"
 );
});

test("excessive replay rate escalates",()=>{
 assert.equal(
  checkRateLimit({
   requestCount:10,
   limitCount:5,
   escalationThreshold:2
  }).state,
  "ESCALATED"
 );
});
