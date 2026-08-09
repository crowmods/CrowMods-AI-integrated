const test=require("node:test");
const assert=require("node:assert/strict");
const {transition}=require("../src/alert-state-machine");

test("warning escalates to critical",()=>{
 const r=transition({
  state:"WARNING",
  escalationCount:4,
  cap:10
 });
 assert.equal(r.state,"CRITICAL");
});

test("critical reaches capped state",()=>{
 const r=transition({
  state:"CRITICAL",
  escalationCount:3,
  cap:3
 });
 assert.equal(r.state,"CAPPED");
});

test("capped state begins recovery",()=>{
 const r=transition({
  state:"CAPPED",
  escalationCount:3,
  healthyCycles:3
 });
 assert.equal(r.state,"RECOVERING");
});
