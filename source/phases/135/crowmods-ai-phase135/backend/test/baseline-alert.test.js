const test=require("node:test");
const assert=require("node:assert/strict");
const {classifyBaseline}=require("../src/baseline-alert");

test("baseline regression creates warning",()=>{
 const r=classifyBaseline({
  currentP95:130,
  baselineP95:100
 });
 assert.equal(r.severity,"WARNING");
});
