const test=require("node:test");
const assert=require("node:assert/strict");
const {evaluateQuorum}=require("../src/quorum");

test("active unique approvals satisfy quorum",()=>{
 const r=evaluateQuorum({
  approvals:[
   {actorId:"a",decision:"APPROVE",expiresAt:"2027-01-01T00:00:00Z"},
   {actorId:"b",decision:"APPROVE",expiresAt:"2027-01-01T00:00:00Z"}
  ],
  requiredApprovals:2,
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.approved,true);
});

test("expired approval does not count",()=>{
 const r=evaluateQuorum({
  approvals:[
   {actorId:"a",decision:"APPROVE",expiresAt:"2025-01-01T00:00:00Z"},
   {actorId:"b",decision:"APPROVE",expiresAt:"2027-01-01T00:00:00Z"}
  ],
  requiredApprovals:2,
  now:"2026-01-01T00:00:00Z"
 });
 assert.equal(r.approved,false);
});
