const test=require("node:test");
const assert=require("node:assert/strict");
const {authorizeRedrive}=require("../src/redrive");

test("dead-letter item can be re-driven",()=>{
 const r=authorizeRedrive({
  status:"DEAD_LETTER",
  actorId:"operator",
  currentAttempt:2,
  maxAttempts:3,
  reason:"approved retry"
 });
 assert.equal(r.status,"AUTHORIZED");
 assert.equal(r.targetAttempt,3);
});

test("redrive cannot exceed limit",()=>{
 const r=authorizeRedrive({
  status:"DEAD_LETTER",
  actorId:"operator",
  currentAttempt:3,
  maxAttempts:3,
  reason:"retry"
 });
 assert.equal(r.status,"REJECTED");
});
