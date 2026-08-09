const test=require("node:test");
const assert=require("node:assert/strict");
const {
  isAlreadyProcessed,
  lagSeconds,
  consumerHealth
}=require("../src/consumer");

test("processed event is recognized",()=>{
  assert.equal(isAlreadyProcessed({eventId:"x"}),true);
});

test("lag is calculated in seconds",()=>{
  const lag=lagSeconds(
    "2026-01-01T00:01:00Z",
    "2026-01-01T00:00:00Z"
  );
  assert.equal(lag,60);
});

test("healthy consumer passes",()=>{
  const result=consumerHealth({
    lagSecondsValue:10,
    errorRate:.001
  });
  assert.equal(result.healthy,true);
});

test("lagging consumer fails",()=>{
  const result=consumerHealth({
    lagSecondsValue:100,
    errorRate:.001
  });
  assert.equal(result.healthy,false);
});
