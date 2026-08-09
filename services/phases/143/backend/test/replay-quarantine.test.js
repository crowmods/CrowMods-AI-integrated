const test=require("node:test");
const assert=require("node:assert/strict");
const {classifyConflict}=require("../src/replay-quarantine");

test("different export is quarantined",()=>{
 const r=classifyConflict({
  existingExportId:"e1",
  requestedExportId:"e2",
  idempotencyKey:"key",
  payloadHash:"p",
  manifestHash:"m"
 });
 assert.equal(r.action,"QUARANTINE");
});

test("same export is replay",()=>{
 const r=classifyConflict({
  existingExportId:"e1",
  requestedExportId:"e1",
  idempotencyKey:"key"
 });
 assert.equal(r.action,"REPLAY");
});
