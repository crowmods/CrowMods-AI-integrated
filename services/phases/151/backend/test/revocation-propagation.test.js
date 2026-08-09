const test=require("node:test");
const assert=require("node:assert/strict");
const {
 recalculateQuorum,
 propagateRevocation
}=require("../src/revocation-propagation");

test("revoked approval no longer satisfies quorum",()=>{
 const r=recalculateQuorum({
  approvals:[
   {actorId:"a",decision:"APPROVE",
    expiresAt:"2027-01-01T00:00:00Z"},
   {actorId:"b",decision:"APPROVE",
    expiresAt:"2027-01-01T00:00:00Z",revoked:true}
  ],
  requiredApprovals:2
 });
 assert.equal(r.activeApprovals,1);
 assert.equal(r.state,"PENDING");
});

test("revocation propagation returns dependent queues",()=>{
 const r=propagateRevocation({
  approvalId:"a1",
  actorId:"operator",
  reason:"approval revoked",
  dependents:["q1","q2"]
 });
 assert.equal(r.status,"PROPAGATED");
 assert.equal(r.dependentCount,2);
});
