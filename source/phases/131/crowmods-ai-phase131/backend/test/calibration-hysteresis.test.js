const test=require("node:test"); const assert=require("node:assert/strict"); const {hysteresis}=require("../src/calibration-hysteresis");
test("first expansion is held",()=>{const r=hysteresis({action:"EXPAND",previousAction:"HOLD",windowSize:100}); assert.equal(r.action,"HOLD");});
test("repeated expansion advances",()=>{const r=hysteresis({action:"EXPAND",previousAction:"EXPAND",stableCycles:1,requiredCycles:2,windowSize:100}); assert.equal(r.action,"EXPAND"); assert.equal(r.windowSize,150);});
