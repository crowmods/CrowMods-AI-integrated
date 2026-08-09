const test=require("node:test");
const assert=require("node:assert/strict");
const {reconcile}=require("../src/purge-reconcile");

test("matching purge outcomes reconcile",()=>{
 assert.equal(
  reconcile({
   auditOutcome:"PURGED",
   executionOutcome:"PURGED"
  }).result,
  "MATCH"
 );
});

test("different outcomes mismatch",()=>{
 assert.equal(
  reconcile({
   auditOutcome:"PURGED",
   executionOutcome:"FAILED"
  }).result,
  "MISMATCH"
 );
});
