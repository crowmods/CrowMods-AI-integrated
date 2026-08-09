const test=require("node:test");
const assert=require("node:assert/strict");
const {classifyReplay}=require("../src/replay-safeguard");

test("same export is replay",()=>{
 const r=classifyReplay({
  existingExportId:"e1",
  requestedExportId:"e1",
  payloadHash:"p",
  existingPayloadHash:"p",
  manifestHash:"m",
  existingManifestHash:"m"
 });
 assert.equal(r.state,"REPLAY");
});

test("hash conflict is blocked",()=>{
 const r=classifyReplay({
  existingExportId:"e1",
  requestedExportId:"e1",
  payloadHash:"new",
  existingPayloadHash:"old"
 });
 assert.equal(r.state,"CONFLICT");
});
