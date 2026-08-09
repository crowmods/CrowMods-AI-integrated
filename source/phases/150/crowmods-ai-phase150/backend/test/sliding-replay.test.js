const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateSlidingWindow}=require("../src/sliding-replay");

test("requests are throttled inside window",()=>{
 const r=evaluateSlidingWindow({
  windowStart:"2026-01-01T00:00:00Z",
  now:"2026-01-01T00:00:20Z",
  windowSeconds:60,
  requestCount:4,
  limitCount:5
 });
 assert.equal(r.state,"THROTTLED");
});

test("expired window resets",()=>{
 const r=evaluateSlidingWindow({
  windowStart:"2026-01-01T00:00:00Z",
  now:"2026-01-01T00:02:00Z",
  windowSeconds:60,
  requestCount:100,
  limitCount:5
 });
 assert.equal(r.windowReset,true);
});
