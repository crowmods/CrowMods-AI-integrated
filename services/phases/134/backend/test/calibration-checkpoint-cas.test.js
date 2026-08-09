const test=require("node:test");
const assert=require("node:assert/strict");
const {commitCheckpoint}=require("../src/calibration-checkpoint-cas");

test("checkpoint commits with matching version",()=>{
 const r=commitCheckpoint({
  currentVersion:4,
  expectedVersion:4,
  action:"EXPAND",
  windowSize:150,
  stableCycles:3
 });
 assert.equal(r.status,"COMMITTED");
 assert.equal(r.version,5);
});

test("stale checkpoint conflicts",()=>{
 const r=commitCheckpoint({
  currentVersion:5,
  expectedVersion:4,
  action:"HOLD",
  windowSize:100,
  stableCycles:0
 });
 assert.equal(r.status,"CONFLICT");
});
