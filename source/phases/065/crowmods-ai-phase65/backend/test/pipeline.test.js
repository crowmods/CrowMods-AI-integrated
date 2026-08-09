const test=require("node:test");
const assert=require("node:assert/strict");
const {
  severityFromBurnRate,
  shouldCreateIncident,
  closureReady
}=require("../src/pipeline");

test("high burn rate becomes critical",()=>{
  assert.equal(severityFromBurnRate(5),"CRITICAL");
});

test("healthy telemetry does not create incident",()=>{
  assert.equal(shouldCreateIncident({
    healthy:true,burnRate:10,duplicate:false
  }),false);
});

test("new unhealthy telemetry creates incident",()=>{
  assert.equal(shouldCreateIncident({
    healthy:false,burnRate:3,duplicate:false
  }),true);
});

test("duplicate alert does not create another incident",()=>{
  assert.equal(shouldCreateIncident({
    healthy:false,burnRate:3,duplicate:true
  }),false);
});

test("closure requires postmortem when configured",()=>{
  assert.equal(closureReady({
    resolved:true,
    timelineComplete:true,
    postmortemRequired:true,
    postmortemComplete:false
  }),false);
});
