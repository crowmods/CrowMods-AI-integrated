const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateSLO}=require("../src/recovery-slo");

test("recovery inside target meets SLO",()=>{
 const r=evaluateSLO({
  incidentStartedAt:"2026-01-01T00:00:00Z",
  recoveredAt:"2026-01-01T00:10:00Z",
  targetSeconds:900
 });
 assert.equal(r.result,"MET");
 assert.equal(r.recoverySeconds,600);
});

test("open incident has open SLO",()=>{
 const r=evaluateSLO({
  incidentStartedAt:"2026-01-01T00:00:00Z",
  targetSeconds:900
 });
 assert.equal(r.result,"OPEN");
});
