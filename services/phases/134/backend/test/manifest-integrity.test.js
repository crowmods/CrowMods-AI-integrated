const test=require("node:test");
const assert=require("node:assert/strict");
const {verifyPersistedIntegrity}=require("../src/manifest-integrity");

test("persisted manifest verifies",()=>{
 const r=verifyPersistedIntegrity({
  expectedPayloadHash:"a",
  expectedManifestHash:"b",
  actualPayloadHash:"a",
  actualManifestHash:"b"
 });
 assert.equal(r.status,"VERIFIED");
});
