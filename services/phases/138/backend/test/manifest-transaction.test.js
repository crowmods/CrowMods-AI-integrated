const test=require("node:test");
const assert=require("node:assert/strict");
const {verifyTransaction}=require("../src/manifest-transaction");

test("transactional manifest verification succeeds",()=>{
 const crypto=require("crypto");
 const hash=v=>crypto.createHash("sha256").update(v).digest("hex");
 const events=[{id:1}];
 const payload=JSON.stringify(events);
 const ph=hash(payload);
 const mh=hash(JSON.stringify({
  reviewer:"op",
  payloadHash:ph,
  eventCount:1,
  algorithm:"SHA-256"
 }));
 const r=verifyTransaction({
  reviewer:"op",
  workerId:"w1",
  exportId:"e1",
  events,
  expectedPayloadHash:ph,
  expectedManifestHash:mh
 });
 assert.equal(r.result,"VERIFIED");
});
