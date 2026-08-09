const test=require("node:test");
const assert=require("node:assert/strict");
const {buildManifest}=require("../src/export-manifest");
const {verifyManifest}=require("../src/manifest-verifier");
test("manifest verifies against original payload",()=>{
 const events=[{id:1},{id:2}];
 const m=buildManifest({reviewer:"operator",events});
 const r=verifyManifest({
  reviewer:"operator",
  events,
  expectedPayloadHash:m.payloadHash,
  expectedManifestHash:m.manifestHash
 });
 assert.equal(r.result,"VERIFIED");
});
