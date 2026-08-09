const test=require("node:test");
const assert=require("node:assert/strict");
const {classifyBurnRate}=require("../src/burn-severity");

test("burn rate receives critical tier",()=>{
 assert.equal(classifyBurnRate(12).severity,"CRITICAL");
});

test("burn rate receives elevated tier",()=>{
 assert.equal(classifyBurnRate(3).severity,"ELEVATED");
});
