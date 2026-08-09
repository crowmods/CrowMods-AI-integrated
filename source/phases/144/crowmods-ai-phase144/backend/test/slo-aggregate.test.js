const test=require("node:test");
const assert=require("node:assert/strict");
const {aggregate}=require("../src/slo-aggregate");

test("SLO aggregate computes compliance",()=>{
 const r=aggregate([
  {createdAt:"2026-01-01T00:01:00Z",result:"MET",alertClass:"API"},
  {createdAt:"2026-01-01T00:02:00Z",result:"MISSED",alertClass:"API"},
  {createdAt:"2026-01-01T00:03:00Z",result:"MET",alertClass:"API"}
 ],{
  periodStart:"2026-01-01T00:00:00Z",
  periodEnd:"2026-01-01T01:00:00Z",
  alertClass:"API"
 });
 assert.equal(r.sampleCount,3);
 assert.equal(r.metCount,2);
 assert.equal(r.complianceRatio,0.66667);
});
