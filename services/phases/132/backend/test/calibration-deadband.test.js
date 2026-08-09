const test=require("node:test"); const assert=require("node:assert/strict");
const {applyDeadband}=require("../src/calibration-deadband");
test("deadband waits for repeated expansion",()=>{let r=applyDeadband({action:"EXPAND",expandThreshold:1,shrinkThreshold:1,consecutiveExpand:1,windowSize:100}); assert.equal(r.action,"HOLD"); r=applyDeadband({action:"EXPAND",expandThreshold:1,shrinkThreshold:1,consecutiveExpand:2,windowSize:100}); assert.equal(r.action,"EXPAND");});
