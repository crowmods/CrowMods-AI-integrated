const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluate}=require("../src/distributed-rate-limit");

test("shared counter throttles at limit",()=>{
 const r=evaluate({
  elapsedSeconds:10,
  requestCount:4,
  limitCount:5,
  windowSeconds:60
 });
 assert.equal(r.state,"THROTTLED");
 assert.equal(r.requestCount,5);
});

test("expired bucket resets",()=>{
 const r=evaluate({
  elapsedSeconds:61,
  requestCount:99,
  limitCount:5,
  windowSeconds:60
 });
 assert.equal(r.state,"ALLOW");
 assert.equal(r.reset,true);
 assert.equal(r.requestCount,1);
});

test("excessive traffic escalates",()=>{
 const r=evaluate({
  elapsedSeconds:10,
  requestCount:9,
  limitCount:5,
  windowSeconds:60,
  escalationMultiplier:2
 });
 assert.equal(r.state,"ESCALATED");
});
