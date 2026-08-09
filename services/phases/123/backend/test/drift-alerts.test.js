const test=require("node:test");
const assert=require("node:assert/strict");
const {buildDriftAlert}=require("../src/drift-alerts");

test("critical drift creates critical alert",()=>{
  const r=buildDriftAlert({driftRatio:2});
  assert.equal(r.severity,"CRITICAL");
});

test("stable drift remains informational",()=>{
  const r=buildDriftAlert({driftRatio:1});
  assert.equal(r.severity,"INFO");
});
