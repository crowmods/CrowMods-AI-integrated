const test=require("node:test");
const assert=require("node:assert/strict");
const {escalationDecision,dedupeKey}=require("../src/routing");

test("new incident notifies primary",()=>{
  assert.equal(
    escalationDecision({status:"OPEN",escalationLevel:0}).action,
    "NOTIFY_PRIMARY"
  );
});

test("acknowledged incident waits",()=>{
  assert.equal(
    escalationDecision({status:"ACKNOWLEDGED",acknowledged:true}).action,
    "WAIT_FOR_RESOLUTION"
  );
});

test("max escalation pages incident commander",()=>{
  assert.equal(
    escalationDecision({
      status:"OPEN",
      escalationLevel:3,
      maxEscalations:3
    }).action,
    "PAGE_INCIDENT_COMMANDER"
  );
});

test("dedupe key is deterministic",()=>{
  assert.equal(
    dedupeKey({
      service:"api",
      severity:"HIGH",
      alertName:"slo-breach"
    }),
    "api:HIGH:slo-breach"
  );
});
