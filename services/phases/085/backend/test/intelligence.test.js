const test=require("node:test");
const assert=require("node:assert/strict");
const {
  anomalyScore,
  confidence,
  severityFromDeviation,
  multiWindowForecast,
  shouldEscalate
}=require("../src/intelligence");

test("anomaly score detects deviation",()=>{
  const result=anomalyScore(
    [10,10,10,10,10],
    20
  );

  assert.equal(result.deviationScore,Infinity);
});

test("confidence increases with history",()=>{
  assert.equal(confidence([1,2,3,4,5,6,7]),.8);
});

test("large deviation becomes critical",()=>{
  assert.equal(severityFromDeviation(4),"CRITICAL");
});

test("multi-window forecast returns windows",()=>{
  const result=multiWindowForecast(
    [1,2,3,4,5,6,7,8]
  );

  assert.equal(result.windows.length,3);
});

test("repeated alert escalates",()=>{
  assert.equal(
    shouldEscalate({
      currentSeverity:"WARNING",
      previousSeverity:"WARNING",
      occurrences:3
    }),
    true
  );
});
