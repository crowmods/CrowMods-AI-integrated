const test=require("node:test");
const assert=require("node:assert/strict");
const {
  buildPostmortemReport
}=require("../src/postmortem-report");

test("postmortem report includes digest",()=>{
  const result=buildPostmortemReport({
    windowDays:30,
    incidentCount:5,
    openActionCount:4,
    overdueActionCount:1,
    criticalIncidentCount:2
  });

  assert.equal(result.digest.length,64);
  assert.equal(result.windowDays,30);
});
