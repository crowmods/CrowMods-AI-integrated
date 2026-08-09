const test=require("node:test");
const assert=require("node:assert/strict");
const {getCached}=require("../src/replay-cache");

test("valid cached response is returned",()=>{
 const r=getCached({
  expiresAt:"2027-01-01T00:00:00Z",
  response:{status:"VERIFIED"}
 },"2026-01-01T00:00:00Z");
 assert.equal(r.status,"HIT");
 assert.equal(r.response.status,"VERIFIED");
});

test("expired response misses",()=>{
 const r=getCached({
  expiresAt:"2025-01-01T00:00:00Z",
  response:{status:"VERIFIED"}
 },"2026-01-01T00:00:00Z");
 assert.equal(r.status,"EXPIRED");
});
