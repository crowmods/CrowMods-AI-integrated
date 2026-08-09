const test=require("node:test"); const assert=require("node:assert/strict");
const {retentionDecision}=require("../src/retention");
test("old records become purge eligible",()=>{const r=retentionDecision({createdAt:"2020-01-01T00:00:00Z",retentionDays:30,now:"2026-01-01T00:00:00Z"}); assert.equal(r.action,"ELIGIBLE_FOR_PURGE");});
