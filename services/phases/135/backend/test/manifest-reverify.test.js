const test=require("node:test");
const assert=require("node:assert/strict");
const {reverify}=require("../src/manifest-reverify");

test("manifest can be reverified",()=>{
 const events=[{id:1}];
 const crypto=require("crypto");
 const hash=v=>crypto.createHash("sha256").update(v).digest("hex");
 const payload=JSON.stringify(events);
 const payloadHash=hash(payload);
 const manifest=JSON.stringify({
  reviewer:"op",
  payloadHash,
  eventCount:1,
  algorithm:"SHA-256"
 });
 const r=reverify({
  reviewer:"op",
  events,
  expectedPayloadHash:payloadHash,
  expectedManifestHash:hash(manifest)
 });
 assert.equal(r.result,"VERIFIED");
});
