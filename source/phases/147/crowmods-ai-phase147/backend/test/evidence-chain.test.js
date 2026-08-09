const test=require("node:test");
const assert=require("node:assert/strict");
const {appendEvidence,verifyChain}=require("../src/evidence-chain");

test("evidence chain verifies",()=>{
 const a=appendEvidence({
  quarantineId:"q1",
  actorId:"operator",
  evidence:{ticket:"A"}
 });
 const b=appendEvidence({
  quarantineId:"q1",
  previousHash:a.chainHash,
  actorId:"operator",
  evidence:{ticket:"B"}
 });

 const r=verifyChain([
  {id:"1",evidenceHash:a.evidenceHash,
   chainHash:a.chainHash,actorId:a.actorId},
  {id:"2",evidenceHash:b.evidenceHash,
   chainHash:b.chainHash,actorId:b.actorId}
 ]);

 assert.equal(r.valid,true);
 assert.equal(r.length,2);
});
