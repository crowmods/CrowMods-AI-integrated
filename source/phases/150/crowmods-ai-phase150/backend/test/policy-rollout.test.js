const test=require("node:test");
const assert=require("node:assert/strict");
const {transitionPolicy}=require("../src/policy-rollout");

test("draft policy can activate",()=>{
 const r=transitionPolicy({
  currentState:"DRAFT",
  action:"ACTIVATE",
  actorId:"operator",
  reason:"approved rollout"
 });
 assert.equal(r.state,"ACTIVE");
});

test("active policy can rollback",()=>{
 const r=transitionPolicy({
  currentState:"ACTIVE",
  action:"ROLLBACK",
  actorId:"operator",
  reason:"regression detected"
 });
 assert.equal(r.state,"ROLLED_BACK");
});
