const test=require("node:test");
const assert=require("node:assert/strict");
const {
  replayDlq,
  quarantineDlq
}=require("../src/dlq-controls");

test("open DLQ item can be replayed",()=>{
  assert.equal(
    replayDlq({
      deadLetter:{
        id:"dlq-1",
        status:"OPEN"
      },
      requestedBy:"security-worker",
      replayKey:"replay-1"
    }).status,
    "REPLAYED"
  );
});

test("open DLQ item can be quarantined",()=>{
  assert.equal(
    quarantineDlq({
      deadLetter:{
        id:"dlq-1",
        status:"OPEN"
      },
      quarantinedBy:"security-admin",
      reason:"requires investigation"
    }).status,
    "QUARANTINED"
  );
});
