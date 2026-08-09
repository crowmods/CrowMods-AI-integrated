const test=require("node:test");
const assert=require("node:assert/strict");
const {
  createSnapshot,
  DevelopmentSnapshotSigner
}=require("../src/timeline-snapshot");

test("snapshot receives digest and signature",()=>{
  const signer=new DevelopmentSnapshotSigner(
    "test-secret"
  );

  const result=createSnapshot({
    incidentId:"inc-1",
    version:1,
    events:[
      {type:"OPENED"}
    ],
    signer
  });

  assert.equal(result.digest.length,64);
  assert.equal(result.eventCount,1);
  assert.equal(result.signature.length>0,true);
});
