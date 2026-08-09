const test=require("node:test");
const assert=require("node:assert/strict");
const {transitionBreaker}=require("../src/automatic-breaker");

test("degraded dependency opens breaker",()=>{
  const r=transitionBreaker({
    state:"CLOSED",
    failureRate:.2
  });
  assert.equal(r.state,"OPEN");
});

test("open breaker becomes half-open after timeout",()=>{
  const r=transitionBreaker({
    state:"OPEN",
    openedAt:"2026-01-01T00:00:00Z",
    now:"2026-01-01T00:01:00Z",
    halfOpenAfterMs:30000
  });
  assert.equal(r.state,"HALF_OPEN");
});

test("successful probe closes breaker",()=>{
  const r=transitionBreaker({
    state:"HALF_OPEN",
    failureRate:.01
  });
  assert.equal(r.state,"CLOSED");
});
