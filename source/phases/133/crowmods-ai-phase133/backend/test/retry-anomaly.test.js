const test=require("node:test");
const assert=require("node:assert/strict");
const {detectRetryAnomaly}=require("../src/retry-anomaly");
test("critical retry regression is detected",()=>{
 const r=detectRetryAnomaly({currentP95:200,baselineP95:100});
 assert.equal(r.severity,"CRITICAL");
});
