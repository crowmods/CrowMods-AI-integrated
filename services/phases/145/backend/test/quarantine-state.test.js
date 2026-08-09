const test=require("node:test");
const assert=require("node:assert/strict");
const {transition}=require("../src/quarantine-state");

test("review can move to reprocessing",()=>{
 const r=transition({
  currentState:"UNDER_REVIEW",
  nextState:"REPROCESSING",
  actorId:"operator",
  evidence:{ticket:"INC-1"}
 });
 assert.equal(r.status,"TRANSITIONED");
 assert.equal(r.toState,"REPROCESSING");
});
